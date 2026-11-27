// 작업 0396 — 공통 숫자 칸 값(shared/facts): 0393 pickFacts 계산을 홈 · 나라 물가가 함께 씀 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//
// builder 가 만들 것: apps/web/src/shared/facts/facts.ts (순수 함수 · React 없음 · 기능 폴더를 가져오지 않음 → 입력 모양은 아래처럼 글자 그대로)
//   factsOf(p: { country: string; title: string; rates: {currency;unit;baseRate}[]; signals: {currency;signal;reason;percentile;median?}[]; levels: PriceLevels | null; windowDays?: number }): Facts
//   Facts = hero-pick.ts 의 PickFacts 와 같은 값 전부(title · rateText · perText · tenKValue · tenKUnit · priceText · position · positionText · medianText) + fxNote: string | null
//   fxNote: 통화가 없는 나라 null · 통화는 있는데 수출입은행이 주지 않는 통화(fxGiven false) "{나라} 환율은 아직 제공되지 않습니다" · 주는 통화인데 오늘 값 없음 "오늘 환율을 아직 받지 못했습니다" · 값이 있으면 null
//   {나라} 는 TRAVEL_COUNTRIES[country].name (제목 title 이 아님 — 홈은 "일본 도쿄", 나라 물가는 "일본")
//   홈의 pickFacts(hit, …) 는 이 함수를 불러 같은 값을 돌려줌(hero-pick.test.ts 그대로 통과)
//   그리는 곳: shared/facts/facts-card.tsx  FactsCard({ id: "hero" | "country", facts }) — testid 접두사 id: `${id}-facts` · `${id}-facts-title` · `${id}-fact-rate` · `${id}-fact-tenk` · `${id}-fact-price` · `${id}-fact-bar` · `${id}-fact-position` · `${id}-facts-note`(fxNote 한 줄) · 홈은 id="hero" 로 지금 testid 그대로
import { describe, expect, it } from "vitest";
import { factsOf } from "./facts";

const RATES = [
  { currency: "JPY", unit: 100, baseRate: 941 },
  { currency: "THB", unit: 1, baseRate: 41.2 },
  { currency: "IDR", unit: 100, baseRate: 8.7 },
];
const SIGNALS = [
  { currency: "JPY", signal: "cheap" as const, reason: "", percentile: 0.36, median: 9.2 },
  { currency: "IDR", signal: "cheap" as const, reason: "", percentile: 0.29, median: 0.092 },
];
const LEVELS = {
  base: "KOR",
  rows: [
    { country: "JPN", year: 2024, level: 1, relative: 1.12, source: "t" },
    { country: "VNM", year: 2024, level: 1, relative: 0.46, source: "t" },
    { country: "MAC", year: 2024, level: 1, relative: 0.9, source: "t" },
  ],
};
const base = { rates: RATES, signals: SIGNALS, levels: LEVELS };

describe("factsOf — 환율이 있는 나라(일본)", () => {
  const f = factsOf({ ...base, country: "JPN", title: "일본" });
  it("제목은 받은 그대로 · 환율 · 1만원이면 · 물가 · 위치 · 중간값", () => {
    expect(f.title).toBe("일본");
    expect(f.rateText).toBe("9.41원");
    expect(f.perText).toBe("1엔");
    expect(f.tenKValue).toBe("1,063");
    expect(f.tenKUnit).toBe("엔");
    expect(f.priceText).toBe("12% 높음");
    expect(f.position).toBe(64);
    expect(f.positionText).toBe("오늘은 90일 중 보통 (64%의 날보다 낮음)");
    expect(f.medianText).toBe("9.20원");
    expect(f.fxNote).toBeNull();
  });
  it("기간(windowDays)을 글에 씀 · 낱말 '쌈' 없음", () => {
    expect(factsOf({ ...base, country: "JPN", title: "일본", windowDays: 60 }).positionText).toBe("오늘은 60일 중 보통 (64%의 날보다 낮음)");
    expect(JSON.stringify(f)).not.toContain("쌈");
  });
});

describe("factsOf — 수출입은행이 주지 않는 통화(베트남 VND): 환율 칸 없이 물가만", () => {
  const f = factsOf({ ...base, country: "VNM", title: "베트남" });
  it("물가는 그대로 · 환율이 필요한 값은 모두 null(\"-\" 로 그리지 않고 칸을 빼기 위해)", () => {
    expect(f.priceText).toBe("54% 낮음");
    for (const k of ["rateText", "perText", "tenKValue", "tenKUnit", "position", "positionText", "medianText"] as const) expect(f[k], k).toBeNull();
  });
  it("안내 한 줄 — 베트남 환율은 아직 제공되지 않습니다", () => {
    expect(f.fxNote).toBe("베트남 환율은 아직 제공되지 않습니다");
  });
  it("환율 · 신호 목록이 통째로 비어도 같은 안내(주지 않는 통화라서)", () => {
    expect(factsOf({ country: "VNM", title: "베트남", rates: [], signals: [], levels: LEVELS }).fxNote).toBe("베트남 환율은 아직 제공되지 않습니다");
  });
});

describe("factsOf — 주는 통화인데 오늘 값이 없음(늦음)", () => {
  it("태국(THB): 환율 목록이 비면 \"오늘 환율을 아직 받지 못했습니다\" · 환율 값 null", () => {
    const f = factsOf({ country: "THA", title: "태국", rates: [], signals: [], levels: LEVELS });
    expect(f.fxNote).toBe("오늘 환율을 아직 받지 못했습니다");
    expect(f.rateText).toBeNull();
    expect(f.tenKValue).toBeNull();
  });
});

describe("factsOf — 통화가 없는 나라(마카오)", () => {
  it("안내 없음(fxNote null) · 환율 값 null · 물가만", () => {
    const f = factsOf({ ...base, country: "MAC", title: "마카오" });
    expect(f.fxNote).toBeNull();
    expect(f.rateText).toBeNull();
    expect(f.priceText).toBe("10% 낮음");
  });
});

describe("factsOf — levels 없음(null)", () => {
  it("죽지 않음 · 물가만 null", () => {
    const f = factsOf({ ...base, country: "JPN", title: "일본", levels: null });
    expect(f.priceText).toBeNull();
    expect(f.rateText).toBe("9.41원");
  });
});
