// 작업 0345 — 통화 상세 한 줄 답 · 자주 묻는 질문 (시안 5-new · 6-new) 의 문장 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
// 요구(request.md): 한 줄 답은 페이지에 이미 있는 값(오늘 값 · 1년 평균 · 1년 최저)으로만 · 질문 네 개: 지금 싼 편인가 · 큰 금액은 원화로 얼마 · 쓰는 나라 물가는 한국보다 비싼가(작업 1 페이지로 링크) · 환율은 언제 바뀌나(실제 수집 일정대로) · FAQPage
//
// builder 가 만들 것 — apps/web/src/features/currencies/detail/currency-faq.ts (순수 함수 · tsx 는 그리기만)
//   export function unitName(code: string): string                       // 단위 이름: JPY "엔" · USD "달러" · EUR "유로" · THB "바트" · VND "동" · CNY · CNH "위안" · 표에 없으면 currencyName(code)  (currencyListName 의 마지막 낱말)
//   export function answerLine(p: { code: string; rate: { baseRate: number; unit: number; date: string } | null; stats: { min: number; avg: number } | null }): { label: string; text: string } | null
//   export function bigAmount(code: string): { amount: number; text: string }   // 흔히 바꾸는 큰 금액(표 하나): JPY 100000 "10만 엔" · USD 1000 "1,000달러" · EUR 1000 "1,000유로" · CNY · CNH 10000 "1만 위안" · THB 10000 "1만 바트" · VND 1000000 "100만 동" · 그 밖은 1000 "1,000" + unitName
//   export type FaqCountry = { country: string; name: string; relative: number | null; year: number | null }
//   export function faqCountry(code: string, rows: { country: string; relative: number; year: number }[] | null): FaqCountry | null   // 그 통화를 쓰는 첫 나라(TRAVEL_COUNTRIES 순서) · 물가 줄이 없으면 relative · year 는 null · 쓰는 나라가 없으면 null
//   export type CurrencyFaqItem = { q: string; a: string; open: boolean; href: string | null }
//   export function currencyFaq(p: { code: string; name: string; rate: { baseRate: number; unit: number; date: string } | null; stats: { min: number; avg: number } | null; signalText: string; country: FaqCountry | null }): CurrencyFaqItem[]
//       name = currencyName(code) 예 "엔화" · signalText = percentileText(...) 가 만든 글(사이트 신호 규칙 그대로)
//   apps/web/src/app/currencies/[code]/page.tsx — JsonLd 로 faqLd(items) (작업 0344 에 만든 apps/web/src/shared/seo/seo.ts 의 faqLd)
// 주소는 작업 0344 의 countryPath(code) = "/prices/JPN"
import { describe, expect, it } from "vitest";
import { answerLine, bigAmount, currencyFaq, faqCountry, unitName } from "./currency-faq";

const JPY = { baseRate: 846.76, unit: 100, date: "2026-11-24" };
const STATS = { min: 833.45, avg: 912.92 };

describe("단위 이름", () => {
  it("엔 · 달러 · 유로 · 바트 · 동 · 위안 · 표에 없는 통화는 통화 이름", () => {
    expect(["JPY", "USD", "EUR", "THB", "VND", "CNY", "CNH"].map(unitName)).toEqual(["엔", "달러", "유로", "바트", "동", "위안", "위안"]);
    expect(unitName("AED")).toBe("디르함");
  });
});

