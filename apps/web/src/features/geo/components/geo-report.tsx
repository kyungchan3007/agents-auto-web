"use client";

// GEO 수치 — 맨 위 측정 수치 카드 4개 · 읽는 법 (작업 0170 · Figma 07) 아래에 자세한 기록 (AI 답변 인용 · 구글 검색 · AI 봇 · AI 서비스 유입)
import { DataTable } from "@hav/ui/data/data-table";
import { DateText } from "@hav/ui/text/date-text";
import { EmptyState } from "@hav/ui/feedback/empty-state";
import { SubTitle } from "@hav/ui/text/heading";
import type { GeoReport as Report } from "@hav/shared/geo";
import type { ReactNode } from "react";
import type { Fetched } from "../../../shared/api";
import { KIND_TEXT, answerHistory, answerLines, geoCards, geoReading, geoView } from "../lib/geo-view";
import { useGeoReport } from "../hooks/use-geo-report";

export function GeoReport({ build }: { build: Fetched<Report> }) {
  const report = useGeoReport(build);
  if (!report.ok) return <EmptyState>측정 자료를 받지 못했습니다 ({report.reason})</EmptyState>;
  const r = report.data;
  const { ai, engines } = geoView(r);
  const search = r.search;
  const answers = answerLines(r);
  const history = answerHistory(r);
  const cards = geoCards(r);
  return (
    <>
      <dl data-testid="geo-cards" className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="border-t-2 border-line pt-3">
            <dt className="text-small text-fg-2">{c.label}</dt>
            <dd className="mt-2 font-display text-city font-normal tracking-tight tabular-nums text-figure">{c.value}</dd>
            {c.note && <dd className="mt-2 text-small text-fg-2">{c.note}</dd>}
          </div>
        ))}
      </dl>

      <section data-testid="geo-reading" aria-labelledby="geo-reading-title" className="mt-12 max-w-3xl">
        <h2 id="geo-reading-title" className="font-display text-city font-normal tracking-tight">
          이 수치를 읽는 법
        </h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-body text-fg-2">
          {geoReading(r).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <section className="mt-16 border-t-2 border-line pt-8">
        <SubTitle>AI 답변 인용 기록</SubTitle>
        <p className="mt-3 text-sm text-fg-2">정해 둔 질문 24개를 Claude 웹 검색으로 직접 묻고, 검색 결과와 답의 출처에 이 사이트가 나왔는지 기록합니다.</p>
        <div className="mt-3">
          <DataTable
            head={["서비스", "최근 측정일", "저장된 질문", "답에 인용", "검색 결과에 나옴", "실패"]}
            rows={answers.map((a) => (a.measured ? [a.name, a.day, a.saved, a.cited, a.found, a.failed] : [a.name, "측정 안 함 (키 없음)", "-", "-", "-", "-"]))}
            caption="인용 · 검색 결과는 응답을 받은 질문 수 기준"
          />
        </div>
        {answers.map((a) =>
          a.measured ? (
            <details key={a.engine} className="mt-4">
              <summary className="cursor-pointer text-sm font-semibold">
                {a.name} 질문별 결과 ({a.day})
              </summary>
              <div className="mt-3">
                <DataTable head={["질문", "구분", "답에 인용", "검색 결과에 나옴", "상태"]} rows={a.results} />
              </div>
            </details>
          ) : null,
        )}
        <Block title="저장 기록" empty={history.length === 0}>
          <DataTable head={["날짜", "서비스", "저장된 질문", "응답 받음", "답에 인용"]} rows={history} caption="측정한 날마다 D1 에 저장된 질문 수" />
        </Block>
        <p className="mt-3 text-xs text-fg-2">에이전트 세션의 웹 검색 기준 (2026-11-07 ~ 09는 API 측정) · 같은 질문도 날마다 결과가 달라질 수 있어 경향만 봅니다 · 답변 본문은 저장하지 않습니다</p>
      </section>

      <section className="mt-12">
        <SubTitle>구글 검색</SubTitle>
        {!search ? (
          <p className="mt-3 text-sm text-fg-2">아직 가져온 자료가 없습니다.</p>
        ) : (
          <>
            <p className="mt-3 text-xs text-fg-2">
              평균 순위 {search.position == null ? "자료 없음" : `${search.position}위`} · {search.firstDay && search.lastDay ? `${search.firstDay} ~ ${search.lastDay} · ` : "기록 없음 · "}Google Search Console 기준 · 구글 검색 전체 수치이며 AI 답변만 구분한 값이 아닙니다 · 며칠 늦게 반영됩니다
            </p>
            <Block title="상위 검색어" empty={search.queries.length === 0}>
              <DataTable head={["검색어", "노출", "클릭", "순위"]} rows={search.queries.map((q) => [q.key, q.impressions, q.clicks, q.position])} />
            </Block>
            <Block title="검색에 나온 페이지" empty={search.pages.length === 0}>
              <DataTable head={["페이지", "노출", "클릭", "순위"]} rows={search.pages.map((q) => [q.key, q.impressions, q.clicks, q.position])} />
            </Block>
          </>
        )}
      </section>

      <SubTitle className="mt-12">AI 봇 · AI 서비스</SubTitle>
      <p className="mt-3 text-xs text-fg-2">
        지난 30일 ({r.since}부터) ·{" "}
        {r.firstDay ? (
          <>
            첫 기록 <DateText date={r.firstDay} />
          </>
        ) : (
          "아직 기록이 없습니다"
        )}
      </p>

      <Block title="AI 봇별 방문" empty={ai.length === 0}>
        <DataTable head={["봇", "용도", "횟수", "최근"]} rows={ai.map((b) => [b.name, KIND_TEXT[b.kind], b.hits, b.lastDay])} />
      </Block>
      <Block title="AI 봇이 읽은 페이지" empty={r.pages.length === 0}>
        <DataTable head={["페이지", "횟수"]} rows={r.pages.map((p) => [p.path, p.hits])} />
      </Block>
      <Block title="AI 서비스 유입" empty={r.referrals.length === 0}>
        <DataTable head={["서비스", "횟수", "최근"]} rows={r.referrals.map((x) => [x.name, x.hits, x.lastDay])} />
      </Block>
      <Block title="일반 검색 엔진" empty={engines.length === 0}>
        <DataTable head={["봇", "횟수", "최근"]} rows={engines.map((b) => [b.name, b.hits, b.lastDay])} />
      </Block>
    </>
  );
}

function Block({ title, empty, children }: { title: string; empty: boolean; children: ReactNode }) {
  return (
    <section className="mt-10">
      <SubTitle>{title}</SubTitle>
      {empty ? <p className="mt-3 text-sm text-fg-2">아직 기록이 없습니다.</p> : <div className="mt-3">{children}</div>}
    </section>
  );
}
