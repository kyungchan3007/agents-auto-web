"use client";

// GEO 수치 — 측정 수치 카드 4개 · 읽는 법 (작업 0170 · Figma 07 시안과 같게: 흰 카드 · 시안에 없는 표는 화면에서 뺌 — 자료 가공은 lib/geo-view.ts 에 남음)
import type { GeoReport as Report } from "@hav/shared/geo";
import { EmptyState } from "@hav/ui/feedback/empty-state";
import type { Fetched } from "../../../shared/api";
import { geoCards, geoReading } from "../lib/geo-view";
import { useGeoReport } from "../hooks/use-geo-report";

export function GeoReport({ build }: { build: Fetched<Report> }) {
  const report = useGeoReport(build);
  if (!report.ok) return <EmptyState>측정 자료를 받지 못했습니다 ({report.reason})</EmptyState>;
  const r = report.data;
  return (
    <>
      <dl data-testid="geo-cards" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {geoCards(r).map((c) => (
          <div key={c.label} className="rounded-card bg-foam px-[18px] py-4">
            <dt className="text-small text-fg-2">{c.label}</dt>
            <dd className="mt-2 font-display text-[1.75rem] leading-[1.15] font-normal tracking-tight text-figure tabular-nums">{c.value}</dd>
            {c.note && <dd className="mt-1 text-small text-fg-2">{c.note}</dd>}
          </div>
        ))}
      </dl>

      <section data-testid="geo-reading" aria-labelledby="geo-reading-title" className="mt-4 rounded-card bg-foam px-6 py-5">
        <h2 id="geo-reading-title" className="text-lg font-semibold">
          이 수치를 읽는 법
        </h2>
        <ul className="mt-2 space-y-0.5 text-body text-fg-2">
          {geoReading(r).map((line) => (
            <li key={line}>• {line}</li>
          ))}
        </ul>
      </section>
    </>
  );
}
