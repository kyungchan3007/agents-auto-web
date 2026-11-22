// 인트로 흐름의 글 · 계산 — 순수 함수 (three · React 없음 · 기능 폴더 밖은 @hav/shared 만 가져옴 · 작업 0185 · 테스트 flow.test.ts)
// 숫자는 빌드 때 받은 값 — 없으면 null · "없음" · "환율 없음" 으로 보임 (지어내지 않음)
import { currencyName } from "@hav/shared/currency";
import { type PickedTrip, TRAVEL_CITIES, TRAVEL_COUNTRIES, monthlyAverages } from "@hav/shared/travel";
import { wonText } from "@hav/shared/format";
import type { Signal } from "@hav/shared/signal";
import { SIGNAL_TEXT } from "@/shared/signal/signal-tone";

export const ORIGIN = "ICN";
/** 출발 안내판 한 줄의 칸 수 (홈 안내판과 같음) */
export const BOARD_COLS = 12;

export type { Signal } from "@hav/shared/signal";

export type IntroCountry = {
  iso: string;
  country: string;
  cities: string[];
  currency: string | null;
  /** 통화 이름 — 엔화 */
  currencyLabel: string | null;
  /** 끝의 '화' 를 뗌 — 엔 */
  currencyShort: string | null;
  /** 환율 단위 (100엔의 100) */
  per: number | null;
  /** 매매기준율 */
  base: number | null;
  signal: Signal | null;
  /** 한국 100 기준 물가 · round(relative × 100) */
  price: number | null;
};

/** 빌드 때 받은 환율 · 신호 · 물가 수준을 나라에 붙임 — TRAVEL_COUNTRIES 순서 그대로 · 값이 없으면 null */
export function introCountries(input: {
  rates: { currency: string; unit: number; baseRate: number }[];
  signals: { currency: string; signal: Signal | null }[];
  levels: { country: string; relative: number }[];
}): IntroCountry[] {
  const rate = new Map(input.rates.map((r) => [r.currency, r]));
  const sig = new Map(input.signals.map((s) => [s.currency, s.signal]));
  const level = new Map(input.levels.map((l) => [l.country, l.relative]));
  return Object.entries(TRAVEL_COUNTRIES).map(([iso, c]) => {
    const cur = c.currency;
    const r = cur ? rate.get(cur) : undefined;
    const label = cur ? currencyName(cur) : null;
    const rel = level.get(iso);
    return {
      iso,
      country: c.name,
      cities: TRAVEL_CITIES[iso] ?? [],
      currency: cur,
      currencyLabel: label,
      currencyShort: label ? label.replace(/화$/, "") : null,
      per: r ? r.unit : null,
      base: r ? r.baseRate : null,
      signal: (cur ? sig.get(cur) : null) ?? null,
      price: rel === undefined ? null : Math.round(rel * 100),
    };
  });
}

export type Hit = { country: IntroCountry; city: string; rank: 0 | 1 | 2 | 3 };

const norm = (x: string) => x.replace(/\s/g, "").toLowerCase();

/** 나라 · 도시 검색 — 공백 · 대소문자 무시 · 순위 0 나라 앞글자 · 1 도시 앞글자 · 2 나라 가운데 · 3 도시 가운데 (같은 순위는 나라 순서) */
export function searchPlaces(query: string, countries: IntroCountry[], limit = 6): Hit[] {
  const k = norm(query);
  if (!k) return [];
  const hits: Hit[] = [];
  for (const c of countries) {
    const n = norm(c.country);
    const cityStart = c.cities.find((x) => norm(x).startsWith(k));
    const cityIn = c.cities.find((x) => norm(x).includes(k));
    const rank = n.startsWith(k) ? 0 : cityStart ? 1 : n.includes(k) ? 2 : cityIn ? 3 : -1;
    if (rank < 0) continue;
    hits.push({ country: c, city: rank === 1 ? (cityStart as string) : rank === 3 ? (cityIn as string) : (c.cities[0] ?? ""), rank: rank as Hit["rank"] });
  }
  return hits.sort((a, b) => a.rank - b.rank).slice(0, limit);
}

