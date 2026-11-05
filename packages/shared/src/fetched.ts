// JSON 받기 — 스키마로 검사 · 실패해도 던지지 않고 이유를 돌려준다 (빌드 · 화면이 깨지지 않게) · 주소는 부르는 쪽이 정함 (작업 0136)
import type { z } from "zod";

export type Fetched<T> = { ok: true; data: T } | { ok: false; reason: string };

export type FetchOptions = { fetcher?: typeof fetch; timeoutMs?: number; headers?: Record<string, string>; retries?: number; retryDelayMs?: number };

/** 다시 받아 볼 만한 실패 — 연결 끊김 · 시간 초과 · 서버 오류 · 너무 많은 요청 (모양 다름 · 4xx 는 다시 해도 같아서 바로 실패) */
const retryable = (reason: string) => reason === "연결 실패" || reason === "시간 초과" || /^HTTP (5\d\d|429)$/.test(reason);

/**
 * 한 주소를 받아 스키마로 검사 — 연결 실패 · 시간 초과 · HTTP 오류 · 모양 다름은 모두 { ok: false }
 * 빌드 때 운영 API 연결이 가끔 끊겨(ECONNRESET) 통화 페이지가 달러 하나만 만들어진 적이 있어 짧게 두 번 더 받아 봄 (작업 0076)
 */
export async function fetchJson<T extends z.ZodType>(url: string, schema: T, opts: FetchOptions = {}): Promise<Fetched<z.infer<T>>> {
  const { retries = 2, retryDelayMs = 500 } = opts;
  let last = await fetchOnce(url, schema, opts);
  for (let i = 0; i < retries && !last.ok && retryable(last.reason); i++) {
    await new Promise((r) => setTimeout(r, retryDelayMs * (i + 1)));
    last = await fetchOnce(url, schema, opts);
  }
  return last;
}

async function fetchOnce<T extends z.ZodType>(url: string, schema: T, opts: FetchOptions): Promise<Fetched<z.infer<T>>> {
  try {
    const res = await (opts.fetcher ?? fetch)(url, { headers: opts.headers, signal: AbortSignal.timeout(opts.timeoutMs ?? 10_000) });
    if (!res.ok) return { ok: false, reason: `HTTP ${res.status}` };
    const parsed = schema.safeParse(await res.json());
    if (!parsed.success) return { ok: false, reason: `응답 모양이 다름: ${parsed.error.issues[0]?.path.join(".")} ${parsed.error.issues[0]?.message}` };
    return { ok: true, data: parsed.data };
  } catch (e) {
    const name = e instanceof Error ? e.name : "";
    return { ok: false, reason: name === "TimeoutError" ? "시간 초과" : "연결 실패" };
  }
}

/** 새로 받은 게 성공이면 그것 · 아니면 먼저 있던 것 (먼저 있던 것도 실패면 그 이유) */
export const pickLive = <T>(first: Fetched<T>, live: Fetched<T> | null): Fetched<T> => (live?.ok ? live : first);
