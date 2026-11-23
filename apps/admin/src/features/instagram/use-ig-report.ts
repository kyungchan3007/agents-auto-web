"use client";

// 인스타 성과 받기 — 브라우저에서 /bff/ig 로 한 번 · null = 받는 중 (작업 0323 · 0324 에 알리기 탭에서 인스타 성과 화면으로)
import { type Fetched, LIVE, api } from "@hav/shared/api";
import type { IgReport } from "@hav/shared/ig";
import { useLiveOnly } from "@/shared/live/use-live-only";

const load = () => api.ig(LIVE);

export const useIgReport = (): Fetched<IgReport> | null => useLiveOnly(load);
