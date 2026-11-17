// 작업 0185 — 인트로 흐름의 글 · 계산 (순수 함수 · 테스트 먼저 · 구현 전에는 FAIL 이 정상)
// 사용자: "나라별로 입력할 수 있게" · "입력하면 밑에 엔화 바트 달러 나오는데 그게 유저가 검색한 나라로" · "숫자는 빌드 때 받은 값 · 없으면 '없음'(지어내지 않음)"
//
// builder 가 만들 것
//   apps/web/src/features/intro/lib/places.ts
//     export const INTRO_CITIES: Record<string /* TRAVEL_COUNTRIES 키 */, string[]>   // 나라마다 1개 이상 · 첫 도시가 대표 도시 (시안 countries.json 그대로 — 일본: 도쿄 오사카 후쿠오카 삿포로 오키나와 교토 · 태국: 방콕 치앙마이 푸껫 파타야 …)
//   apps/web/src/features/intro/lib/flow.ts   (three · React 없음 · 기능 폴더 밖은 @hav/shared 만 가져옴)
//     export const ORIGIN = "ICN" · export const BOARD_COLS = 12
//     export type Signal = "cheap" | "normal" | "expensive"
//     export type IntroCountry = { iso; country; cities: string[]; currency: string | null; currencyLabel: string | null /* currencyName: 엔화 */; currencyShort: string | null /* 끝의 '화' 를 뗌: 엔 */; per: number | null /* 환율 단위(100엔의 100) */; base: number | null /* 매매기준율 */; signal: Signal | null; price: number | null /* 한국 100 기준 · round(relative × 100) */ }
//     export function introCountries(input: { rates: { currency: string; unit: number; baseRate: number }[]; signals: { currency: string; signal: Signal | null }[]; levels: { country: string; relative: number }[] }): IntroCountry[]   // TRAVEL_COUNTRIES 순서 그대로 40개 · 값이 없으면 null (지어내지 않음)
//     export type Hit = { country: IntroCountry; city: string; rank: 0 | 1 | 2 | 3 }
//     export function searchPlaces(query: string, countries: IntroCountry[], limit = 6): Hit[]   // 공백 · 대소문자 무시 · 순위: 0 나라 앞글자 · 1 도시 앞글자 · 2 나라 가운데 · 3 도시 가운데 → 순위 오름차순(같으면 나라 순서) · city = 순위 1·3 은 맞은 도시 · 0·2 는 대표(첫) 도시
//     export function quickPicks(countries: IntroCountry[]): Hit[]       // 일본 도쿄 · 태국 방콕 · 미국 뉴욕 (처음 칩 3개)
//     export function boardRows(query: string, hit: Hit | null): [string, string]   // 출발 안내판 두 줄(각 BOARD_COLS 자로 자름)
//     export function wonText(n: number): string    // 100 이상 = 반올림 정수(쉼표) · 100 미만 = 소수 첫째 자리 · 뒤에 "원"  (홈 안내판과 같은 규칙)
//     export function parseBudget(text: string): number  /  formatWon(n: number): string  /  convertBudget(krw: number, base: number | null, per: number | null): number | null
//     export function budgetLine(c: IntroCountry, krw: number): string
//     export function rateNote(c: IntroCountry): string  /  pinLine(c: IntroCountry, windowDays?: number): string  /  priceLine(c: IntroCountry): string
//     export function airfareInfo(points: { period: string; value: number }[] | null | undefined, month: number): { line: string; cell: string }
//     export function ticketOf(a: { country: IntroCountry; city: string; budget: number; month: number; airfare: string; today: string /* YYYY-MM-DD */ }): { route: [string, string]; rows: { label: string; value: string }[]; code: string; footer: [string, string] }
//     export const STEP_NAMES: string[] · stepLabel(step) · canGoBack(step) · prevStep(step) · pickedOf(country: string, city: string, budget: number): PickedTrip
import { currencyName } from "@hav/shared/currency";
import { TRAVEL_COUNTRIES } from "@hav/shared/travel";
import { describe, expect, it } from "vitest";
import { BOARD_COLS, ORIGIN, STEP_NAMES, airfareInfo, boardRows, budgetLine, canGoBack, convertBudget, formatWon, introCountries, parseBudget, pickedOf, pinLine, prevStep, priceLine, quickPicks, rateNote, searchPlaces, stepLabel, ticketOf, wonText } from "./flow";
import { INTRO_CITIES } from "./places";

