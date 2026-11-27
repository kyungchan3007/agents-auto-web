// 작업 0393 — 기본 hero 고른 곳: 탑승권 값(passFor) · 숫자 칸 값(pickFacts) · 고른 장 맨 앞 순서(frontWith) (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//
// builder 가 만들 것: hero/hero-pick.ts (순수 함수 · React 없음)
//   passFor(hit, rates, signals, windowDays, month): PassCard   — PassCard 는 hero-pass.ts 의 것 그대로
//   pickFacts(hit, rates, signals, levels, windowDays = 90): PickFacts
//   frontWith(order, id): string[]                               — 고른 장을 맨 앞에 · 덱 밖 장(id 가 "pick-" 로 시작)은 하나만
import { describe, expect, it } from "vitest";
import type { RateRow, SignalRow } from "../common/destinations";
import { passCards } from "./hero-pass";
import { frontWith, passFor, pickFacts } from "./hero-pick";

const hit = (country: string, city: string, name: string) => ({ country, city, label: `${name} ${city}` });
const TOKYO = hit("JPN", "도쿄", "일본");
const DELHI = hit("IND", "뉴델리", "인도"); // 통화 없는 나라(환율 · 신호 · 물가 모두 없음)
const BALI = hit("IDN", "발리", "인도네시아");
const JAKARTA = hit("IDN", "자카르타", "인도네시아");
const MACAO = hit("MAC", "마카오", "마카오"); // 통화 없음

const RATES: RateRow[] = [
  { currency: "JPY", unit: 100, baseRate: 941 },
  { currency: "EUR", unit: 1, baseRate: 1475 },
  { currency: "THB", unit: 1, baseRate: 41.2 },
  { currency: "VND", unit: 100, baseRate: 5.6 },
  { currency: "IDR", unit: 100, baseRate: 8.7 },
];
// percentile 0.36 → "64% 의 날보다 쌈"(1 - 0.36)
const SIGNALS: SignalRow[] = [
  { currency: "JPY", signal: "cheap", reason: "", percentile: 0.36, median: 9.2 },
  { currency: "IDR", signal: "cheap", reason: "", percentile: 0.29, median: 0.092 },
  { currency: "EUR", signal: "expensive", reason: "", percentile: 0.9, median: null },
];
const LEVELS = {
  base: "KOR",
  rows: [
    { country: "JPN", year: 2024, level: 1, relative: 1.12, source: "t" },
    { country: "IDN", year: 2024, level: 1, relative: 0.38, source: "t" },
  ],
};

describe("passFor — 어떤 도시든 같은 모양의 탑승권 값", () => {
  it("네 도시(파리 · 도쿄 · 방콕 · 다낭)는 지금 passCards 와 같은 값 · 같은 id", () => {
    const all = passCards(RATES, SIGNALS, 90, "11월");
    const t = passFor(TOKYO, RATES, SIGNALS, 90, "11월");
    expect(t).toEqual(all.find((c) => c.id === "tokyo"));
    expect(t.toCode).toBe("NRT");
    expect(t.rateText).toBe("9.41원");
    expect(t.perText).toBe("1엔");
    expect(t.pctText).toBe("64%");
    expect(t.pct).toBe(64);
  });

  it("네 도시 밖(발리)도 같은 모양 · id 는 \"pick-\" 로 시작 · 같은 도시는 늘 같은 id · 다른 도시는 다른 id", () => {
    const d = passFor(BALI, RATES, SIGNALS, 90, "11월");
    expect(d.id.startsWith("pick-")).toBe(true);
    expect(d.id).toBe(passFor(BALI, RATES, SIGNALS, 90, "11월").id);
    expect(d.id).not.toBe(passFor(JAKARTA, RATES, SIGNALS, 90, "11월").id);
    expect(d.city).toBe("발리");
    expect(d.fromCode).toBe("ICN");
    expect(d.fromName).toBe("인천");
    expect(d.rateText).toBe("0.087원");
    expect(d.perText).toBe("1루피아");
    expect(d.pctText).toBe("71%");
    expect(d.month).toBe("11월");
    expect(d.windowDays).toBe(90);
  });

  it("공항 코드는 자료에 있을 때만 — 모르는 도시는 빈 글(지어내지 않음)", () => {
    expect(typeof passFor(BALI, RATES, SIGNALS, 90, "11월").toCode).toBe("string");
    expect(passFor(hit("JPN", "없는도시", "일본"), RATES, SIGNALS, 90, "11월").toCode).toBe("");
  });

  it("받지 못한 값은 빈 글 · 막대 0 — 환율 없음 · 신호 없음 · 통화 없는 나라", () => {
    const noRate = passFor(BALI, [], SIGNALS, 90, "11월");
    expect(noRate.rateText).toBe("");
    const noSig = passFor(BALI, RATES, [], 90, "11월");
    expect(noSig.pctText).toBe("");
    expect(noSig.pct).toBe(0);
    const india = passFor(DELHI, RATES, SIGNALS, 90, "11월");
    expect(india.rateText).toBe("");
    expect(india.pctText).toBe("");
    const mac = passFor(MACAO, RATES, SIGNALS, 90, "11월");
    expect(mac.rateText).toBe("");
    expect(mac.pctText).toBe("");
  });
});

