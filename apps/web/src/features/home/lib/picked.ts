// 홈 안내판이 인트로에서 고른 나라를 보여 주는 글 — 순수 함수 (React 없음 · 인트로 폴더를 가져오지 않음: 고른 값 모양은 @hav/shared/travel 의 PickedTrip · 작업 0185 · 테스트 picked.test.ts)
// 고르지 않았거나 모르는 나라면 null — 홈은 지금 안내판 그대로 (지어내지 않음)
import { currencyName } from "@hav/shared/currency";
import { type PickedTrip, TRAVEL_COUNTRIES } from "@hav/shared/travel";
import { type RateRow, type SignalRow, shortName, wonText } from "./destinations";
import { ORIGIN_CODE } from "./today-board";
import type { BoardRow } from "./today-board";

export const PICKED_TITLE = "내가 고른 여행지 · 오늘 환율";

const SIGNAL_TEXT = { cheap: "낮은 편", normal: "보통", expensive: "높은 편" } as const;

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