const INPUT = {
  rates: [
    { currency: "JPY", unit: 100, baseRate: 900 },
    { currency: "THB", unit: 1, baseRate: 39.84 },
    { currency: "USD", unit: 1, baseRate: 1400 },
    { currency: "EUR", unit: 1, baseRate: 1470 },
  ],
  signals: [
    { currency: "JPY", signal: "cheap" as const },
    { currency: "THB", signal: "cheap" as const },
    { currency: "EUR", signal: "normal" as const },
    { currency: "USD", signal: "expensive" as const },
  ],
  levels: [
    { country: "KOR", relative: 1 },
    { country: "JPN", relative: 1.12 },
    { country: "THA", relative: 0.521 },
    { country: "FRA", relative: 1.2 },
    { country: "USA", relative: 1.616 },
  ],
};
const ALL = introCountries(INPUT);
const by = (iso: string) => ALL.find((c) => c.iso === iso)!;
const short = (code: string) => currencyName(code).replace(/화$/, "");

describe("나라 · 도시 목록", () => {
  it("INTRO_CITIES — TRAVEL_COUNTRIES 의 모든 나라에 도시가 1개 이상 · 모르는 나라 키 없음", () => {
    expect(Object.keys(INTRO_CITIES).sort()).toEqual(Object.keys(TRAVEL_COUNTRIES).sort());
    for (const [iso, cities] of Object.entries(INTRO_CITIES)) {
      expect(cities.length, iso).toBeGreaterThan(0);
      for (const c of cities) expect(c.trim().length, `${iso} ${c}`).toBeGreaterThan(0);
    }
  });

  it("대표 도시(첫 도시) · 시안 목록", () => {
    expect(INTRO_CITIES.JPN).toEqual(["도쿄", "오사카", "후쿠오카", "삿포로", "오키나와", "교토"]);
    expect(INTRO_CITIES.THA).toEqual(["방콕", "치앙마이", "푸껫", "파타야"]);
    expect(INTRO_CITIES.USA[0]).toBe("뉴욕");
    expect(INTRO_CITIES.FRA).toEqual(["파리", "니스"]);
    expect(INTRO_CITIES.VNM).toContain("다낭");
    expect(INTRO_CITIES.MAC).toEqual(["마카오"]);
  });

  it("도시 이름은 판(12칸)에 'ICN → 도시' 로 들어갈 만큼 짧음 (최대 8자)", () => {
    for (const [iso, cities] of Object.entries(INTRO_CITIES)) for (const c of cities) expect([...c].length, `${iso} ${c}`).toBeLessThanOrEqual(8);
  });
});

