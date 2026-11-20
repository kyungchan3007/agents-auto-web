// 이 회차에서 받을 도시 판단 (작업 0234) — 월 · 수 · 금만 · 그날 이미 받은 도시는 건너뜀 (재시도 회차가 다시 부르지 않게 → 한 달 약 104회)
import { AIRFARE_CITIES } from "./serpapi";

/** 한국 날짜(YYYY-MM-DD)가 월 · 수 · 금인가 — 날짜 글자를 UTC 로 읽어 시간대 영향 없음 */
export function isAirfareDay(today: string): boolean {
  const dow = new Date(`${today}T00:00:00Z`).getUTCDay(); // 0=일
  return dow === 1 || dow === 3 || dow === 5;
}

/** 오늘 받을 공항 코드 — 월 · 수 · 금이 아니면 [] · 이미 받은 공항은 뺌(순서 유지) */
export function airfareDue(today: string, fetchedToday: readonly string[]): string[] {
  if (!isAirfareDay(today)) return [];
  const done = new Set(fetchedToday);
  return AIRFARE_CITIES.map((c) => c.airport).filter((a) => !done.has(a));
}
