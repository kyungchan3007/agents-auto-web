"use client";

// GEO 수치 받기 — 빌드 때 받은 값을 먼저 · 브라우저에서 /bff/geo 로 한 번 더 (사이트를 다시 빌드하지 않아도 최신)
import { GeoReport } from "@hav/shared/geo";
import { useEffect, useState } from "react";
import { type Fetched, getJson } from "../../shared/api";

export function useGeoReport(build: Fetched<GeoReport>, base = "/bff"): Fetched<GeoReport> {
  const [live, setLive] = useState<Fetched<GeoReport> | null>(null);
  useEffect(() => {
    let stopped = false;
    void getJson("/geo", GeoReport, { base, timeoutMs: 8_000 }).then((r) => {
      if (!stopped && r.ok) setLive(r);
    });
    return () => {
      stopped = true;
    };
  }, [base]);
  return live ?? build;
}
