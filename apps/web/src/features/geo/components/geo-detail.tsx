// GEO 자세한 기록 — 작업 0214 시안 B: 표 대신 같은 크기 카드 4장(넓은 화면 2열 · 휴대폰 1열) — AI 답변(날마다 막대) · 봇 방문(가로 막대) · 읽은 페이지(가로 막대) · 검색 노출 · 유입
// 막대마다 같은 숫자를 글로 함께 둠(검색 · AI 가 읽는 HTML) · 값이 없으면 빈 상태 글자 · 질문별 결과 · 검색어 표는 그대로(DataTable) · 자료 가공은 lib/geo-view.ts 의 geoDetail · 막대 계산은 lib/geo-bars.ts
import type { GeoReport } from "@hav/shared/geo";
import { DataTable } from "@hav/ui/data/data-table";
import type { ReactNode } from "react";
import { barRows, dayColumns } from "../lib/geo-bars";
import { GEO_EDITION_NOTES, KIND_TEXT, geoDetail } from "../lib/geo-view";
import { BarList, DayBars } from "./geo-bars";

const EMPTY = "아직 기록이 없습니다.";

function Card({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section data-testid={id} aria-labelledby={`${id}-title`} className="min-w-0 rounded-card bg-foam px-6 py-5">
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
      <div className="mt-2">{empty ? <p className="rounded-card border-2 border-dashed border-line px-3 py-3 text-small text-fg-2">{EMPTY}</p> : children}</div>
    </div>
  );
}

export function GeoDetail({ report }: { report: GeoReport }) {
  const d = geoDetail(report);
  const measured = d.answers.filter((a) => a.measured);
  const columns = dayColumns(report.answers?.history ?? []);
  const ai = report.bots.filter((b) => b.kind !== "engine");
  const engines = report.bots.filter((b) => b.kind === "engine");
  const byHits = <T extends { hits: number }>(list: T[]) => [...list].sort((a, b) => b.hits - a.hits);
  return (
    <div data-testid="geo-grid" className="mt-6 grid gap-4 min-[701px]:grid-cols-2">
      <Card id="geo-answers" title="AI 답변 인용">
        <p className="mt-1 text-small text-fg-2">정해 둔 질문 24개를 Claude 웹 검색으로 직접 묻고, 검색 결과와 답의 출처에 이 사이트가 나왔는지 기록합니다.</p>
        {measured.map((a) =>
          a.measured ? (
            <p key={a.engine} className="mt-2 text-small font-semibold tabular-nums">
              {a.name} · {columns.length}일 측정 · 인용 {a.cited} · 검색 결과 {a.found} · 최근 {a.day}
              {a.failed > 0 ? ` · 실패 ${a.failed}` : ""}
            </p>
          ) : null,
        )}
        {d.answers.some((a) => !a.measured) && <p className="mt-1 text-small text-fg-2">{d.answers.filter((a) => !a.measured).map((a) => a.name).join(" · ")} 는 키가 없어 측정 안 함</p>}
        <Sub title="측정한 날마다 기록" empty={columns.length === 0}>
          <p className="text-small text-fg-2">막대 = 그날 응답 받은 질문 수 · 노란 점 = 답에 인용 · 점선 = 측정 실패 (측정하지 않은 날은 비워 둠)</p>
          <DayBars columns={columns} />
        </Sub>
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
        <ul data-testid="geo-editions" className="mt-4 list-disc space-y-1 pl-5 text-small text-fg-2">
          {GEO_EDITION_NOTES.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </Card>

      <Card id="geo-bots" title="AI 봇 · 검색 엔진 봇 방문">
        <p className="mt-1 text-small text-fg-2">{d.period}</p>
        <Sub title="AI 봇별 방문" empty={ai.length === 0}>
          <p className="text-small text-fg-2">{ai.map((b) => `${b.name} ${KIND_TEXT[b.kind]}`).join(" · ")} (최근 방문 {ai.map((b) => b.lastDay).sort().at(-1)})</p>
          <BarList rows={barRows(byHits(ai).map((b) => ({ label: b.name, value: b.hits })))} />
        </Sub>
        <Sub title="일반 검색 엔진" empty={engines.length === 0}>
          <BarList tone="accent" rows={barRows(byHits(engines).map((b) => ({ label: b.name, value: b.hits })))} />
        </Sub>
      </Card>

      <Card id="geo-pages" title="AI 봇이 읽은 페이지">
        <p className="mt-1 text-small text-fg-2">AI 봇이 읽은 횟수 (일반 검색 엔진 제외)</p>
        <Sub title="페이지별 횟수" empty={report.pages.length === 0}>
          <BarList rows={barRows(report.pages.map((p) => ({ label: p.path, value: p.hits })))} />
        </Sub>
      </Card>

      <Card id="geo-search" title="구글 검색 노출 (Search Console)">
        {!d.search ? (
          <p className="mt-2 text-small text-fg-2">아직 가져온 자료가 없습니다.</p>
        ) : (
          <>
            <dl className="mt-3 grid grid-cols-3 gap-2.5">
              {[
                ["노출", d.search.impressions],
                ["클릭", d.search.clicks],
                ["평균 순위", d.search.position],
              ].map(([label, value]) => (
                <div key={label} className="rounded-card bg-surface px-3 py-2.5">
                  <dt className="text-small text-fg-2">{label}</dt>
                  <dd className="mt-0.5 text-[1.375rem] leading-tight font-bold text-cheap tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-small text-fg-2">기간 {d.search.range} · Google Search Console 기준 · 구글 검색 전체 수치이며 AI 답변만 구분한 값이 아닙니다 · 며칠 늦게 반영됩니다</p>
            <Sub title="상위 검색어" empty={d.search.queries.length === 0}>
              <DataTable head={["검색어", "노출", "클릭", "순위"]} rows={d.search.queries} />
            </Sub>
            <Sub title="검색에 나온 페이지" empty={d.search.pages.length === 0}>
              <DataTable head={["페이지", "노출", "클릭", "순위"]} rows={d.search.pages} />
            </Sub>
          </>
        )}
        <Sub title="AI 서비스 유입" empty={d.referrals.length === 0}>
          <DataTable head={["서비스", "횟수", "최근"]} rows={d.referrals} />
        </Sub>
      </Card>
    </div>
  );
}