describe("pickFacts — 숫자 칸 값", () => {
  it("도쿄: 제목 · 오늘 환율(통화 단위) · 1만원이면 · 물가 · 90일 위치", () => {
    const f = pickFacts(TOKYO, RATES, SIGNALS, LEVELS);
    expect(f.title).toBe("일본 도쿄");
    expect(f.rateText).toBe("9.41원");
    expect(f.perText).toBe("1엔");
    expect(f.tenKValue).toBe("1,063"); // 10000 ÷ 9.41
    expect(f.tenKUnit).toBe("엔");
    expect(f.priceText).toBe("12% 높음"); // relative 1.12 · 한국보다
    expect(f.position).toBe(64);
    expect(f.positionText).toBe("오늘은 90일 중 보통 (64%의 날보다 쌈)");
    expect(f.medianText).toBe("9.20원"); // 90일 중간값 · 1 외화당 원 · 같은 자릿수 규칙
  });

  it("위치 말: 66% 이상 낮은 편 · 33~65% 보통 · 32% 이하 높은 편 · 기간(windowDays)을 글에 씀", () => {
    expect(pickFacts(BALI, RATES, SIGNALS, LEVELS).positionText).toBe("오늘은 90일 중 낮은 편 (71%의 날보다 쌈)");
    expect(pickFacts(hit("FRA", "파리", "프랑스"), RATES, SIGNALS, LEVELS).positionText).toBe("오늘은 90일 중 높은 편 (10%의 날보다 쌈)");
    expect(pickFacts(BALI, RATES, SIGNALS, LEVELS, 60).positionText).toBe("오늘은 60일 중 낮은 편 (71%의 날보다 쌈)");
  });

  it("물가: 한국보다 낮으면 \"N% 낮음\" · 같으면 \"비슷\"", () => {
    expect(pickFacts(BALI, RATES, SIGNALS, LEVELS).priceText).toBe("62% 낮음");
    const same = { base: "KOR", rows: [{ country: "JPN", year: 2024, level: 1, relative: 1.002, source: "t" }] };
    expect(pickFacts(TOKYO, RATES, SIGNALS, same).priceText).toBe("비슷");
  });

  it("받지 못한 값은 null(화면에서 \"-\") — 환율 · 신호 · 물가 · 중간값 · 통화 없음", () => {
    const f = pickFacts(BALI, [], [], { base: "KOR", rows: [] });
    const india = pickFacts(DELHI, RATES, SIGNALS, LEVELS); // 인도: 통화가 없어 값이 모두 null
    expect(india.title).toBe("인도 뉴델리");
    expect(india.rateText).toBeNull();
    expect(india.priceText).toBeNull();
    expect(f.title).toBe("인도네시아 발리");
    for (const k of ["rateText", "perText", "tenKValue", "tenKUnit", "priceText", "position", "positionText", "medianText"] as const) expect(f[k], k).toBeNull();
    const mac = pickFacts(MACAO, RATES, SIGNALS, LEVELS);
    expect(mac.rateText).toBeNull();
    expect(mac.tenKValue).toBeNull();
    const noMedian = pickFacts(hit("FRA", "파리", "프랑스"), RATES, SIGNALS, LEVELS);
    expect(noMedian.medianText).toBeNull();
    expect(noMedian.position).toBe(10);
  });

  it("levels 가 없어도(null) 죽지 않음 — 물가만 null", () => {
    const f = pickFacts(TOKYO, RATES, SIGNALS, null);
    expect(f.priceText).toBeNull();
    expect(f.rateText).toBe("9.41원");
  });

  it("통화 단위가 큰 값: 1루피 · 1바트 · 1동 처럼 항상 \"1 + 통화 이름\" (100엔당 아님)", () => {
    expect(pickFacts(hit("THA", "방콕", "태국"), RATES, SIGNALS, LEVELS).perText).toBe("1바트");
    expect(pickFacts(hit("VNM", "다낭", "베트남"), RATES, SIGNALS, LEVELS).perText).toBe("1동");
  });
});

describe("frontWith — 고른 장을 맨 앞에 (덱 밖 장은 하나만)", () => {
  const base = ["paris", "tokyo", "bangkok", "danang"];

  it("덱 안 도시: 그 장이 맨 앞 · 지금 맨 앞은 맨 뒤 · 나머지 순서 그대로", () => {
    expect(frontWith(base, "tokyo")).toEqual(["tokyo", "bangkok", "danang", "paris"]);
    expect(frontWith(base, "danang")).toEqual(["danang", "tokyo", "bangkok", "paris"]);
  });

  it("이미 맨 앞이면 그대로", () => {
    expect(frontWith(base, "paris")).toEqual(base);
  });

  it("덱 밖 도시: 새 장이 맨 앞 · 지금 맨 앞은 맨 뒤", () => {
    expect(frontWith(base, "pick-IND-뉴델리")).toEqual(["pick-IND-뉴델리", "tokyo", "bangkok", "danang", "paris"]);
  });

  it("덱 밖 장은 하나만 — 다른 도시를 또 고르면 앞의 덱 밖 장은 빠짐", () => {
    const a = frontWith(base, "pick-IND-뉴델리");
    expect(frontWith(a, "pick-IND-뭄바이")).toEqual(["pick-IND-뭄바이", "tokyo", "bangkok", "danang", "paris"]);
    expect(frontWith(a, "tokyo")).toEqual(["tokyo", "bangkok", "danang", "paris"]);
  });

  it("들어온 배열을 바꾸지 않음 · 길이는 늘 네 장 또는 다섯 장", () => {
    const copy = [...base];
    frontWith(copy, "pick-IND-뉴델리");
    expect(copy).toEqual(base);
    expect(frontWith(base, "pick-JPN-오사카")).toHaveLength(5);
    expect(frontWith(frontWith(base, "pick-JPN-오사카"), "bangkok")).toHaveLength(4);
  });
});
