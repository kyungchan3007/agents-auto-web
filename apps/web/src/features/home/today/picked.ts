// 홈 안내판이 인트로에서 고른 나라를 보여 주는 글 — 순수 함수 (React 없음 · 인트로 폴더를 가져오지 않음: 고른 값 모양은 @hav/shared/travel 의 PickedTrip · 작업 0185 · 테스트 picked.test.ts)
// 고르지 않았거나 모르는 나라면 null — 홈은 지금 안내판 그대로 (지어내지 않음)
import { currencyName } from "@hav/shared/currency";
import { type PickedTrip, TRAVEL_COUNTRIES } from "@hav/shared/travel";
import { type RateRow, type SignalRow, shortName } from "../common/destinations";
import { wonText } from "@hav/shared/format";
import { SIGNAL_LEVEL_TEXT as SIGNAL_TEXT } from "@/shared/signal/signal-tone";
import { ORIGIN_CODE } from "./today-view";
import type { BoardRow } from "./today-view";

export const PICKED_TITLE = "내가 고른 여행지 · 오늘 환율";


export function pickedBoard(a: { picked: PickedTrip | null; rates: RateRow[]; signals: SignalRow[]; windowDays: number }): { title: string; rows: [BoardRow, BoardRow]; label: string; evidence: string; percentile: number | null } | null {
  const p = a.picked;
  if (!p || !Object.hasOwn(TRAVEL_COUNTRIES, p.country)) return null;
  const country = TRAVEL_COUNTRIES[p.country];
  const currency = country.currency;
  const rate = currency ? a.rates.find((r) => r.currency === currency) : undefined;
  const money = currency && rate ? `${wonText(rate.baseRate)} / ${rate.unit}${shortName(currency)}` : "환율 없음";
  const signal = currency ? (a.signals.find((s) => s.currency === currency)?.signal ?? null) : null;
  const evidence =
    currency && rate
      ? `${currencyName(currency)} · 최근 ${a.windowDays}일 ${signal ? `중 ${SIGNAL_TEXT[signal]}` : "판정을 아직 내지 못했습니다"}`
      : `${country.name} 돈은 한국수출입은행 고시 환율에 없어 계산하지 못했습니다`;
  return {
    title: PICKED_TITLE,
    rows: [{ text: `${ORIGIN_CODE} → ${p.city}`, tone: "dest" }, { text: money, tone: "money" }],
    label: `내가 고른 여행지는 ${p.city}입니다. ${money}`,
    evidence,
    percentile: currency && rate ? (a.signals.find((s) => s.currency === currency)?.percentile ?? null) : null,
  };
}

/** 홈 왼쪽 아래 "탑승권 보기" 칩 글 */
export const pickedChip = (p: PickedTrip): string => `✈ ${ORIGIN_CODE} → ${p.city} · 탑승권 보기`;

/** 근거 글에서 "97%" 같은 숫자 조각 표시 (작업 0217 · 0312 에 ticket.tsx 에서 옮김) */
export const percentParts = (text: string) => text.split(/(\d+%)/).map((part) => ({ part, num: /^\d+%$/.test(part) }));

/** 근거 막대 너비 — 0 이 아니면 적어도 2% */
export const pctWidth = (pct: number) => `${Math.max(2, Math.round(pct * 100))}%`;

/** 고른 나라 칩 글에서 비행기 표시를 떼고 한 줄로 */
export const passChipText = (chip: string) => `${chip.replace(/^✈\s*/, "").replace(" · ", " ")} ›`;

/** 예산 "1,200,000원" */
export const budgetText = (won: number) => `${won.toLocaleString("ko-KR")}원`;
