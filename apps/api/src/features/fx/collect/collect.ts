// 하루치 환율 수집 — 수출입은행 먼저, "실패"면 Frankfurter 예비 (데이터 없는 날은 넘어가지 않음)
import { fetchFrankfurter } from "../sources/frankfurter";
import { fetchKoreaexim } from "../sources/koreaexim";
import { type RateRow, SourceError, isWeekend } from "../sources/rate";

/** 저장하는 쪽 — D1 구현은 store.ts, 테스트는 메모리 */
export interface RateStore {
  startRun(source: string, startedAt: string): Promise<number>;
  finishRun(id: number, r: { source: string; status: "ok" | "empty" | "error"; rows: number; message: string | null; finishedAt: string }): Promise<void>;
  /** koreaexim 은 덮어쓰고, frankfurter 는 이미 있는 줄을 건드리지 않는다 (공식 원화 환율 우선) */
  saveRates(rows: RateRow[]): Promise<number>;
  /** 공식 출처(수출입은행)가 최근에 준 통화 — 예비는 이 통화만 채움 (작업 0098) · 없거나 빈 목록이면 거르지 않음 (처음 수집) */
  officialCurrencies?(): Promise<string[]>;
}

export type CollectResult = { date: string; status: "ok" | "empty" | "error"; source: string; rows: number; message: string | null };

export async function collectDay(
  store: RateStore,
  date: string,
  opts: { koreaeximKey?: string; fetcher?: typeof fetch; now?: () => Date; fallback?: boolean; retryDelays?: number[]; sleep?: (ms: number) => Promise<void> } = {},
): Promise<CollectResult> {
  const now = opts.now ?? (() => new Date());
  const runId = await store.startRun("koreaexim", now().toISOString());
  let source = "koreaexim";
  let message: string | null = null;
  const retried: string[] = [];

  const finish = async (status: CollectResult["status"], rows: number) => {
    await store.finishRun(runId, { source, status, rows, message, finishedAt: now().toISOString() });
    return { date, status, source, rows, message };
  };

  try {
    let rows: RateRow[];
    try {
      rows = await fetchWithRetry(() => fetchKoreaexim(date, opts.koreaeximKey, opts.fetcher, now), opts.retryDelays ?? [], opts.sleep ?? wait, (code) => {
        retried.push(code);
      });
      // 다시 시도해 성공한 날 — 상태는 ok 지만 몇 번 실패했는지 남김 (이슈 #128 · 끊김이 얼마나 이어지는지 보려고)
      if (retried.length > 0) message = `koreaexim retried-${retried.length}: 앞선 실패 ${retried.join(" · ")}`;
    } catch (e) {
      if (!(e instanceof SourceError)) throw e;
      // 수출입은행 실패 → 예비. 수출입은행처럼 영업일만: 주말은 채우지 않고, 요청한 날짜의 줄만 쓴다 (FX-02)
      message = `koreaexim ${e.code}: ${e.message}${retried.length > 0 ? ` (다시 시도 ${retried.length}회 · ${retried.join(" · ")})` : ""}`;
      // 이미 값이 있는 날을 공식 값으로 바꾸려는 시도 — 예비를 또 받지 않음 (저장 · 캐시 비우기만 늘어남 · 작업 0121)
      if (opts.fallback === false) return finish("error", 0);
      source = "koreaexim→frankfurter";
      rows = isWeekend(date) ? [] : (await fetchFrankfurter(date, opts.fetcher, now)).filter((r) => r.date === date);
      // 예비는 통화가 160개 넘게 와서, 그날만 목록이 22개 → 160개로 늘어남 — 공식 출처가 주던 통화만 (FX-03 은 공식 출처 기준 · 작업 0098)
      const known = new Set((await store.officialCurrencies?.()) ?? []);
      if (known.size > 0) rows = rows.filter((r) => known.has(r.currency));
    }
    if (rows.length === 0) return finish("empty", 0);
    return finish("ok", await store.saveRates(rows));
  } catch (e) {
    message = [message, e instanceof Error ? e.message : String(e)].filter(Boolean).join(" / ");
    return finish("error", 0);
  }
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** 서버 쪽 일시 오류(HTTP 5xx)인지 — 인증 · 형식 · 한도 오류는 다시 해도 같으므로 빼고 넘김 */
export function isTransient(e: unknown): e is SourceError {
  return e instanceof SourceError && /^http-5\d\d$/.test(e.code);
}

/**
 * 일시 오류면 delays 간격으로 다시 시도 · 마지막 실패는 그대로 던짐
 * 2026-11-09 ~ 12 평일 12:00 수집이 HTTP 525 로 실패하고 13:30 재시도는 성공 — 끊김이 짧은지 같은 실행 안에서 확인 (작업 0156 · 이슈 #128)
 */
export async function fetchWithRetry<T>(run: () => Promise<T>, delays: number[], sleep: (ms: number) => Promise<void>, onRetry: (code: string) => void = () => {}): Promise<T> {
  for (let i = 0; ; i++) {
    try {
      return await run();
    } catch (e) {
      if (!isTransient(e) || i >= delays.length) throw e;
      onRetry(e.code);
      await sleep(delays[i]);
    }
  }
}
