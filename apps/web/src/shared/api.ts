// API 받기 — 빌드 때 부르고 @hav/shared 스키마로 검사 · 실패해도 던지지 않고 이유를 돌려준다 (빌드가 깨지지 않게)
import { type Fetched, type FetchOptions, fetchJson } from "@hav/shared/fetched";
import { FxChanges, FxHistory, FxLatest } from "@hav/shared/fx";
import { PriceLevels } from "@hav/shared/prices";
import { CurrencySignal, SignalList } from "@hav/shared/signal";
import { GeoReport } from "@hav/shared/geo";
import { SiteStatus } from "@hav/shared/status";
import { TasksSummary } from "@hav/shared/tasks";
import type { z } from "zod";

export const DEFAULT_API = "https://tripfx-api.developfff.workers.dev";

export type { Fetched };

export type ApiOptions = FetchOptions & { base?: string };

const apiBase = (base?: string) => (base ?? process.env.TRIPFX_API_URL ?? DEFAULT_API).replace(/\/$/, "");

/** 한 경로를 받아 스키마로 검사 — 받는 규칙은 @hav/shared/fetched · 주소만 이 사이트 설정 */
export const getJson = <T extends z.ZodType>(path: string, schema: T, opts: ApiOptions = {}) => fetchJson(`${apiBase(opts.base)}${path}`, schema, opts);

/** 브라우저에서 같은 주소의 BFF 로 받을 때 */
export const LIVE: ApiOptions = { base: "/bff", timeoutMs: 8_000 };

/**
 * 운영 배포 빌드(Cloudflare Pages · main)에서 꼭 필요한 자료를 못 받으면 빌드를 멈춤 — 실패한 빌드는 배포되지 않아 예전 사이트가 그대로 남음
 * 2026-10-29 D1 읽기 한도 초과로 API 가 500 일 때, 그대로 빌드하면 멀쩡한 사이트를 "자료 없음" 으로 덮을 뻔했음 (작업 0076)
 * 미리보기 · 로컬 빌드는 지금처럼 "자료 없음" 화면으로 (FX-02)
 */
export function mustHave<T>(f: Fetched<T>, what: string, env: Record<string, string | undefined> = process.env): Fetched<T> {
  if (!f.ok && env.CF_PAGES === "1" && env.CF_PAGES_BRANCH === "main") throw new Error(`운영 빌드 멈춤: ${what} 을 받지 못함 (${f.reason}) — 예전 배포를 그대로 둠`);
  return f;
}

export const api = {
  latest: (o?: ApiOptions) => getJson("/fx/latest", FxLatest, o),
  changes: (days: number, o?: ApiOptions) => getJson(`/fx/changes?days=${days}`, FxChanges, o),
  history: (currency: string, days: number, o?: ApiOptions) => getJson(`/fx/${encodeURIComponent(currency)}/history?days=${days}`, FxHistory, o),
  signals: (o?: ApiOptions) => getJson("/signal", SignalList, o),
  signal: (currency: string, o?: ApiOptions) => getJson(`/signal/${encodeURIComponent(currency)}`, CurrencySignal, o),
  priceLevels: (o?: ApiOptions) => getJson("/prices/levels?base=KOR", PriceLevels, o),
  tasks: (o?: ApiOptions) => getJson("/tasks", TasksSummary, o),
  status: (o?: ApiOptions) => getJson("/status", SiteStatus, o),
  geo: (o?: ApiOptions) => getJson("/geo", GeoReport, o),
};