describe("한 줄 답 (시안 5-new)", () => {
  it("오늘 값 · 1년 평균 대비 % · 1년 최저와의 차이 — 시안 문장 그대로", () => {
    expect(answerLine({ code: "JPY", rate: JPY, stats: STATS })).toEqual({
      label: "한 줄 답 · 2026-11-24 기준",
      text: "100엔은 846.76원으로, 1년 평균(912.92원)보다 7% 낮고 1년 최저(833.45원)와 1.6% 차이입니다.",
    });
  });

  it("평균보다 높으면 '높고' · 단위 1 통화(달러)는 '1달러는' · 1,000원 이상은 소수 첫째 자리까지(끝자리 0 생략)", () => {
    const t = answerLine({ code: "USD", rate: { baseRate: 1500, unit: 1, date: "2026-11-24" }, stats: { min: 1380, avg: 1450 } })?.text;
    expect(t).toBe("1달러는 1,500원으로, 1년 평균(1,450원)보다 3% 높고 1년 최저(1,380원)와 8.7% 차이입니다.");
  });

  it("1년 최저와 같으면 '같은 값' · 평균과 반올림해 같으면 '거의 같고'", () => {
    const t = answerLine({ code: "JPY", rate: { baseRate: 833.45, unit: 100, date: "2026-11-24" }, stats: { min: 833.45, avg: 833.4 } })?.text;
    expect(t).toBe("100엔은 833.45원으로, 1년 평균(833.4원)과 거의 같고 1년 최저(833.45원)와 같은 값입니다.");
  });

  it("1년 기록을 못 받았으면 비교를 빼고 오늘 값만 (지어내지 않음)", () => {
    expect(answerLine({ code: "JPY", rate: JPY, stats: null })?.text).toBe("100엔은 846.76원입니다.");
  });

  it("오늘 값이 없으면 null — 상자 없음", () => {
    expect(answerLine({ code: "JPY", rate: null, stats: STATS })).toBeNull();
  });

  it("받침 없는 단위는 '는' · 있는 단위는 '은' (유로 · 바트 · 동 · 위안)", () => {
    const at = (code: string) => answerLine({ code, rate: { baseRate: 1500, unit: 1, date: "2026-11-24" }, stats: null })?.text;
    expect(at("EUR")).toBe("1유로는 1,500원입니다.");
    expect(at("THB")).toBe("1바트는 1,500원입니다.");
    expect(at("VND")).toBe("1동은 1,500원입니다.");
    expect(at("CNH")).toBe("1위안은 1,500원입니다.");
  });
});

describe("큰 금액 표 (질문 둘)", () => {
  it("통화마다 흔히 바꾸는 단위 — 엔 10만 · 달러 · 유로 1,000 · 위안 · 바트 1만 · 동 100만", () => {
    expect(bigAmount("JPY")).toEqual({ amount: 100000, text: "10만 엔" });
    expect(bigAmount("USD")).toEqual({ amount: 1000, text: "1,000달러" });
    expect(bigAmount("EUR")).toEqual({ amount: 1000, text: "1,000유로" });
    expect(bigAmount("CNY")).toEqual({ amount: 10000, text: "1만 위안" });
    expect(bigAmount("CNH")).toEqual({ amount: 10000, text: "1만 위안" });
    expect(bigAmount("THB")).toEqual({ amount: 10000, text: "1만 바트" });
    expect(bigAmount("VND")).toEqual({ amount: 1000000, text: "100만 동" });
  });

  it("표에 없는 통화는 1,000 단위", () => {
    expect(bigAmount("AED")).toEqual({ amount: 1000, text: "1,000디르함" });
  });
});

describe("쓰는 나라 (질문 셋)", () => {
  const rows = [{ country: "JPN", relative: 1.12, year: 2025 }, { country: "FRA", relative: 1.2, year: 2025 }, { country: "DEU", relative: 1.15, year: 2025 }];

  it("그 통화를 쓰는 첫 나라 — 엔은 일본 · 유로는 TRAVEL_COUNTRIES 순서의 첫 나라(프랑스) · 달러는 미국", () => {
    expect(faqCountry("JPY", rows)).toEqual({ country: "JPN", name: "일본", relative: 1.12, year: 2025 });
    expect(faqCountry("EUR", rows)).toEqual({ country: "FRA", name: "프랑스", relative: 1.2, year: 2025 });
    expect(faqCountry("USD", rows)?.country).toBe("USA");
  });

  it("물가 줄이 없거나 물가를 못 받았으면 relative · year 는 null (지어내지 않음)", () => {
    expect(faqCountry("USD", rows)).toEqual({ country: "USA", name: "미국", relative: null, year: null });
    expect(faqCountry("JPY", null)).toEqual({ country: "JPN", name: "일본", relative: null, year: null });
  });

  it("여행지 표에 쓰는 나라가 없는 통화는 null", () => {
    expect(faqCountry("BRL", rows)).toBeNull();
  });
});

