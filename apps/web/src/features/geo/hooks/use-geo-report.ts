"use client";

// GEO 수치 받기 — 빌드 때 받은 값을 먼저 · 브라우저에서 /bff/geo 로 한 번 더 (사이트를 다시 빌드하지 않아도 최신)
import type { GeoReport } from "@hav/shared/geo";
import { useLive } from "@hav/ui/hooks/use-live";
import { type Fetched, LIVE, api } from "../../../shared/api";

const load = () => api.geo(LIVE);

export const useGeoReport = (build: Fetched<GeoReport>) => useLive(build, load);