describe("introCountries — 빌드 때 받은 값을 나라에 붙임 (없으면 null)", () => {
  it("TRAVEL_COUNTRIES 순서 그대로 40개", () => {
    expect(ALL.map((c) => c.iso)).toEqual(Object.keys(TRAVEL_COUNTRIES));
  });

  it("일본 — 엔(100) 900원 · 최근 90일 낮은 편 신호 · 물가 112", () => {
    expect(by("JPN")).toEqual({
      iso: "JPN", country: "일본", cities: INTRO_CITIES.JPN, currency: "JPY", currencyLabel: currencyName("JPY"), currencyShort: short("JPY"), per: 100, base: 900, signal: "cheap", price: 112,
    });
  });

  it("물가는 한국 100 기준 정수 — 태국 0.521 → 52 · 미국 1.616 → 162", () => {
    expect(by("THA").price).toBe(52);
    expect(by("USA").price).toBe(162);
  });

  it("환율이 없는 나라(대만 TWD)는 값 전부 null — 지어내지 않음", () => {
    const t = by("TWN");
    expect([t.currency, t.per, t.base, t.signal, t.price]).toEqual(["TWD", null, null, null, null]);
  });

  it("통화가 없는 나라(마카오)는 통화 이름 null · 같은 통화를 쓰는 괌은 미국 환율", () => {
    const m = by("MAC");
    expect([m.currency, m.currencyLabel, m.currencyShort, m.base, m.price]).toEqual([null, null, null, null, null]);
    expect([by("GUM").base, by("GUM").signal]).toEqual([1400, "expensive"]);
  });

  it("입력이 비어도 죽지 않음 — 40개 모두 환율 없음", () => {
    const e = introCountries({ rates: [], signals: [], levels: [] });
    expect(e).toHaveLength(40);
    expect(e.every((c) => c.base === null && c.signal === null && c.price === null)).toBe(true);
  });
});

describe("searchPlaces — 앞글자 우선", () => {
  const key = (q: string) => searchPlaces(q, ALL).map((h) => `${h.country.iso}:${h.city}:${h.rank}`);

  it("빈 글 · 공백뿐이면 결과 없음", () => {
    expect(searchPlaces("", ALL)).toEqual([]);
    expect(searchPlaces("   ", ALL)).toEqual([]);
  });

  it("나라 앞글자(0) → 대표 도시 · 나라 가운데(2) 는 그 뒤 ('일' → 일본 도쿄 · 독일 베를린)", () => {
    expect(key("일")).toEqual(["JPN:도쿄:0", "DEU:베를린:2"]);
  });

  it("도시 앞글자(1) — '파' → 파타야(태국)가 파리(프랑스)보다 먼저 (같은 순위는 나라 순서)", () => {
    expect(key("파")).toEqual(["THA:파타야:1", "FRA:파리:1"]);
  });

  it("도시 가운데(3) — '낭' → 베트남 다낭", () => {
    expect(key("낭")).toEqual(["VNM:다낭:3"]);
  });

  it("나라 앞글자가 도시 앞글자보다 앞 — '오' → 오스트리아(0) → 일본 오사카(1)", () => {
    const hits = searchPlaces("오", ALL);
    expect(hits.slice(0, 2).map((h) => h.country.iso)).toEqual(["AUT", "JPN"]); // 같은 순위(1)는 나라 순서 — 일본이 먼저 · 뒤에 오슬로(노르웨이) 등
    expect(hits.slice(0, 2).map((h) => h.rank)).toEqual([0, 1]);
    expect(hits[1].city).toBe("오사카");
  });

  it("공백 · 대소문자는 무시 — 'l a' 도 'LA' 도시 (미국)", () => {
    expect(key("l a")).toEqual(["USA:LA:1"]);
    expect(key("LA")).toEqual(["USA:LA:1"]);
  });

  it("최대 6개(기본) · 순위가 줄지 않음 · limit 로 줄임", () => {
    const hits = searchPlaces("아", ALL);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.length).toBeLessThanOrEqual(6);
    for (let i = 1; i < hits.length; i++) expect(hits[i].rank).toBeGreaterThanOrEqual(hits[i - 1].rank);
    expect(searchPlaces("아", ALL, 2).length).toBeLessThanOrEqual(2);
  });

  it("없는 곳은 빈 목록", () => {
    expect(searchPlaces("zzzz", ALL)).toEqual([]);
  });

  it("quickPicks — 처음 칩: 일본 도쿄 · 태국 방콕 · 미국 뉴욕", () => {
    expect(quickPicks(ALL).map((h) => `${h.country.iso}:${h.city}`)).toEqual(["JPN:도쿄", "THA:방콕", "USA:뉴욕"]);
  });
});

