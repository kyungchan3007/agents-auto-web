// 작업 0344 — 나라별 여행 물가 페이지 /prices/[code] 의 계산 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
// 요구(request.md): 주소 · 한 줄 답 상자(통화 없는 나라는 없음) · 다음으로 볼 것 항공권 카드(8개 도시 나라 / 국제항공료 지수 / 자료 없음) · 견줘 볼 나라 넷(다시 계산한 %) · 자주 묻는 질문
//
// builder 가 만들 것 — apps/web/src/features/prices/country/country-view.ts (순수 함수 · tsx 는 그리기만)
//   export const countryPath = (code: string) => string                         // "/prices/JPN" (alpha-3 대문자 · sdd)
//   export function countryTargets(levels: PriceLevels | null): string[]        // 빌드 때 받은 물가에 값이 있는 TRAVEL_COUNTRIES 키(기준 나라 제외) · TRAVEL_COUNTRIES 순서 · 못 받았거나 비면 ["JPN"]
//   export function oneLineAnswer(p: { currency: string | null; unitLabel: string; baseRate: number | null; avg1y: number | null; date: string | null }): { label: string; text: string } | null
//   export function compareCountries(base: string, rows: { country: string; relative: number }[], limit?: number): CompareItem[]   // limit 기본 4
//       CompareItem = { country: string; name: string; index: number; diffText: string }
//   export function flightCard(p: { code: string; calendar: AirfareCalendar | null; timing: { cheapest: number; complete: boolean } | null }): FlightCard
//       FlightCard = { kind: "fare"; city: string; big: string; say: string; depart: string; fetchedOn: string }
//                  | { kind: "timing"; month: number; big: string; say: string }
//                  | { kind: "none"; say: string }
//   export type FaqItem = { q: string; a: string; open: boolean }
//   export function countryFaq(p: { name: string; relative: number; year: number; budget: { dailyWon: number; days: number; totalWon: number } | null; exchange: { text: string } | null; flight: FlightCard }): FaqItem[]
// apps/web/src/shared/seo/seo.ts 에 faqLd(items) — 테스트는 apps/web/src/shared/seo/faq-ld.test.ts
import type { AirfareCalendar } from "@hav/shared/airfare";
import type { PriceLevels } from "@hav/shared/prices";
import { describe, expect, it } from "vitest";
import { compareCountries, countryFaq, countryPath, countryTargets, flightCard, moreCountriesText, oneLineAnswer } from "./country-view";

const lv = (rows: [string, number][]): PriceLevels => ({ base: "KOR", rows: rows.map(([country, relative]) => ({ country, year: 2025, level: relative * 100, relative, source: "worldbank" })) });

describe("주소 (요구: 새 경로 /prices/[code])", () => {
  it("alpha-3 대문자 — 통화 상세 /currencies/USD 와 같은 모양", () => {
    expect(countryPath("JPN")).toBe("/prices/JPN");
    expect(countryPath("MAC")).toBe("/prices/MAC");
  });

  it("대상 나라 — 물가 자료가 있는 TRAVEL_COUNTRIES 전부(표 순서) · 표에 없는 나라(예: 케냐) · 기준 나라(KOR)는 뺌", () => {
    const t = countryTargets(lv([["KEN", 0.5], ["VNM", 0.46], ["MAC", 1.0], ["JPN", 1.12], ["KOR", 1]]));
    expect(t).toEqual(["JPN", "MAC", "VNM"]); // TRAVEL_COUNTRIES 순서: JPN … MAC … VNM
  });

  it("물가를 못 받았거나 비면 일본 하나 (통화 상세의 DEFAULT_CODE 방식 · 지어내지 않음)", () => {
    expect(countryTargets(null)).toEqual(["JPN"]);
    expect(countryTargets(lv([]))).toEqual(["JPN"]);
  });
});

