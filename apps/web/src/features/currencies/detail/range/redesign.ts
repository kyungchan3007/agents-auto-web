// 새 통화 상세 계산 — 순수 함수 (작업 0219 · 테스트 redesign.test.ts)
// 값은 받은 자료 그대로 — 범위가 없으면 점을 그리지 않음 (지어내지 않음)
import { rateDigits, rateText } from "@hav/shared/currency";
import { scalePosition } from "@/shared/signal/scale-position";

/** 비행 경로 위 오늘 점 위치 0(1년 최저) ~ 1(1년 최고) — 범위 밖은 자르고 · 범위가 없거나 숫자가 아니면 null (계산은 앱 공통 scalePosition · 작업 0312) */
export const routePosition = scalePosition;

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

/** 1년 최저 · 최고 · 평균 카드 숫자의 소수 자리 — 그 값에 대한 rateDigits 규칙(1,000원 이상 첫째 · 미만 둘째 · 끝자리 0 생략 · 작업 0287) */
export const cardDigits = (rate: { baseRate: number }): number => rateDigits(rate.baseRate);

/** 최저 · 최고 옆 단위 (작업 0248 · 0312 에 range-card.tsx 에서 옮김) — 100엔처럼 단위가 1이 아니면 작은 "100엔당" · 원이면 없음 · 그 밖은 "원" 을 뗀 글 */
export function perUnit(unit: number, code: string, unitText: string): { small: boolean; text: string } | null {
  if (unit !== 1 && unitText.startsWith("원")) return { small: true, text: `${unit}${code === "JPY" ? "엔" : code}당` };
  if (unitText === "원") return null;
  return { small: false, text: unitText.replace(/^원/, "") };
}