describe("boardRows — 출발 안내판 두 줄", () => {
  const hit = (iso: string, city: string) => ({ country: by(iso), city, rank: 0 as const });

  it("상수 — 출발 ICN · 12칸", () => {
    expect(ORIGIN).toBe("ICN");
    expect(BOARD_COLS).toBe(12);
  });

  it("입력이 없으면 안내 · 결과가 없으면 '없는 곳입니다'", () => {
    expect(boardRows("", null)).toEqual(["ICN → 어디로?", "목적지를 입력하세요"]);
    expect(boardRows("zzz", null)).toEqual(["ICN → ?", "없는 곳입니다"]);
  });

  it("고르면 'ICN → 도시' · '1유로 1,470원' (오늘 매매기준율)", () => {
    expect(boardRows("파리", hit("FRA", "파리"))).toEqual(["ICN → 파리", `1${short("EUR")} 1,470원`]);
    expect(boardRows("도쿄", hit("JPN", "도쿄"))[1]).toBe(`100${short("JPY")} 900원`);
    expect(boardRows("뉴욕", hit("USA", "뉴욕"))[1]).toBe(`1${short("USD")} 1,400원`);
    expect(boardRows("방콕", hit("THA", "방콕"))[1]).toBe(`1${short("THB")} 39.8원`);
  });

  it("환율이 없는 나라는 '환율 없음' (지어내지 않음)", () => {
    expect(boardRows("타이베이", hit("TWN", "타이베이"))).toEqual(["ICN → 타이베이", "환율 없음"]);
  });

  it("각 줄은 12자까지만", () => {
    for (const row of boardRows("x", hit("FRA", "가".repeat(20)))) expect([...row].length).toBeLessThanOrEqual(BOARD_COLS);
  });
});

describe("금액 · 환율 계산", () => {
  it("wonText — 100 이상 반올림 정수(쉼표) · 100 미만 소수 첫째 자리", () => {
    expect(wonText(1470)).toBe("1,470원");
    expect(wonText(834.37)).toBe("834원");
    expect(wonText(39.84)).toBe("39.8원");
    expect(wonText(1485.6)).toBe("1,486원");
  });

  it("parseBudget — 숫자만 · 비면 0 · 최대 100억", () => {
    expect(parseBudget("1,000,000원")).toBe(1_000_000);
    expect(parseBudget("abc")).toBe(0);
    expect(parseBudget("")).toBe(0);
    expect(parseBudget("99999999999999")).toBe(1e10);
    expect(parseBudget("0012")).toBe(12);
  });

  it("formatWon — 쉼표", () => {
    expect(formatWon(1234567)).toBe("1,234,567");
    expect(formatWon(0)).toBe("0");
  });

  it("convertBudget — 원 ÷ 환율 × 단위 · 반올림 · 환율이 없으면 null", () => {
    expect(convertBudget(1_000_000, 1470, 1)).toBe(680);
    expect(convertBudget(1_000_000, 900, 100)).toBe(111_111);
    expect(convertBudget(0, 900, 100)).toBe(0);
    expect(convertBudget(1_000_000, null, null)).toBeNull();
    expect(convertBudget(1_000_000, 0, 1)).toBeNull();
  });

  it("budgetLine — '1,000,000원 ≈ 111,111 엔화' · 환율이 없으면 '… · 환율 없음'", () => {
    expect(budgetLine(by("JPN"), 1_000_000)).toBe(`1,000,000원 ≈ 111,111 ${currencyName("JPY")}`);
    expect(budgetLine(by("TWN"), 1_000_000)).toBe("1,000,000원 · 환율 없음");
  });

  it("rateNote · pinLine · priceLine — 2단계 글", () => {
    expect(rateNote(by("JPN"))).toBe(`오늘 매매기준율 100 ${currencyName("JPY")} = 900원`);
    expect(pinLine(by("JPN"))).toBe(`${currencyName("JPY")}는 지금 최근 90일 중 낮은 편입니다`);
    expect(pinLine(by("FRA"))).toBe(`${currencyName("EUR")}는 지금 최근 90일 중 보통입니다`);
    expect(pinLine(by("USA"))).toBe(`${currencyName("USD")}는 지금 최근 90일 중 높은 편입니다`);
    expect(pinLine(by("JPN"), 30)).toContain("최근 30일 중");
    expect(priceLine(by("THA"))).toBe("물가는 태국 52 · 한국을 100으로 볼 때 (세계은행)");
    expect(priceLine(by("MAC"))).toBe("물가 데이터는 아직 없습니다");
  });

  it("신호가 없으면 '판정을 아직 내지 못했습니다' · 환율이 없으면 '고시 환율에 없어 계산하지 못했습니다'", () => {
    const noSignal = { ...by("JPN"), signal: null };
    expect(pinLine(noSignal)).toBe("최근 90일 판정을 아직 내지 못했습니다");
    expect(pinLine(by("TWN"))).toBe("대만 돈은 한국수출입은행 고시 환율에 없어 계산하지 못했습니다");
    expect(pinLine(by("MAC"))).toBe("마카오 돈은 한국수출입은행 고시 환율에 없어 계산하지 못했습니다");
  });
});