const QUICK: [string, string][] = [["JPN", "도쿄"], ["THA", "방콕"], ["USA", "뉴욕"]];

/** 처음 칩 3개 — 일본 도쿄 · 태국 방콕 · 미국 뉴욕 */
export function quickPicks(countries: IntroCountry[]): Hit[] {
  return QUICK.flatMap(([iso, city]) => {
    const country = countries.find((c) => c.iso === iso);
    return country ? [{ country, city, rank: 0 as const }] : [];
  });
}

const cut = (s: string, n = BOARD_COLS) => Array.from(s).slice(0, n).join("");

// 원 표기(wonText)는 @hav/shared/format (작업 0312 — 홈 안내판과 같은 함수)
export const formatWon = (n: number): string => n.toLocaleString("ko-KR");

/** 숫자만 남김 · 비면 0 · 최대 100억 */
export function parseBudget(text: string): number {
  const n = Number(text.replace(/[^0-9]/g, "")) || 0;
  return Math.min(1e10, n);
}

/** 원 ÷ 환율 × 단위 (반올림) — 환율이 없으면 null */
export function convertBudget(krw: number, base: number | null, per: number | null): number | null {
  if (base === null || per === null || !(base > 0)) return null;
  return Math.round((krw / base) * per);
}

const unitOf = (c: IntroCountry) => (c.per === 100 ? 100 : 1);
const rateShort = (c: IntroCountry) => (c.base === null ? "환율 없음" : `${unitOf(c)}${c.currencyShort ?? ""} ${wonText(c.base)}`);

/** 1단계 출발 안내판 두 줄 — 각 줄 12자까지만 */
export function boardRows(query: string, hit: Hit | null): [string, string] {
  if (hit) return [cut(`${ORIGIN} → ${hit.city}`), cut(rateShort(hit.country))];
  return query.trim() ? [`${ORIGIN} → ?`, "없는 곳입니다"] : [`${ORIGIN} → 어디로?`, "목적지를 입력하세요"];
}

/** 2단계 환전 결과 한 줄 — "1,000,000원 ≈ 111,111 엔화" · 환율이 없으면 "… · 환율 없음" */
export function budgetLine(c: IntroCountry, krw: number): string {
  const v = convertBudget(krw, c.base, c.per);
  return v === null ? `${formatWon(krw)}원 · 환율 없음` : `${formatWon(krw)}원 ≈ ${formatWon(v)} ${c.currencyLabel ?? ""}`.trimEnd();
}

const rateNum = (c: IntroCountry) => (c.base === null ? "" : c.base.toLocaleString("ko-KR", { maximumFractionDigits: 2 }));
export const rateNote = (c: IntroCountry): string => (c.base === null ? "환율 없음" : `오늘 매매기준율 ${unitOf(c)} ${c.currencyLabel} = ${rateNum(c)}원`);


/** 2단계 판정 한 줄 — 환율이 없으면 계산하지 못했다고 · 신호가 없으면 판정을 못 냈다고 (지어내지 않음) */
export function pinLine(c: IntroCountry, windowDays = 90): string {
  if (c.base === null) return `${c.country} 돈은 한국수출입은행 고시 환율에 없어 계산하지 못했습니다`;
  if (!c.signal) return `최근 ${windowDays}일 판정을 아직 내지 못했습니다`;
  return `${c.currencyLabel}는 지금 최근 ${windowDays}일 중 ${SIGNAL_TEXT[c.signal]}입니다`;
}
export const priceLine = (c: IntroCountry): string => (c.price === null ? "물가 데이터는 아직 없습니다" : `물가는 ${c.country} ${c.price} · 한국을 100으로 볼 때 (세계은행)`);

const NO_AIRFARE = { line: "국제항공료 지수를 아직 받지 못했습니다", cell: "없음" };

