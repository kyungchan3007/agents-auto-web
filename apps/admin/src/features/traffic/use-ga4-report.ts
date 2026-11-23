"use client";

// GA4 유입 받기 — 브라우저에서 /bff/ga4 로 한 번 · null = 받는 중 (작업 0324)
import { type Fetched, LIVE, api } from "@hav/shared/api";
import type { Ga4Report } from "@hav/shared/ga4";
import { useLiveOnly } from "@/shared/live/use-live-only";

const load = () => api.ga4(LIVE);

export const useGa4Report = (): Fetched<Ga4Report> | null => useLiveOnly(load);
