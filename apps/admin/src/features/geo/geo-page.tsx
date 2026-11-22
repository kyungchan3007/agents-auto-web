"use client";

// GEO 측정 (작업 0170 → 작업 0303 어드민 · 시안 Version 6) — 머리(라벨 · 제목 · 자료 기준일) → GeoReport
import type { GeoReport as Report } from "@hav/shared/geo";
import { AdminNav } from "@/shared/nav/admin-nav";
import { Stamp } from "../../shared/ui/panel/panel";
import type { Fetched } from "@hav/shared/api";
import { GeoReport } from "./report/geo-report";

export function GeoPage({ build, asOf }: { build: Fetched<Report>; asOf: string }) {
  return (
    <AdminNav page="geo">
      <div className="adm-top">
        <div>
          <p className="adm-eyebrow">GEO 측정</p>
          <h1>AI 검색에서 이 사이트가 어떻게 쓰이는지 잽니다</h1>
        </div>
        <Stamp live>자료 기준 {asOf}</Stamp>
      </div>
      <GeoReport build={build} asOf={asOf} />
    </AdminNav>
  );
}