describe("오늘 기준 한 줄 답 (시안 1-new)", () => {
  const jpy = { currency: "JPY", unitLabel: "100엔", baseRate: 846.76, avg1y: 912.92, date: "2026-11-24" };

  it("오늘 값 · 1년 평균 대비 % — 시안 문장 그대로", () => {
    expect(oneLineAnswer(jpy)).toEqual({ label: "오늘 기준 한 줄 답 · 2026-11-24", text: "오늘 100엔은 846.76원으로, 1년 평균(912.92원)보다 7% 쌉니다" });
  });

  it("평균보다 높으면 '비쌉니다' · 반올림해 0 이면 '거의 같습니다' · 받침 없는 단위는 '는'", () => {
    expect(oneLineAnswer({ ...jpy, baseRate: 1000 })?.text).toBe("오늘 100엔은 1,000.00원으로, 1년 평균(912.92원)보다 10% 비쌉니다");
    expect(oneLineAnswer({ ...jpy, baseRate: 913 })?.text).toBe("오늘 100엔은 913.00원으로, 1년 평균(912.92원)과 거의 같습니다");
    expect(oneLineAnswer({ ...jpy, unitLabel: "1달러", currency: "USD", baseRate: 1400, avg1y: 1500 })?.text).toBe("오늘 1달러는 1,400.00원으로, 1년 평균(1,500.00원)보다 7% 쌉니다");
  });

  it("1년 평균을 못 받았으면 평균 비교만 뺌 (지어내지 않음)", () => {
    expect(oneLineAnswer({ ...jpy, avg1y: null })?.text).toBe("오늘 100엔은 846.76원입니다");
  });

  it("통화가 없는 나라(마카오 등) · 오늘 값이 없으면 상자 없음(null)", () => {
    expect(oneLineAnswer({ ...jpy, currency: null })).toBeNull();
    expect(oneLineAnswer({ ...jpy, baseRate: null })).toBeNull();
    expect(oneLineAnswer({ ...jpy, date: null })).toBeNull();
  });
});

describe("견줘 볼 나라 (시안 2-new · sdd: 같은 지역 · 물가 차이 작은 순 · 모자라면 다른 지역)", () => {
  // 일본 112 기준 — 시안의 숫자(베트남 46 → 59% 쌈 · 태국 52 → 54% · 중국 78 → 30% · 홍콩 120 → 7% 비쌈)
  const asia: [string, number][] = [["JPN", 1.12], ["VNM", 0.46], ["THA", 0.52], ["CHN", 0.78], ["HKG", 1.2], ["SGP", 1.27], ["USA", 1.62]];
  const rows = (a: [string, number][]) => a.map(([country, relative]) => ({ country, relative }));

  it("그 나라 물가 기준으로 다시 계산한 % (베트남 46 ÷ 일본 112 → 59% 쌈 · 홍콩 120 → 7% 비쌈)", () => {
    const r = compareCountries("JPN", rows(asia));
    const by = Object.fromEntries(r.map((i) => [i.country, i]));
    expect(by.CHN).toEqual({ country: "CHN", name: "중국", index: 78, diffText: "일본보다 30% 쌈" });
    expect(by.HKG).toEqual({ country: "HKG", name: "홍콩", index: 120, diffText: "일본보다 7% 비쌈" });
    expect(compareCountries("JPN", rows([["JPN", 1.12], ["VNM", 0.46]]))[0]).toEqual({ country: "VNM", name: "베트남", index: 46, diffText: "일본보다 59% 쌈" });
    expect(compareCountries("JPN", rows([["JPN", 1.12], ["THA", 0.52]]))[0].diffText).toBe("일본보다 54% 쌈");
  });

  it("같은 지역(아시아)에서 물가 차이가 작은 순 넷 — 자기 자신 제외 · 다른 지역(미국)은 같은 지역이 넷 이상이면 안 들어감", () => {
    expect(compareCountries("JPN", rows(asia)).map((i) => i.country)).toEqual(["HKG", "SGP", "CHN", "THA"]); // 차이 8 · 15 · 34 · 60 (베트남 66 은 다섯째)
  });

  it("같은 지역이 넷보다 적으면 다른 지역에서 차이가 작은 순으로 채움", () => {
    const americas: [string, number][] = [["USA", 1.62], ["CAN", 1.1], ["MEX", 0.6], ["JPN", 1.12], ["GBR", 1.3], ["FRA", 1.2], ["THA", 0.52]];
    expect(compareCountries("USA", rows(americas)).map((i) => i.country)).toEqual(["CAN", "MEX", "GBR", "FRA"]); // 같은 지역 둘(차이 .52 · 1.02) 뒤에 다른 지역 GBR(.32) · FRA(.42)
  });

  it("값이 없는 나라 · 표에 없는 나라는 넣지 않음 · 후보가 모자라면 있는 만큼만 · 기준 나라에 값이 없으면 빈 목록", () => {
    expect(compareCountries("JPN", rows([["JPN", 1.12], ["XXX", 1], ["VNM", 0.46]])).map((i) => i.country)).toEqual(["VNM"]);
    expect(compareCountries("JPN", rows([["VNM", 0.46]]))).toEqual([]);
  });

  it("반올림해 0 이면 '거의 같음' · limit 로 개수를 바꿈", () => {
    expect(compareCountries("JPN", rows([["JPN", 1.12], ["HKG", 1.121]]))[0].diffText).toBe("일본과 거의 같음");
    expect(compareCountries("JPN", rows(asia), 2)).toHaveLength(2);
  });
});

