"use client";

// GEO 수치 칸 — 지난 30일 AI 봇 · 일반 검색 엔진 · AI 서비스 유입
import { DateText } from "@hav/ui/date-text";
import { EmptyState } from "@hav/ui/empty-state";
import { StatTile } from "@hav/ui/stat-tile";
import type { GeoReport as Report } from "@hav/shared/geo";
import type { ReactNode } from "react";
import type { Fetched } from "../../shared/api";
import { KIND_TEXT, geoView } from "./geo-view";
import { useGeoReport } from "./use-geo-report";

export function GeoReport({ build }: { build: Fetched<Report> }) {
  const report = useGeoReport(build);
  if (!report.ok) return <EmptyState>측정 자료를 받지 못했습니다 ({report.reason})</EmptyState>;
  const r = report.data;
  const { ai, engines, aiHits, engineHits, referralHits } = geoView(r);
  return (
    <>
      <dl className="grid gap-3 sm:grid-cols-3">
        <StatTile label="AI 봇 방문" value={`${aiHits.toLocaleString("ko-KR")}회`} sub="학습 · 검색 색인 · 사용자 요청" valueClassName="text-2xl tracking-tight" />
        <StatTile label="일반 검색 엔진 방문" value={`${engineHits.toLocaleString("ko-KR")}회`} sub="Googlebot · bingbot" valueClassName="text-2xl tracking-tight" />
        <StatTile label="AI 서비스에서 유입" value={`${referralHits.toLocaleString("ko-KR")}회`} sub="ChatGPT · Claude 등에서 넘어온 방문" valueClassName="text-2xl tracking-tight" />
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
        <HitTable head={["봇", "용도", "횟수", "최근"]} rows={ai.map((b) => [b.name, KIND_TEXT[b.kind], b.hits, b.lastDay])} />
      </Block>
      <Block title="AI 봇이 읽은 페이지" empty={r.pages.length === 0}>
        <HitTable head={["페이지", "횟수"]} rows={r.pages.map((p) => [p.path, p.hits])} />
      </Block>
      <Block title="AI 서비스 유입" empty={r.referrals.length === 0}>
        <HitTable head={["서비스", "횟수", "최근"]} rows={r.referrals.map((x) => [x.name, x.hits, x.lastDay])} />
      </Block>
      <Block title="일반 검색 엔진" empty={engines.length === 0}>
        <HitTable head={["봇", "횟수", "최근"]} rows={engines.map((b) => [b.name, b.hits, b.lastDay])} />
      </Block>
    </>
  );
}

function Block({ title, empty, children }: { title: string; empty: boolean; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {empty ? <p className="mt-3 text-sm text-fg-2">아직 기록이 없습니다.</p> : <div className="mt-3">{children}</div>}
    </section>
  );
}

function HitTable({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-xs text-fg-2">
          <tr>
            {head.map((h) => (
              <th key={h} scope="col" className="py-1.5 pr-3 font-normal whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line border-t border-line text-fg">
          {rows.map((row) => (
            <tr key={String(row[0])}>
              {row.map((c, i) => (
                <td key={`${head[i]}`} className="py-2 pr-3 whitespace-nowrap">
                  {typeof c === "number" ? c.toLocaleString("ko-KR") : c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
