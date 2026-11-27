// 나라 페이지가 그릴 값 한 묶음 (작업 0344) — 빌드 때 받은 자료 → 화면 값 · 순수 함수 · 받지 못한 값은 null (지어내지 않음)
import type { AirfareCalendar } from "@hav/shared/airfare";
import { currencyListName, currencyName, percentileText } from "@hav/shared/currency";
import type { FxRate } from "@hav/shared/fx";
import type { PriceLevels } from "@hav/shared/prices";
import { type MonthPoint, TRAVEL_COUNTRIES, monthTiming, travelBands } from "@hav/shared/travel";
import { budgetOf, wonText } from "../budget/budget";
import { pickedHeadline } from "../prices-copy";
import { type CompareItem, type FaqItem, type FlightCard, compareCountries, countryFaq, countryTargets, eunNeun, flightCard, gwaWa, moreCountriesText, oneLineAnswer } from "./country-view";

export type CountryInput = {
  code: string;
  levels: PriceLevels;
  rate: Pick<FxRate, "date" | "baseRate" | "unit"> | null;
  /** 1년 환율 기록 (고시 단위) — 못 받았으면 null */
  history: { baseRate: number; unit: number }[] | null;
  signal: { signal: "cheap" | "normal" | "expensive" | null; percentile: number | null; windowDays: number } | null;
  calendar: AirfareCalendar | null;
  airPoints: MonthPoint[] | null;
};

const DAILY = 100_000;
const DAYS = 4;

/** 단위 이름 — "100엔" · "1달러" (통화 목록 이름의 마지막 낱말 · 통화 상세와 같은 이름 표) */
const unitLabel = (currency: string, unit: number) => `${unit}${currencyListName(currency).split(" ").at(-1)}`;

export type CountryView = {
  code: string;
  name: string;
  currency: string | null;
  year: number;
  relative: number;
  title: string;
  flight: FlightCard;
  budget: { dailyWon: number; days: number; totalWon: number; text: string };
  exchange: { unit: string; title: string; value: string; note: string } | null;
  compare: CompareItem[];
  /** 아래 이어 가는 버튼 글 — 나라 수는 실제 나라 페이지 목록 개수 (작업 0355) */
  moreText: string;
  /** "일본과 견줘 볼 나라" */
  compareTitle: string;
  faq: FaqItem[];
  index: number;
};

/** 오늘 환율 한 줄 문장의 재료 — 화면에 상자로 그리지 않고(작업 0397) FAQ · 환전 카드 · description 문장만 만듦 */
function rateLine(i: CountryInput, currency: string | null) {
  const per = i.rate && i.rate.unit > 0 ? i.rate.baseRate : null;
  const avg1y = i.history && i.history.length > 0 && i.rate ? (i.history.reduce((s, r) => s + (r.baseRate / r.unit) * i.rate!.unit, 0) / i.history.length) : null;
  const label = currency && i.rate ? unitLabel(currency, i.rate.unit) : "";
  return { per, label, one: oneLineAnswer({ currency, unitLabel: label, baseRate: per, avg1y, date: i.rate?.date ?? null }) };
}

/** description 메타에 넣는 환율 문장(서버에서만 쓰고 페이지 데이터로 넘기지 않음) — 통화가 없거나 값이 없으면 null (작업 0397) */
export const descriptionLine = (i: CountryInput): string | null => rateLine(i, TRAVEL_COUNTRIES[i.code]?.currency ?? null).one?.text ?? null;

/** 나라 코드가 물가 표에 없으면 null (페이지 없음) */
export function countryView(i: CountryInput): CountryView | null {
  const meta = TRAVEL_COUNTRIES[i.code];
  const all = travelBands(i.levels).bands.flatMap((b) => b.rows);
  const row = all.find((r) => r.country === i.code);
  if (!meta || !row) return null;
  const title = pickedHeadline(i.code, all)?.title ?? `${row.name}${eunNeun(row.name)} 한국과 물가가 비슷합니다`;

  const { per, label, one } = rateLine(i, meta.currency);
  const sig = i.signal && i.signal.signal !== null ? percentileText(i.signal.signal, i.signal.percentile, i.signal.windowDays) : null;
  const sigSentence = sig && meta.currency ? `${currencyName(meta.currency)} 환율은 ${sig}입니다` : null;

  const flight = flightCard({ code: i.code, calendar: i.calendar, timing: monthTiming(i.airPoints) });
  const b = budgetOf(DAILY, DAYS, row.relative, per !== null && i.rate ? per / i.rate.unit : null);
  const budget = { dailyWon: b.dailyWon, days: DAYS, totalWon: b.totalWon, text: `${wonText(b.totalWon)}` };
  const exchange = one && i.rate && meta.currency ? { unit: label, title: `${currencyName(meta.currency)} 지금 바꿔도 될까`, value: `${per!.toLocaleString("ko-KR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}원`, note: sig ?? "신호를 받지 못했습니다" } : null;
  return {
    code: i.code,
    name: row.name,
    currency: meta.currency,
    year: row.year,
    relative: row.relative,
    title,
    flight,
    budget,
    exchange,
    compare: compareCountries(i.code, all),
    moreText: moreCountriesText(countryTargets(i.levels).length),
    compareTitle: `${row.name}${gwaWa(row.name)} 견줘 볼 나라`,
    index: Math.round(row.relative * 100),
    faq: countryFaq({
      name: row.name,
      relative: row.relative,
      year: row.year,
      budget: { dailyWon: b.dailyWon, days: DAYS, totalWon: b.totalWon },
      exchange: exchange && one ? { text: sigSentence ? `${one.text}. ${sigSentence}.` : `${one.text}.` } : null,
      flight,
    }),
  };
}