/** 3단계 이번 달 항공료 — 홈 여행 타이밍과 같은 최근 36개월 같은 달 평균 · 가장 낮은/높은 달 · 평균 대비 % · 값이 없으면 "없음" */
export function airfareInfo(points: { period: string; value: number }[] | null | undefined, month: number): { line: string; cell: string } {
  const avg = monthlyAverages(points ?? []);
  const months = Object.keys(avg).map(Number).sort((a, b) => a - b);
  if (months.length < 2 || !avg[month]) return NO_AIRFARE;
  // 같은 값이면 싼 달은 앞선 달 · 비싼 달은 뒤선 달 (홈 travelTiming 과 같은 규칙)
  let cheapest = months[0];
  let priciest = months[0];
  for (const m of months) {
    if (avg[m].avg < avg[cheapest].avg) cheapest = m;
    if (avg[m].avg >= avg[priciest].avg) priciest = m;
  }
  const span = months.length === 12 ? "1년 중" : "받은 달 중";
  if (month === cheapest) return { line: `${month}월은 국제항공료 지수가 ${span} 가장 낮은 달입니다`, cell: `${month}월 · ${span} 최저` };
  if (month === priciest) return { line: `${month}월은 국제항공료 지수가 ${span} 가장 높은 달입니다`, cell: `${month}월 · ${span} 최고` };
  const mean = months.reduce((s, m) => s + avg[m].avg, 0) / months.length;
  const pct = Math.round((avg[month].avg / mean - 1) * 100);
  if (pct === 0) return { line: `${month}월 국제항공료 지수는 ${span} 평균과 같습니다`, cell: `${month}월 · 평균과 같음` };
  const dir = pct > 0 ? "높" : "낮";
  return { line: `${month}월 국제항공료 지수는 ${span} 평균보다 ${Math.abs(pct)}% ${dir}습니다`, cell: `${month}월 · 평균보다 ${Math.abs(pct)}% ${dir}음` };
}

/** 탑승권 내용 — 경로 · 여섯 줄 · 바코드 글 · 아래 두 줄 (값이 없으면 "환율 없음" · "판정 없음" · "데이터 없음") */
export function ticketOf(a: { country: IntroCountry; city: string; budget: number; month: number; airfare: string; today: string }): {
  route: [string, string];
  rows: { label: string; value: string }[];
  code: string;
  footer: [string, string];
} {
  const c = a.country;
  const conv = convertBudget(a.budget, c.base, c.per);
  return {
    route: [ORIGIN, a.city],
    rows: [
      { label: "출발", value: `이번 달 ${a.month}월` },
      { label: "환전", value: conv === null ? "환율 없음" : `${formatWon(Math.round(a.budget / 10000))}만 원 ≈ ${formatWon(conv)} ${c.currencyLabel}` },
      { label: "환율", value: c.base === null ? "환율 없음" : `${unitOf(c)} ${c.currencyLabel} = ${rateNum(c)}원` },
      { label: "판정", value: c.signal ? SIGNAL_TEXT[c.signal] : "판정 없음" },
      { label: "물가", value: c.price === null ? "데이터 없음" : `${c.country} ${c.price}` },
      { label: "항공료", value: a.airfare },
    ],
    code: `${a.today.replaceAll("-", "")}${c.currency ?? "XXX"}${c.base === null ? "0" : String(Math.round(c.base * 100))}`,
    footer: [`${a.today} · ${c.currency ?? ""} ${c.base === null ? "" : rateNum(c)}`.trimEnd(), "flapfx.com"],
  };
}

export const STEP_NAMES = ["터미널 입구", "환전소", "게이트", "이륙", "홈으로"];
export const stepLabel = (step: number): string => `${step} / 5 · ${STEP_NAMES[step - 1]}`;
/** 이전은 2 · 3 · 4단계에만 */
export const canGoBack = (step: number): boolean => step >= 2 && step <= 4;
/** 한 단계 앞 (1 · 5단계는 그대로) */
export const prevStep = (step: number): number => (canGoBack(step) ? step - 1 : step);

export const pickedOf = (country: string, city: string, budget: number): PickedTrip => ({ v: 1, country, city, budget });

/** 인트로 바닥 출처의 비행기 글 — "3D 비행기: …" → "비행기 …" (작업 0312 에 intro.tsx 에서 옮김) */
export const planeCreditShort = (text: string) => text.replace("3D 비행기: ", "비행기 ");