describe("항공권 카드 (요구: 8개 도시 나라 / 국제항공료 지수 / 자료 없음)", () => {
  const city = (cityName: string, id: string, prices: [string, string, number][]) => ({
    id,
    city: cityName,
    airport: id,
    fetchedOn: "2026-11-23",
    days: prices.map(([depart, ret, price]) => ({ depart, return: ret, price })),
  });
  const cal: AirfareCalendar = {
    fetchedOn: "2026-11-23",
    cities: [
      city("오사카", "KIX", [["2026-12-01", "2026-12-08", 250000]]),
      city("도쿄", "NRT", [["2026-12-02", "2026-12-09", 300000], ["2026-12-29", "2027-01-05", 276287], ["2026-12-30", "2027-01-06", 276287]]),
    ],
  };
  const timing = { cheapest: 11, complete: true };

  it("8개 도시가 있는 나라 — 그 나라 대표 도시(도쿄)의 1주 왕복 최저가 · 출발일 · 받은 날 (시안 2-new)", () => {
    expect(flightCard({ code: "JPN", calendar: cal, timing })).toEqual({
      kind: "fare",
      city: "도쿄",
      big: "276,287원부터",
      say: "12월 29일 출발 1주 왕복 · 11월 23일 받은 가격",
      depart: "2026-12-29", // 최저가가 같으면 앞선 날
      fetchedOn: "2026-11-23",
    });
  });

  it("대표 도시가 달력에 없으면 TRAVEL_CITIES 순서로 다음 도시 (도쿄 없으면 오사카)", () => {
    const c = flightCard({ code: "JPN", calendar: { ...cal, cities: [cal.cities[0]] }, timing });
    expect(c).toMatchObject({ kind: "fare", city: "오사카", big: "250,000원부터" });
  });

  it("8개 도시에 없는 나라 — 가격을 지어내지 않고 통계청 국제항공료 지수의 '떠나기 싼 달' (홈 '11월에 떠나세요' 와 같은 달)", () => {
    const c = flightCard({ code: "MAC", calendar: cal, timing });
    expect(c.kind).toBe("timing");
    expect(c).toMatchObject({ month: 11, big: "11월" });
    expect(JSON.stringify(c)).toContain("국제항공료 지수");
    expect(JSON.stringify(c)).not.toMatch(/원부터/);
  });

  it("달이 모자라면 '1년 중' 대신 '받은 달 중' (없는 달을 비교한 척하지 않음)", () => {
    const c = flightCard({ code: "MAC", calendar: null, timing: { cheapest: 3, complete: false } });
    expect(c).toMatchObject({ kind: "timing", month: 3 });
    expect((c as { say: string }).say).toContain("받은 달 중");
  });

  it("도시 달력도 지수도 없으면 '자료 없음' · 그 도시에 가격이 하나도 없어도 같음", () => {
    expect(flightCard({ code: "MAC", calendar: null, timing: null })).toEqual({ kind: "none", say: "자료 없음" });
    expect(flightCard({ code: "JPN", calendar: { fetchedOn: null, cities: [] }, timing: null })).toEqual({ kind: "none", say: "자료 없음" });
    expect(flightCard({ code: "JPN", calendar: { fetchedOn: "2026-11-23", cities: [city("도쿄", "NRT", [])] }, timing: null })).toEqual({ kind: "none", say: "자료 없음" });
  });

  it("도시 달력이 비어도 지수가 있으면 그 나라도 '떠나기 싼 달'", () => {
    expect(flightCard({ code: "JPN", calendar: null, timing }).kind).toBe("timing");
  });
});

