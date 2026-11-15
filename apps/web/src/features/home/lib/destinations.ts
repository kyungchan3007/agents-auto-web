// 홈 "이번 주 가장 싸게 갈 수 있는 곳" · 도착지별 환전 타이밍 줄 — 순수 함수 (작업 0169)
// 판정 · 눈금은 사이트 신호 규칙 그대로 (docs/domain/signal.md SIG-01~05) — 최근 90일 백분위 · 핀 글은 근거 숫자 + 판정 ("하위 12% · 쌈" · 작업 0170) · 없는 숫자는 지어내지 않음
import { currencyName } from "@hav/shared/currency";
import { pinBasis } from "@hav/ui/data/signal-pin";

export type Signal = "cheap" | "normal" | "expensive";
export type Destination = { id: string; name: string; currency?: string; country?: string };
export type SignalRow = { currency: string; signal: Signal | null; reason: string; percentile: number | null };
export type RateRow = { currency: string; unit: number; baseRate: number };

export const NO_RATE_COPY = "오늘 환율을 아직 받지 못했습니다";

/** 통화 짧은 이름 — 끝의 "화" 를 뗌 (엔화 → 엔 · 유로 · 달러) */
const shortName = (currency: string) => currencyName(currency).replace(/화$/, "");

/** 100 이상은 반올림 정수(쉼표) · 100 미만은 소수 첫째 자리 + "원" */
function wonText(baseRate: number): string {
  return `${baseRate >= 100 ? Math.round(baseRate).toLocaleString("ko-KR") : baseRate.toFixed(1)}원`;
}

/** 신호 · 백분위 · 환율이 모두 있는 도착지 중 백분위가 가장 낮은 곳 (같으면 destinations 순서가 앞선 곳) · 없으면 null */
export function cheapestDestination(signals: SignalRow[], rates: RateRow[], destinations: Destination[]): { destination: Destination; rate: RateRow; percentile: number } | null {
  let best: { destination: Destination; rate: RateRow; percentile: number } | null = null;
  for (const destination of destinations) {
    if (!destination.currency) continue;
    const s = signals.find((x) => x.currency === destination.currency);
    const rate = rates.find((r) => r.currency === destination.currency);
    if (!s || s.signal === null || s.percentile === null || !rate) continue;
    if (best === null || s.percentile < best.percentile) best = { destination, rate, percentile: s.percentile };
  }
  return best;
}

export type DestinationRowData = {
  id: string;
  city: string;
  currencyLabel: string;
  rateText: string | null;
  signal: Signal | null;
  position: number | null;
  /** 90일 백분위(0~1) — position 과 같은 값 · 핀 글의 근거 숫자 (없으면 null) */
  percentile: number | null;
  /** 핀 글 "하위 12% · 쌈" · 신호가 없으면 null */
  pinText: string | null;
  note: string | null;
  href: string | null;
};

export function destinationRows(signals: SignalRow[], rates: RateRow[], destinations: Destination[]): DestinationRowData[] {
  return destinations.map((d) => {
    const currency = d.currency;
    const rate = currency ? rates.find((r) => r.currency === currency) : undefined;
    const s = currency ? signals.find((x) => x.currency === currency) : undefined;
    const hasSignal = !!s && s.signal !== null && s.percentile !== null;
    const name = currency ? shortName(currency) : "";
    return {
      id: d.id,
      city: d.name,
      currencyLabel: rate && rate.unit > 1 ? `${name} ${rate.unit}` : name,
      rateText: rate ? wonText(rate.baseRate) : null,
      signal: hasSignal ? (s?.signal ?? null) : null,
      position: hasSignal ? (s?.percentile ?? null) : null,
      percentile: hasSignal ? (s?.percentile ?? null) : null,
      pinText: hasSignal && s?.signal ? pinBasis(s.signal, s.percentile) : null,
      note: hasSignal ? null : "신호 없음",
      href: currency ? `/currencies/${currency}` : null,
    };
  });
}

export type CheapestCopy = { headline: string; value: string; per: string; evidence: string };

export function cheapestCopy(c: NonNullable<ReturnType<typeof cheapestDestination>>, windowDays: number): CheapestCopy {
  const currency = c.destination.currency ?? c.rate.currency;
  const below = Math.round((1 - c.percentile) * 100);
  const where = c.percentile === 0 ? `최근 ${windowDays}일 중 가장 낮습니다` : `최근 ${windowDays}일 중 ${below}%의 날보다 낮습니다`;
  return {
    headline: `이번 주 가장 싸게 갈 수 있는 곳은 ${c.destination.name}입니다`,
    value: wonText(c.rate.baseRate),
    per: `${c.rate.unit}${shortName(currency)}`,
    evidence: where,
  };
}
