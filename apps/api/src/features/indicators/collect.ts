// 과세환율 수집 — 키가 없으면 건너뜀 · 이미 받은 주는 호출하지 않음 · 어떤 실패도 던지지 않음 (환율 수집에 번지지 않게 · 작업 0163)
import { kstNow, weekStartOf } from "@hav/shared/date";
import { redact } from "../../log";
import { EcosError, ecosUrl, parseEcosJson } from "./ecos";
import { KCS_URL, KcsError, parseKcsXml } from "./kcs";
import { KOSIS_ITEMS, KOSIS_URL, KosisError, parseKosisJson } from "./kosis";

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

/** YYYYMM 에서 months 달 전 */
const monthsBefore = (d: Date, months: number) => {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - months, 1));
  return `${t.getUTCFullYear()}${String(t.getUTCMonth() + 1).padStart(2, "0")}`;
};

/**
 * KOSIS 소비자물가(여행 품목) 수집 — 최근 24개월을 다시 받아 덮어씀 (고침 반영 · 발표가 늦은 달 채우기)
 * 품목마다 따로 요청 · 따로 실행 기록 · 한 품목이 실패해도 다른 품목은 저장 · 어떤 실패도 던지지 않음 (작업 0164)
 */
export async function collectKosis(store: IndicatorStore, opts: { key?: string; now?: () => Date; fetcher?: typeof fetch }): Promise<CustomsResult> {
  const key = opts.key?.trim();
  if (!key) return { status: "skipped", rows: 0, message: "KOSIS_KEY 가 없어 건너뜀" };
  const now = opts.now ?? (() => new Date());
  const doFetch = opts.fetcher ?? ((u: Parameters<typeof fetch>[0], i?: RequestInit) => fetch(u, i));
  const kst = kstNow(now());
  const end = monthsBefore(kst, 0);
  const start = monthsBefore(kst, 23); // 끝 달 포함 24개월
  let rows = 0;
  let okItems = 0;
  const errors: string[] = [];

  for (const item of KOSIS_ITEMS) {
    let runId: number | null = null;
    let status: "ok" | "empty" | "error" = "error";
    let saved = 0;
    let message: string | null = null;
    try {
      runId = await store.startRun("kosis", now().toISOString());
      const url = new URL(KOSIS_URL);
      for (const [k, v] of Object.entries({ method: "getList", apiKey: key, orgId: "101", tblId: "DT_1J22001", itmId: "T", objL1: "T10", objL2: item.objL2, prdSe: "M", startPrdDe: start, endPrdDe: end, format: "json", jsonVD: "Y" })) url.searchParams.set(k, v);
      const res = await doFetch(url.toString(), { signal: AbortSignal.timeout(20_000) });
      if (!res.ok) throw new KosisError(`http-${res.status}`, `HTTP ${res.status}`);
      let body: unknown;
      try {
        body = JSON.parse(await res.text());
      } catch {
        throw new KosisError("shape", "KOSIS 응답이 JSON 이 아닙니다");
      }
      const points = parseKosisJson(body);
      if (points.length === 0) {
        status = "empty";
      } else {
        const fetchedAt = now().toISOString();
        saved = await store.savePoints(points.map((p) => ({ series: item.series, period: p.period, value: p.value, source: "kosis" as const, fetchedAt })));
        status = "ok";
      }
    } catch (e) {
      message = scrub(e instanceof Error ? `${e.name}: ${e.message}` : String(e), key);
      errors.push(`${item.key}: ${message}`);
    }
    rows += saved;
    if (status === "ok") okItems++;
    if (runId !== null) {
      try {
        await store.finishRun(runId, { source: "kosis", status, rows: saved, message, finishedAt: now().toISOString() });
      } catch {
        /* 실행 기록 실패는 결과를 바꾸지 않음 */
      }
    }
  }
  if (okItems > 0) return { status: "ok", rows, message: errors.length > 0 ? errors.join(" · ") : null };
  if (errors.length > 0) return { status: "error", rows: 0, message: errors.join(" · ") };
  return { status: "empty", rows: 0, message: "받은 항목 없음" };
}

/** ECOS 수입물가지수 수집 — 요청 하나 · 최근 24개월을 다시 받아 덮어씀 · 어떤 실패도 던지지 않음 (작업 0165) */
export async function collectEcos(store: IndicatorStore, opts: { key?: string; now?: () => Date; fetcher?: typeof fetch }): Promise<CustomsResult> {
  const key = opts.key?.trim();
  if (!key) return { status: "skipped", rows: 0, message: "ECOS_KEY 가 없어 건너뜀" };
  const now = opts.now ?? (() => new Date());
  const doFetch = opts.fetcher ?? ((u: Parameters<typeof fetch>[0], i?: RequestInit) => fetch(u, i));
  const kst = kstNow(now());
  let runId: number | null = null;
  let result: CustomsResult;
  try {
    runId = await store.startRun("ecos", now().toISOString());
    const res = await doFetch(ecosUrl(key, monthsBefore(kst, 23), monthsBefore(kst, 0)), { signal: AbortSignal.timeout(20_000) });
    if (!res.ok) throw new EcosError(`http-${res.status}`, `HTTP ${res.status}`);
    let body: unknown;
    try {
      body = JSON.parse(await res.text());
    } catch {
      throw new EcosError("shape", "ECOS 응답이 JSON 이 아닙니다");
    }
    const points = parseEcosJson(body);
    if (points.length === 0) {
      result = { status: "empty", rows: 0, message: "받은 항목 없음" };
    } else {
      const fetchedAt = now().toISOString();
      const rows = await store.savePoints(points.map((p) => ({ series: "ecos-import-price:krw", period: p.period, value: p.value, source: "ecos" as const, fetchedAt })));
      result = { status: "ok", rows, message: null };
    }
  } catch (e) {
    result = { status: "error", rows: 0, message: scrub(e instanceof Error ? `${e.name}: ${e.message}` : String(e), key) };
  }
  if (runId !== null) {
    try {
      await store.finishRun(runId, { source: "ecos", status: result.status as "ok" | "empty" | "error", rows: result.rows, message: result.message, finishedAt: now().toISOString() });
    } catch {
      /* 실행 기록 실패는 결과를 바꾸지 않음 */
    }
  }
  return result;
}
