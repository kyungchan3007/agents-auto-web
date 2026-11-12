// 평일 환율 예약 실행 — 수집 · 놓친 날 다시 · 수집되면 사이트 다시 빌드 (작업 0094)
//   2026-10-30 12:00 KST 예약 수집이 아예 돌지 않음 (02:56 UTC 에 Worker 를 배포 — 예약 바뀜이 퍼지는 동안 놓친 것으로 봄)
//   → 13:30 · 15:00 KST 에 "오늘 값이 없으면" 다시 수집 · 이미 있으면 아무것도 안 함 (D1 한 줄 읽기)
//   → 새 값을 저장하면 Pages 배포 훅을 바로 부름 — GitHub 예약(rebuild-site)은 몇 시간씩 늦어서 예비로만
import { type CollectResult, type RateStore, collectDay } from "./collect";

export type DailyDeps = {
  store: RateStore;
  /** 그 날짜(한국 날짜) 환율이 이미 저장됐는지 */
  hasRates: (date: string) => Promise<boolean>;
  /** 그 날짜 공식(수출입은행) 값이 있는지 — 예비 값만 있으면 다시 시도 (작업 0121) */
  hasOfficialRates: (date: string) => Promise<boolean>;
  koreaeximKey?: string;
  /** Cloudflare Pages 배포 훅 주소 — 없으면 다시 빌드 안 함 */
  deployHook?: string;
  fetcher?: typeof fetch;
  now?: () => Date;
  /** 첫 예약에서 수출입은행 5xx 일 때 다시 시도할 간격(ms) — 없으면 한 번만 (작업 0156) */
  retryDelays?: number[];
  sleep?: (ms: number) => Promise<void>;
};

export type DailyResult = { skipped: true } | (CollectResult & { skipped: false; rebuild: "requested" | "no-hook" | "failed" | "not-needed" });

/**
 * retry=true(다시 하는 예약)는 오늘 공식 값이 있으면 건너뜀 · 첫 예약은 항상 수집 (수출입은행 값이 예비 값을 덮게 FX-05)
 * 예비 값만 있어도 건너뛰던 것 고침 — 12:00 한 번 실패하면 그날은 예비로 끝났음 (2026-11-02 ~ 05 · 작업 0121)
 */
export async function dailyFx(date: string, retry: boolean, deps: DailyDeps): Promise<DailyResult> {
  if (retry && (await deps.hasOfficialRates(date))) return { skipped: true };
  // 이미 값이 있으면 다시 시도가 실패해도 예비를 또 받지 않음 · 그때는 값이 안 바뀌어 다시 빌드도 없음
  const had = retry && (await deps.hasRates(date));
  const r = await collectDay(deps.store, date, { koreaeximKey: deps.koreaeximKey, fetcher: deps.fetcher, now: deps.now, fallback: !had, retryDelays: retry ? [] : deps.retryDelays, sleep: deps.sleep });
  if (r.status !== "ok" || r.rows === 0) return { ...r, skipped: false, rebuild: "not-needed" };
  if (!deps.deployHook) return { ...r, skipped: false, rebuild: "no-hook" };
  try {
    const res = await (deps.fetcher ?? fetch)(deps.deployHook, { method: "POST" });
    return { ...r, skipped: false, rebuild: res.ok ? "requested" : "failed" };
  } catch {
    return { ...r, skipped: false, rebuild: "failed" };
  }
}
