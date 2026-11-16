// GEO 자세한 기록 (작업 0180) — 수치 카드 아래 흰 카드 구간: AI 답변 인용 · 질문별 결과 · 날마다 기록 · Search Console · 봇 방문 · 유입
// 표는 DataTable(좁은 화면에서 가로 스크롤 감쌈) · 값이 없으면 빈 상태 글자 · 자료 가공은 lib/geo-view.ts 의 geoDetail
import type { GeoReport } from "@hav/shared/geo";
import { DataTable } from "@hav/ui/data/data-table";
import type { ReactNode } from "react";
import { geoDetail } from "../lib/geo-view";

const EMPTY = "아직 기록이 없습니다.";

function Card({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section data-testid={id} aria-labelledby={`${id}-title`} className="mt-6 rounded-card bg-foam px-6 pt-[22px] pb-[25px]">
      <h2 id={`${id}-title`} className="text-lg font-semibold">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Sub({ title, empty, children }: { title: string; empty: boolean; children: ReactNode }) {
  return (
    <div className="mt-5">
      <h3 className="text-small font-semibold">{title}</h3>
      <div className="mt-2">{empty ? <p className="text-small text-fg-2">{EMPTY}</p> : children}</div>
    </div>
  );
}

export function GeoDetail({ report }: { report: GeoReport }) {
  const d = geoDetail(report);
  const measured = d.answers.filter((a) => a.measured);
  return (
    <>
      <Card id="geo-answers" title="AI 답변 인용">
        <p className="mt-1 text-small text-fg-2">정해 둔 질문 24개를 Claude 웹 검색으로 직접 묻고, 검색 결과와 답의 출처에 이 사이트가 나왔는지 기록합니다.</p>
        <div className="mt-3">
          <DataTable
            head={["서비스", "최근 측정일", "저장된 질문", "답에 인용", "검색 결과에 나옴", "실패"]}
            rows={d.answers.map((a) => (a.measured ? [a.name, a.day, a.saved, a.cited, a.found, a.failed] : [a.name, "측정 안 함 (키 없음)", "-", "-", "-", "-"]))}
            caption="인용 · 검색 결과는 응답을 받은 질문 수 기준"
          />
        </div>
        {measured.map((a) =>
          a.measured ? (
            <details key={a.engine} data-testid="geo-questions" className="mt-4">
              <summary className="cursor-pointer text-small font-semibold">
                {a.name} 질문별 결과 ({a.day}) · {a.results.length}개
              </summary>
              <div className="mt-3">
                <DataTable head={["질문", "구분", "답에 인용", "검색 결과에 나옴", "상태"]} rows={a.results} />
              </div>
            </details>
          ) : null,
        )}
        <Sub title="측정한 날마다 기록" empty={d.history.length === 0}>
          <DataTable head={["날짜", "서비스", "저장된 질문", "응답 받음", "답에 인용"]} rows={d.history} caption="측정한 날마다 D1 에 저장된 질문 수" />
        </Sub>
      </Card>

      <Card id="geo-search" title="구글 검색 노출 (Search Console)">
        {!d.search ? (
          <p className="mt-2 text-small text-fg-2">아직 가져온 자료가 없습니다.</p>
        ) : (
          <>
            <dl className="mt-3 grid gap-3 sm:grid-cols-4">
              {[
                ["기간", d.search.range],
                ["노출", d.search.impressions],
                ["클릭", d.search.clicks],
                ["평균 순위", d.search.position],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-small text-fg-2">{label}</dt>
                  <dd className="mt-1 font-semibold tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-small text-fg-2">Google Search Console 기준 · 구글 검색 전체 수치이며 AI 답변만 구분한 값이 아닙니다 · 며칠 늦게 반영됩니다</p>
            <Sub title="상위 검색어" empty={d.search.queries.length === 0}>
              <DataTable head={["검색어", "노출", "클릭", "순위"]} rows={d.search.queries} />
            </Sub>
            <Sub title="검색에 나온 페이지" empty={d.search.pages.length === 0}>
              <DataTable head={["페이지", "노출", "클릭", "순위"]} rows={d.search.pages} />
            </Sub>
          </>
        )}
      </Card>

      <Card id="geo-bots" title="AI 봇 · 검색 엔진 봇 방문">
        <p className="mt-1 text-small text-fg-2">{d.period}</p>
        <Sub title="AI 봇별 방문" empty={d.aiBots.length === 0}>
          <DataTable head={["봇", "용도", "횟수", "최근"]} rows={d.aiBots} />
        </Sub>
        <Sub title="AI 봇이 읽은 페이지" empty={d.aiPages.length === 0}>
          <DataTable head={["페이지", "횟수"]} rows={d.aiPages} />
        </Sub>
        <Sub title="일반 검색 엔진" empty={d.engineBots.length === 0}>
          <DataTable head={["봇", "횟수", "최근"]} rows={d.engineBots} />
        </Sub>
        <Sub title="AI 서비스 유입" empty={d.referrals.length === 0}>
          <DataTable head={["서비스", "횟수", "최근"]} rows={d.referrals} />
        </Sub>
      </Card>
    </>
  );
}
