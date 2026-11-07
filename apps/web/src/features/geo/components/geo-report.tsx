"use client";

// GEO 수치 칸 — 지난 30일 AI 봇 · 일반 검색 엔진 · AI 서비스 유입
import { numberText } from "@hav/shared/format";
import { DataTable } from "@hav/ui/data/data-table";
import { DateText } from "@hav/ui/text/date-text";
import { EmptyState } from "@hav/ui/feedback/empty-state";
import { SubTitle } from "@hav/ui/text/heading";
import { StatTile } from "@hav/ui/data/stat-tile";
import type { GeoReport as Report } from "@hav/shared/geo";
import type { ReactNode } from "react";
import type { Fetched } from "../../../shared/api";
import { KIND_TEXT, answerHistory, answerLines, geoView } from "../lib/geo-view";
import { useGeoReport } from "../hooks/use-geo-report";

export function GeoReport({ build }: { build: Fetched<Report> }) {
  const report = useGeoReport(build);
  if (!report.ok) return <EmptyState>측정 자료를 받지 못했습니다 ({report.reason})</EmptyState>;
  const r = report.data;
  const { ai, engines, aiHits, engineHits, referralHits } = geoView(r);
  const search = r.search;
  const answers = answerLines(r);
  const history = answerHistory(r);
  return (
    <>
      <section>
        <SubTitle>AI 답변 인용</SubTitle>
        <p className="mt-3 text-sm text-fg-2">정해 둔 질문 24개를 AI 검색에 매일 직접 묻고, 답의 출처에 이 사이트가 나왔는지 기록합니다.</p>
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
        <p className="mt-3 text-xs text-fg-2">각 서비스의 웹 검색 API 기준 · 같은 질문도 날마다 답이 달라질 수 있어 경향만 봅니다 · 답변 본문은 저장하지 않습니다</p>
      </section>

      <section className="mt-12">
        <SubTitle>구글 검색</SubTitle>
        {!search ? (
          <p className="mt-3 text-sm text-fg-2">아직 가져온 자료가 없습니다.</p>
        ) : (
          <>
            <dl className="mt-3 grid gap-3 sm:grid-cols-3">
              <StatTile label="검색 노출" value={`${numberText(search.impressions)}회`} valueClassName="text-2xl tracking-tight" />
              <StatTile label="클릭" value={`${numberText(search.clicks)}회`} valueClassName="text-2xl tracking-tight" />
              <StatTile label="평균 순위" value={search.position == null ? "자료 없음" : `${search.position}위`} valueClassName="text-2xl tracking-tight" />
            </dl>
            <p className="mt-3 text-xs text-fg-2">
              {search.firstDay && search.lastDay ? `${search.firstDay} ~ ${search.lastDay} · ` : "기록 없음 · "}Google Search Console 기준 · 구글 검색 전체 수치이며 AI 답변만 구분한 값이 아닙니다 · 며칠 늦게 반영됩니다
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
      <dl className="mt-3 grid gap-3 sm:grid-cols-3">
        <StatTile label="AI 봇 방문" value={`${numberText(aiHits)}회`} sub="학습 · 검색 색인 · 사용자 요청" valueClassName="text-2xl tracking-tight" />
        <StatTile label="일반 검색 엔진 방문" value={`${numberText(engineHits)}회`} sub="Googlebot · bingbot" valueClassName="text-2xl tracking-tight" />
        <StatTile label="AI 서비스에서 유입" value={`${numberText(referralHits)}회`} sub="ChatGPT · Claude 등에서 넘어온 방문" valueClassName="text-2xl tracking-tight" />
      </dl>
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