describe("자주 묻는 질문 넷 (시안 6-new · 처음 두 개 펼침)", () => {
  const base = { code: "JPY", name: "엔화", rate: JPY, stats: STATS, signalText: "최근 90일 중간 수준", country: { country: "JPN", name: "일본", relative: 1.12, year: 2025 } };

  it("질문 문장 — 시안 6-new 그대로 · 순서 · 처음 두 개만 펼침", () => {
    const f = currencyFaq(base);
    expect(f.map((i) => i.q)).toEqual(["엔화 지금 싼 편인가요?", "10만 엔은 원화로 얼마인가요?", "일본 물가는 한국보다 비싼가요?", "오늘 환율은 언제 바뀌나요?"]);
    expect(f.map((i) => i.open)).toEqual([true, true, false, false]);
  });

  it("질문 1 — 오늘 값 · 신호 문장(사이트 규칙 그대로) · 1년 평균 · 1년 최저 대비", () => {
    const a = currencyFaq(base)[0].a;
    expect(a).toContain("100엔 846.76원");
    expect(a).toContain("최근 90일 중간 수준");
    expect(a).toContain("1년 평균(912.92원)보다 7% 낮");
    expect(a).toContain("1년 최저(833.45원)와는 1.6% 차이");
  });

  it("질문 2 — 매매기준율로 계산한 원화 · 송금 · 현찰은 수수료로 달라짐", () => {
    const a = currencyFaq(base)[1].a;
    expect(a).toContain("846,760원"); // 100,000 × 846.76 ÷ 100
    expect(a).toContain("매매기준율");
    expect(a).toContain("수수료");
  });

  it("질문 2 — 달러 1,000 은 '1,000달러는' · 계산 값은 원 단위로 반올림", () => {
    const f = currencyFaq({ ...base, code: "USD", name: "미국 달러", rate: { baseRate: 1399.55, unit: 1, date: "2026-11-24" }, country: { country: "USA", name: "미국", relative: 1.62, year: 2025 } });
    expect(f[1].q).toBe("1,000달러는 원화로 얼마인가요?");
    expect(f[1].a).toContain("1,399,550원");
  });

  it("질문 3 — 물가 자료가 있으면 그 나라 문장 + 작업 1 페이지(/prices/JPN) 링크", () => {
    const item = currencyFaq(base)[2];
    expect(item.a).toContain("12%");
    expect(item.a).toContain("2025");
    expect(item.href).toBe("/prices/JPN");
  });

  it("질문 3 — 자료가 없으면 질문을 빼지 않고 '자료 없음' · 페이지가 없으니 링크 없음", () => {
    const item = currencyFaq({ ...base, country: { country: "JPN", name: "일본", relative: null, year: null } })[2];
    expect(item.q).toBe("일본 물가는 한국보다 비싼가요?");
    expect(item.a).toBe("자료 없음");
    expect(item.href).toBeNull();
  });

  it("질문 3 — 쓰는 나라가 여행지 표에 없는 통화는 이 질문만 뺌(질문 셋)", () => {
    const f = currencyFaq({ ...base, code: "BRL", name: "브라질 헤알", country: null });
    expect(f).toHaveLength(3);
    expect(f.some((i) => i.q.includes("물가"))).toBe(false);
  });

  it("질문 4 — 실제 수집 일정대로(평일 한국 시간 12시 이후 수출입은행 값 · 못 받으면 12:10 ~ 17:40 30분마다 다시 · 주말 · 공휴일은 직전 영업일 값)", () => {
    const a = currencyFaq(base)[3].a;
    for (const s of ["평일", "12시", "수출입은행", "12:10", "17:40", "30분", "공휴일", "직전 영업일"]) expect(a, s).toContain(s);
  });

  it("오늘 환율이 없으면 환율 값이 들어가는 답은 '자료 없음' (질문 1 · 2) · 일정 답(4)은 그대로", () => {
    const f = currencyFaq({ ...base, rate: null, stats: null });
    expect(f[0].a).toBe("자료 없음");
    expect(f[1].a).toBe("자료 없음");
    expect(f[3].a).toContain("평일");
  });

  it("1년 기록이 없으면 질문 1 은 평균 · 최저 비교만 빼고 오늘 값 · 신호는 그대로", () => {
    const a = currencyFaq({ ...base, stats: null })[0].a;
    expect(a).toContain("100엔 846.76원");
    expect(a).toContain("최근 90일 중간 수준");
    expect(a).not.toContain("1년 평균");
  });
});