describe("airfareInfo — 이번 달 항공료 (홈 여행 타이밍과 같은 최근 36개월 같은 달 평균)", () => {
  /** 2023-11 ~ 2026-10 (36개월) · 달마다 값 */
  const year = (byMonth: Record<number, number>) => {
    const out: { period: string; value: number }[] = [];
    for (let i = 0; i < 36; i++) {
      const y = 2023 + Math.floor((10 + i) / 12);
      const m = ((10 + i) % 12) + 1;
      out.push({ period: `${y}-${String(m).padStart(2, "0")}`, value: byMonth[m] });
    }
    return out;
  };
  const SHAPE = { 1: 114, 2: 126, 3: 120, 4: 120, 5: 120, 6: 120, 7: 120, 8: 140, 9: 120, 10: 120, 11: 100, 12: 120 }; // 평균 120

  it("가장 낮은 달 — '11월은 국제항공료 지수가 1년 중 가장 낮은 달입니다'", () => {
    expect(airfareInfo(year(SHAPE), 11)).toEqual({ line: "11월은 국제항공료 지수가 1년 중 가장 낮은 달입니다", cell: "11월 · 1년 중 최저" });
  });

  it("가장 높은 달", () => {
    expect(airfareInfo(year(SHAPE), 8)).toEqual({ line: "8월은 국제항공료 지수가 1년 중 가장 높은 달입니다", cell: "8월 · 1년 중 최고" });
  });

  it("그 밖의 달 — 달 평균 대비 퍼센트 (2월 +5% · 1월 −5% · 6월 같음)", () => {
    expect(airfareInfo(year(SHAPE), 2)).toEqual({ line: "2월 국제항공료 지수는 1년 중 평균보다 5% 높습니다", cell: "2월 · 평균보다 5% 높음" });
    expect(airfareInfo(year(SHAPE), 1)).toEqual({ line: "1월 국제항공료 지수는 1년 중 평균보다 5% 낮습니다", cell: "1월 · 평균보다 5% 낮음" });
    expect(airfareInfo(year(SHAPE), 6)).toEqual({ line: "6월 국제항공료 지수는 1년 중 평균과 같습니다", cell: "6월 · 평균과 같음" });
  });

  it("몇 달만 받았으면 '1년 중' 대신 '받은 달 중' (없는 달을 비교한 척하지 않음)", () => {
    const part = [100, 110, 120, 130, 140, 150].map((value, i) => ({ period: `2026-0${i + 1}`, value }));
    expect(airfareInfo(part, 1).line).toBe("1월은 국제항공료 지수가 받은 달 중 가장 낮은 달입니다");
    expect(airfareInfo(part, 6).cell).toBe("6월 · 받은 달 중 최고");
  });

  it("그 달 값이 없거나 받은 달이 2개 미만이면 '없음' — 지어내지 않음", () => {
    const part = [100, 110].map((value, i) => ({ period: `2026-0${i + 1}`, value }));
    expect(airfareInfo(part, 11)).toEqual({ line: "국제항공료 지수를 아직 받지 못했습니다", cell: "없음" });
    expect(airfareInfo([{ period: "2026-11", value: 100 }], 11)).toEqual({ line: "국제항공료 지수를 아직 받지 못했습니다", cell: "없음" });
    expect(airfareInfo(null, 11).cell).toBe("없음");
    expect(airfareInfo([], 11).cell).toBe("없음");
    expect(airfareInfo(undefined, 11).line).toBe("국제항공료 지수를 아직 받지 못했습니다");
  });

  it("모든 달이 같으면 1월이 가장 낮고 12월이 가장 높음 (홈 여행 타이밍과 같은 규칙)", () => {
    const flat = year(Object.fromEntries(Array.from({ length: 12 }, (_, i) => [i + 1, 120])));
    expect(airfareInfo(flat, 1).cell).toBe("1월 · 1년 중 최저");
    expect(airfareInfo(flat, 12).cell).toBe("12월 · 1년 중 최고");
    expect(airfareInfo(flat, 5).cell).toBe("5월 · 평균과 같음");
  });
});

