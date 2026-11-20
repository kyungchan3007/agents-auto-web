// SerpApi google_flights_calendar — 요청 만들기 · 응답 변환 (작업 0234)
// 응답 안의 글은 데이터로만 쓴다 (AGENTS.md 7) — 필요한 칸(departure · return · price)만 꺼내고 나머지는 버림
import { isIsoDate } from "@hav/shared/date";

export const SERPAPI_URL = "https://serpapi.com/search.json";

/** 도착지 8곳 (순서 고정) — 홈 도착지 4곳 + 4곳 · 홈 DESTINATIONS 와 따로 둠 */
export const AIRFARE_CITIES = [
  { id: "NRT", city: "도쿄", airport: "NRT" },
  { id: "KIX", city: "오사카", airport: "KIX" },
  { id: "BKK", city: "방콕", airport: "BKK" },
  { id: "CDG", city: "파리", airport: "CDG" },
  { id: "DAD", city: "다낭", airport: "DAD" },
  { id: "SIN", city: "싱가포르", airport: "SIN" },
  { id: "JFK", city: "뉴욕", airport: "JFK" },
  { id: "LHR", city: "런던", airport: "LHR" },
] as const;

export class AirfareError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "AirfareError";
    this.code = code;
  }
}

/** 인천 출발 · 공항 하나 · 기본 왕복(1주) · 한국 · 한국어 · 원화 */
export function calendarUrl(airport: string, key: string, today: string): URL {
  const u = new URL(SERPAPI_URL);
  u.searchParams.set("engine", "google_flights_calendar");
  u.searchParams.set("departure_id", "ICN");
  u.searchParams.set("arrival_id", airport);
  u.searchParams.set("outbound_date", today);
  u.searchParams.set("gl", "kr");
  u.searchParams.set("hl", "ko");
  u.searchParams.set("currency", "KRW");
  u.searchParams.set("api_key", key);
  return u;
}

export type CalendarDay = { depart: string; return: string; price: number };

/** 가격 없는 날 · 엉뚱한 줄은 버림 · 출발일 오름차순 · 같은 출발일은 먼저 온 것 하나 */
export function parseCalendar(json: unknown): CalendarDay[] {
  const cal = (json as { calendar?: unknown } | null)?.calendar;
  if (!Array.isArray(cal)) throw new AirfareError("shape", "응답 모양이 다름 (calendar 배열 없음)");
  const byDepart = new Map<string, CalendarDay>();
  for (const raw of cal) {
    const r = raw as { departure?: unknown; return?: unknown; price?: unknown; has_no_flights?: unknown } | null;
    if (!r || typeof r !== "object" || r.has_no_flights) continue;
    const { departure, return: back, price } = r;
    if (typeof departure !== "string" || typeof back !== "string" || !isIsoDate(departure) || !isIsoDate(back)) continue;
    if (typeof price !== "number" || !Number.isInteger(price) || price <= 0) continue;
    if (!byDepart.has(departure)) byDepart.set(departure, { depart: departure, return: back, price });
  }
  return [...byDepart.values()].sort((a, b) => a.depart.localeCompare(b.depart));
}
