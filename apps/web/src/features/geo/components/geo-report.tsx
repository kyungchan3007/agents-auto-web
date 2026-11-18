"use client";

// GEO 수치 — 이름 바꾼 날 전후 비교(작업 0205) · 측정 수치 카드 4개 · 읽는 법 · 자세한 기록(작업 0180: 0170 에서 뺀 표를 흰 카드로 되살림 — GeoDetail)
import type { GeoReport as Report } from "@hav/shared/geo";
import { EmptyState } from "@hav/ui/feedback/empty-state";
import type { Fetched } from "../../../shared/api";
import { geoCards, geoReading } from "../lib/geo-view";
import { useGeoReport } from "../hooks/use-geo-report";
import { GeoDetail } from "./geo-detail";
import { RenameCompare } from "./rename-compare";

export function GeoReport({ build, asOf }: { build: Fetched<Report>; asOf: string }) {
  const report = useGeoReport(build);
  if (!report.ok) return <EmptyState>측정 자료를 받지 못했습니다 ({report.reason})</EmptyState>;
  const r = report.data;
  return (
    <>
      <RenameCompare report={r} asOf={asOf} />

      <dl data-testid="geo-cards" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {geoCards(r).map((c) => (
          <div key={c.label} className="rounded-card bg-foam px-[18px] py-[18px]">
            <dt className="text-small text-fg-2">{c.label}</dt>
            <dd className="mt-2 text-[1.75rem] leading-[1.15] font-bold tracking-tight text-figure tabular-nums">{c.value}</dd>
            {c.note && <dd className="mt-[5px] text-small text-fg-2">{c.note}</dd>}
          </div>
        ))}
      </dl>

      <section data-testid="geo-reading" aria-labelledby="geo-reading-title" className="mt-6 rounded-card bg-foam px-6 pt-[22px] pb-[25px]">
        <h2 id="geo-reading-title" className="text-lg font-semibold">
          이 수치를 읽는 법
        </h2>
        <ul className="mt-1 text-body text-fg-2">
          {geoReading(r).map((line) => (
            <li key={line}>• {line}</li>
          ))}
        </ul>
      </section>

      <GeoDetail report={r} />
    </>
  );
}
