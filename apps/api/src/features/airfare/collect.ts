// 항공권 달력 수집 (작업 0234) — 키가 없으면 건너뜀 · 도시 하나가 실패해도 다음 도시 계속 · 절대 던지지 않음 (환율 수집에 번지지 않게)
// 받지 못한 도시는 저장하지 않음 — 숫자를 지어내지 않는다 (AGENTS.md 7) · 키 값 · 검색 주소는 어떤 글에도 남기지 않음 (AGENTS.md 6)
import { redact } from "../../log";
import { airfareDue } from "./due";
import { AIRFARE_CITIES, AirfareError, calendarUrl, parseCalendar } from "./serpapi";

export type AirfareRow = { airport: string; fetchedOn: string; depart: string; returnDate: string; price: number; fetchedAt: string };

export interface AirfareStore {
  startRun(source: string, startedAt: string): Promise<number>;
  finishRun(id: number, r: { source: string; status: "ok" | "empty" | "error"; rows: number; message: string | null; finishedAt: string }): Promise<void>;
  /** 같은 (airport, fetchedOn, depart) 는 덮어씀 */
  saveDays(rows: AirfareRow[]): Promise<number>;
  /** 그날 이미 받은 공항 코드 */
  fetchedToday(fetchedOn: string): Promise<string[]>;
}

type CityStatus = "ok" | "empty" | "error";
export type AirfareResult = {
  status: CityStatus | "skipped" | "already";
  rows: number;
  message: string | null;
  cities: { airport: string; status: CityStatus; rows: number }[];
};

const scrub = (text: string, key: string) => {
  let t = redact(text).replace(/api_key=[^&\s"']*/gi, "api_key=***");
  for (const k of [key, encodeURIComponent(key), encodeURI(key)]) if (k) t = t.split(k).join("***");
  return t;
};

export async function collectAirfare(store: AirfareStore, opts: { key?: string; today: string; fetcher?: typeof fetch; now?: () => Date }): Promise<AirfareResult> {
  const key = opts.key?.trim();
  const none = (status: "skipped" | "already", message: string | null): AirfareResult => ({ status, rows: 0, message, cities: [] });
  if (!key) return none("skipped", "SERPAPI_KEY 가 없어 건너뜀");
  const now = opts.now ?? (() => new Date());
  const doFetch = opts.fetcher ?? ((u: Parameters<typeof fetch>[0], i?: RequestInit) => fetch(u, i));
  const errText = (e: unknown) => scrub(e instanceof Error ? `${e.name}: ${e.message}` : String(e), key);

  let runId: number | null = null;
  const cities: AirfareResult["cities"] = [];
  const messages: string[] = [];
  try {
    if (airfareDue(opts.today, []).length === 0) return none("skipped", "월 · 수 · 금이 아님");
    const due = airfareDue(opts.today, await store.fetchedToday(opts.today));
    if (due.length === 0) return none("already", null);
    runId = await store.startRun("serpapi", now().toISOString());
    for (const airport of due) {
      const meta = AIRFARE_CITIES.find((c) => c.airport === airport);
      if (!meta) continue;
      try {
        const res = await doFetch(calendarUrl(airport, key, opts.today).toString(), { signal: AbortSignal.timeout(30_000) });
        if (!res.ok) throw new AirfareError(`http-${res.status}`, `HTTP ${res.status}`);
        const days = parseCalendar(await res.json());
        if (days.length === 0) {
          cities.push({ airport, status: "empty", rows: 0 });
          continue;
        }
        const fetchedAt = now().toISOString();
        const rows = await store.saveDays(days.map((d) => ({ airport, fetchedOn: opts.today, depart: d.depart, returnDate: d.return, price: d.price, fetchedAt })));
        cities.push({ airport, status: "ok", rows });
      } catch (e) {
        cities.push({ airport, status: "error", rows: 0 });
        messages.push(`${airport}: ${errText(e)}`);
      }
    }
  } catch (e) {
    messages.push(errText(e));
  }
  const rows = cities.reduce((n, c) => n + c.rows, 0);
  const status: CityStatus = cities.some((c) => c.status === "ok") ? "ok" : cities.some((c) => c.status === "error") || messages.length > 0 ? "error" : "empty";
  const message = messages.length ? messages.join(" · ").slice(0, 500) : null;
  if (runId !== null) {
    try {
      await store.finishRun(runId, { source: "serpapi", status, rows, message, finishedAt: now().toISOString() });
    } catch {
      /* 실행 기록 실패는 결과를 바꾸지 않음 */
    }
  }
  return { status, rows, message, cities };
}