describe("자주 묻는 질문 (시안 6-new · 처음 두 개 펼침 · 답은 페이지에 있는 값으로만)", () => {
  const fare = flightCard({ code: "JPN", calendar: { fetchedOn: "2026-11-23", cities: [{ id: "NRT", city: "도쿄", airport: "NRT", fetchedOn: "2026-11-23", days: [{ depart: "2026-12-29", return: "2027-01-05", price: 276287 }] }] }, timing: null });
  const base = { name: "일본", relative: 1.12, year: 2025, budget: { dailyWon: 112000, days: 4, totalWon: 448000 }, exchange: { text: "100엔 846.76원으로 1년 중 하위 39%, 보통입니다." }, flight: fare };

  it("네 문항 — 물가 · 하루 예산 · 환전 · 항공권 순 · 첫 두 개만 펼침", () => {
    const f = countryFaq(base);
    expect(f.map((i) => i.q)).toEqual(["일본 물가는 한국보다 비싼가요?", "일본 여행 하루 예산은 얼마인가요?", "환전은 지금 해도 되나요?", "언제 떠나면 항공권이 싼가요?"]);
    expect(f.map((i) => i.open)).toEqual([true, true, false, false]);
  });

  it("답은 받은 값으로만 — 물가 % · 자료 연도 · 하루 예산 · 환전 문장 · 항공권 최저가", () => {
    const [price, budget, fx, air] = countryFaq(base);
    expect(price.a).toContain("12%");
    expect(price.a).toContain("높");
    expect(price.a).toContain("2025");
    expect(budget.a).toContain("112,000원");
    expect(budget.a).toContain("448,000원");
    expect(fx.a).toContain("846.76원");
    expect(air.a).toContain("276,287원");
  });

  it("물가가 낮은 나라는 '낮' · 비슷하면 '비슷'", () => {
    expect(countryFaq({ ...base, name: "베트남", relative: 0.46 })[0].a).toMatch(/54%.*낮|낮.*54%/);
    expect(countryFaq({ ...base, relative: 1.02 })[0].a).toContain("비슷");
  });

  it("값이 없는 문항은 통째로 뺌 — 통화 없는 나라는 환전 문항 없음 · 예산 · 항공권 자료 없으면 그 문항 없음 (지어내지 않음)", () => {
    const mac = countryFaq({ ...base, name: "마카오", relative: 1.0, exchange: null, flight: { kind: "none", say: "자료 없음" } });
    expect(mac.map((i) => i.q)).toEqual(["마카오 물가는 한국보다 비싼가요?", "마카오 여행 하루 예산은 얼마인가요?"]);
    expect(countryFaq({ ...base, budget: null }).some((i) => i.q.includes("예산"))).toBe(false);
  });

  it("항공권 문항 — 도시 달력이 없으면 지수의 떠나기 싼 달로 답", () => {
    const f = countryFaq({ ...base, flight: { kind: "timing", month: 11, big: "11월", say: "통계청 국제항공료 지수로 보면 1년 중 가장 낮은 달" } });
    expect(f.at(-1)?.a).toContain("11월");
  });
});

// 작업 0355 — /prices/[code] 아래 이어 가는 버튼 글 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
// builder 가 만들 것 — country-view.ts 에 export function moreCountriesText(count: number): string
//   "다른 나라 물가도 보기 · 39개 나라" (끝 화살표 › 는 부품이 꾸밈으로 붙임) · 나라 수는 받은 숫자 그대로(고정 숫자 아님)
describe("다른 나라 물가도 보기 버튼 글 (작업 0355)", () => {
  it("나라 수를 넣어 한 줄 — 받은 숫자 그대로 (고정 숫자를 쓰지 않음)", () => {
    expect(moreCountriesText(39)).toBe("다른 나라 물가도 보기 · 39개 나라");
    expect(moreCountriesText(12)).toBe("다른 나라 물가도 보기 · 12개 나라");
  });

  it("countryTargets 개수와 이어짐 — 목록이 달라지면 글도 달라짐", () => {
    const a = countryTargets(lv([["JPN", 1.1], ["VNM", 0.5]]));
    const b = countryTargets(lv([["JPN", 1.1], ["VNM", 0.5], ["THA", 0.6]]));
    expect(moreCountriesText(a.length)).toBe("다른 나라 물가도 보기 · 2개 나라");
    expect(moreCountriesText(b.length)).toBe("다른 나라 물가도 보기 · 3개 나라");
  });
});
