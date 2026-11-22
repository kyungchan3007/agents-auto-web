// 새 통화 상세 계산 — 순수 함수 (작업 0219 · 테스트 redesign.test.ts)
// 값은 받은 자료 그대로 — 범위가 없으면 점을 그리지 않음 (지어내지 않음)
import { rateText } from "@hav/shared/currency";

/** 비행 경로 위 오늘 점 위치 0(1년 최저) ~ 1(1년 최고) — 범위 밖은 자르고 · 범위가 없거나 숫자가 아니면 null */
export function routePosition(today: number, min: number, max: number): number | null {
  if (![today, min, max].every(Number.isFinite) || !(max > min)) return null;
  return Math.min(1, Math.max(0, (today - min) / (max - min)));
}

/** 홈 도착지 네 통화 — 국기 칩 줄의 기본 순서 */
const HOME_CHIPS = ["JPY", "USD", "EUR", "THB"];

/** 국기 칩 줄 — 받은 통화 중 홈 네 통화 + 지금 통화(넷에 없으면 맨 앞) */
export function chipCodes(current: string, available: string[]): string[] {
  const has = (c: string) => available.includes(c);
  const base = HOME_CHIPS.filter(has);
  return has(current) && !base.includes(current) ? [current, ...base] : base;
}

/** 머리 큰 숫자(카운트업) — 값은 그대로 · 소수 자리는 rateText 가 보이는 만큼 (formatCount(value, digits) 가 지금 글과 같음) */
export function bigRate(rate: { baseRate: number; unit: number }): { value: number; digits: number; unit: string } {
  const t = rateText(rate);
  const frac = t.value.split(".")[1];
  return { value: rate.baseRate, digits: frac ? frac.length : 0, unit: t.unit };
}

/** 1년 최저 · 최고 · 평균 글의 소수 자리 — 통화 상세는 늘 소수 둘째 자리 (작업 0287 · 큰 숫자 · 그래프 · 표와 같은 형식) */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- 부르는 쪽 모양 유지(작업 0287)
export const cardDigits = (_rate?: { baseRate: number }): 1 | 2 => 2;
