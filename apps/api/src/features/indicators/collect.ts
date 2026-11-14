// 과세환율 수집 — 키가 없으면 건너뜀 · 이미 받은 주는 호출하지 않음 · 어떤 실패도 던지지 않음 (환율 수집에 번지지 않게 · 작업 0163)
import { weekStartOf } from "@hav/shared/date";
import { redact } from "../../log";
import { KCS_URL, KcsError, parseKcsXml } from "./kcs";

export type IndicatorPoint = { series: string; period: string; value: number; source: "kcs" | "kosis" | "ecos"; fetchedAt: string };

export interface IndicatorStore {
  startRun(source: string, startedAt: string): Promise<number>;
  finishRun(id: number, r: { source: string; status: "ok" | "empty" | "error"; rows: number; message: string | null; finishedAt: string }): Promise<void>;
  /** 같은 (series, period) 는 덮어씀 */
  savePoints(rows: IndicatorPoint[]): Promise<number>;
  hasPeriod(series: string, period: string): Promise<boolean>;
}

export type CustomsResult = { status: "ok" | "empty" | "error" | "skipped" | "already"; rows: number; message: string | null };

const weekStart = weekStartOf;

/** 인증키 값은 어떤 글에도 남기지 않음 (AGENTS 규칙 6) — 주소의 serviceKey= 뿐 아니라 키 값 자체(원문 · 인코딩)도 지움 */
const scrub = (text: string, key: string) => {
  let t = redact(text);
  for (const k of [key, encodeURIComponent(key), encodeURI(key)]) if (k) t = t.split(k).join("***");
  return t;
};

/** 이미 URL 인코딩된 키(% 포함)로 들어와도 한 번만 인코딩되게 */
const rawKey = (key: string) => {
  if (!/%[0-9A-Fa-f]{2}/.test(key)) return key;
  try {
    return decodeURIComponent(key);
  } catch {
    return key;
  }
};

export async function collectCustomsRates(
  store: IndicatorStore,
  opts: { key?: string; today: string; fetcher?: typeof fetch; now?: () => Date },
): Promise<CustomsResult> {
  const key = opts.key?.trim();
  if (!key) return { status: "skipped", rows: 0, message: "KCS_KEY 가 없어 건너뜀" };
  const now = opts.now ?? (() => new Date());
  const doFetch = opts.fetcher ?? ((u: Parameters<typeof fetch>[0], i?: RequestInit) => fetch(u, i));
  const fail = (e: unknown): CustomsResult => ({ status: "error", rows: 0, message: scrub(e instanceof Error ? `${e.name}: ${e.message}` : String(e), key) });

  let runId: number | null = null;
  let result: CustomsResult;
  try {
    if (await store.hasPeriod("kcs-import:USD", weekStart(opts.today))) return { status: "already", rows: 0, message: null };
    runId = await store.startRun("kcs", now().toISOString());

    const url = new URL(KCS_URL);
    url.searchParams.set("serviceKey", rawKey(key));
    url.searchParams.set("aplyBgnDt", opts.today.replaceAll("-", ""));
    url.searchParams.set("weekFxrtTpcd", "2"); // 수입
    const res = await doFetch(url.toString(), { signal: AbortSignal.timeout(20_000) });
    if (!res.ok) throw new KcsError(`http-${res.status}`, `HTTP ${res.status}`);
    const rates = parseKcsXml(await res.text());
    if (rates.length === 0) {
      result = { status: "empty", rows: 0, message: "받은 항목 없음" };
    } else {
      const fetchedAt = now().toISOString();
      const rows = await store.savePoints(rates.map((r) => ({ series: `kcs-import:${r.currency}`, period: r.appliedFrom, value: r.perUnit, source: "kcs" as const, fetchedAt })));
      result = { status: "ok", rows, message: null };
    }
  } catch (e) {
    result = fail(e);
  }
  if (runId !== null && result.status !== "already") {
    try {
      await store.finishRun(runId, { source: "kcs", status: result.status as "ok" | "empty" | "error", rows: result.rows, message: result.message, finishedAt: now().toISOString() });
    } catch {
      /* 실행 기록 실패는 결과를 바꾸지 않음 */
    }
  }
  return result;
}