describe("ticketOf — 탑승권 내용", () => {
  const base = { country: by("JPN"), city: "도쿄", budget: 1_000_000, month: 11, airfare: "11월 · 1년 중 최저", today: "2026-11-16" };

  it("경로 · 여섯 줄(출발 · 환전 · 환율 · 판정 · 물가 · 항공료)", () => {
    const t = ticketOf(base);
    expect(t.route).toEqual(["ICN", "도쿄"]);
    expect(t.rows).toEqual([
      { label: "출발", value: "이번 달 11월" },
      { label: "환전", value: `100만 원 ≈ 111,111 ${currencyName("JPY")}` },
      { label: "환율", value: `100 ${currencyName("JPY")} = 900원` },
      { label: "판정", value: "낮은 편" },
      { label: "물가", value: "일본 112" },
      { label: "항공료", value: "11월 · 1년 중 최저" },
    ]);
  });

  it("바코드 글 · 아래 줄 — 날짜 + 통화 + 환율 × 100", () => {
    const t = ticketOf(base);
    expect(t.code).toBe("20261116JPY90000");
    expect(t.footer[0].startsWith("2026-11-16")).toBe(true);
    expect(t.footer[1]).toBe("flapfx.com");
  });

  it("값이 없으면 '환율 없음' · '판정 없음' · '데이터 없음' · 바코드 XXX0 (지어내지 않음)", () => {
    const t = ticketOf({ ...base, country: by("MAC"), city: "마카오", airfare: "없음" });
    expect(t.rows.map((r) => r.value)).toEqual(["이번 달 11월", "환율 없음", "환율 없음", "판정 없음", "데이터 없음", "없음"]);
    expect(t.code).toBe("20261116XXX0");
  });
});

describe("단계 이름 · 이전 · 저장 값", () => {
  it("5단계 이름", () => {
    expect(STEP_NAMES).toEqual(["터미널 입구", "환전소", "게이트", "이륙", "홈으로"]);
    expect(stepLabel(1)).toBe("1 / 5 · 터미널 입구");
    expect(stepLabel(4)).toBe("4 / 5 · 이륙");
    expect(stepLabel(5)).toBe("5 / 5 · 홈으로");
  });

  it("이전은 2 · 3 · 4단계에만 (1단계 · 5단계는 없음) — 이전은 한 단계 앞", () => {
    expect([1, 2, 3, 4, 5].map(canGoBack)).toEqual([false, true, true, true, false]);
    expect([1, 2, 3, 4, 5].map(prevStep)).toEqual([1, 1, 2, 3, 5]);
  });

  it("pickedOf — 저장할 값 모양 (v 1 · 나라 · 도시 · 예산)", () => {
    expect(pickedOf("FRA", "파리", 1_000_000)).toEqual({ v: 1, country: "FRA", city: "파리", budget: 1_000_000 });
  });
});
