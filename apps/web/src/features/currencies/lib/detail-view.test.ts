// 작업 0170 — 통화 화면(/currencies · /currencies/{통화}) 순수 함수 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
// Figma 02 · SR-CUR-01 — 통화 목록 이름 · 1년 최저/최고/평균 · 오늘 환율 옆 한 줄
// 판정은 사이트 신호 규칙 그대로(최근 90일 백분위 · lead 결정) — Figma 예시의 "1년 평균보다 2.3% 비쌉니다" 가 아님. 1년 평균은 숫자 카드 · 그래프 점선으로만
//
// builder 가 만들 것 — apps/web/src/features/currencies/lib/detail-view.ts
//   currencyListName(code: string): string
//     - 통화 목록 이름 (Figma): USD "미국 달러" · JPY "일본 엔" · EUR "유로" · THB "태국 바트" · VND "베트남 동" · CNY · CNH "중국 위안" · 그 밖은 currencyName(code) 그대로 (표에 없는 통화는 코드)
//   currencyListLabel(code: string, unit: number): string
//     - currencyListName + (unit > 1 이면 " " + unit) → "일본 엔 100" · "미국 달러" · "베트남 동 100"
//   yearStats(days: { baseRate: number }[]): { min: number; max: number; avg: number } | null
//     - 받은 값으로만 · 기록이 없으면 null (지어내지 않음 · 빈 날은 채우지 않음) · 평균은 반올림하지 않음
//   (작업 0175 추가 요청 — 그래프 최고 · 최저 금액)
//   extremeDays(days: { date: string; baseRate: number }[]): { max: { date: string; baseRate: number }; min: { date: string; baseRate: number } } | null
//     - 최고 · 최저가 나온 날과 값 — 같은 값이면 앞선 날짜 · 기록이 없으면 null (지어내지 않음) · 값은 yearStats 의 max · min 과 같음(카드와 같은 계산 · C4)
//   extremeLabelText(kind: "max" | "min", rate: { baseRate: number; unit: number }): string
//     - `${최고|최저} ${rateText 의 value}${rateText 의 unit}` — 예 "최고 1,554.4원" · "최저 1,322.6원" · 100 단위 통화는 "최저 912.34원 / 100" (@hav/shared/currency 의 rateText 그대로)
//   detailLine(p: { signal: Signal | null; percentile: number | null; windowDays: number; date: string; source: "koreaexim" | "frankfurter" }): string
//     - `${percentileText(signal, percentile, windowDays)} · ${date} ${SOURCE_NAME[source]}` — percentileText · SOURCE_NAME 은 @hav/shared/currency 의 것 그대로 (신호가 없으면 percentileText 의 "자료가 모자라 신호를 내지 않았습니다" 문장)
import { describe, expect, it } from "vitest";
import { currencyListLabel, currencyListName, detailLine, extremeDays, extremeLabelText, yearStats } from "./detail-view";
import { PERIODS, sliceDays } from "./periods";

describe("currencyListName · currencyListLabel", () => {
  it("Figma 목록 이름 — 미국 달러 · 일본 엔 · 유로 · 태국 바트 · 베트남 동 · 중국 위안", () => {
    expect([ "USD", "JPY", "EUR", "THB", "VND", "CNY", "CNH"].map(currencyListName)).toEqual(["미국 달러", "일본 엔", "유로", "태국 바트", "베트남 동", "중국 위안", "중국 위안"]);
  });

  it("표에 없는 통화는 기존 이름 · 코드도 없으면 코드", () => {
    expect(currencyListName("AED")).toBe("디르함");
    expect(currencyListName("XYZ")).toBe("XYZ");
  });

  it("단위가 1 보다 크면 뒤에 붙임 — 일본 엔 100 · 베트남 동 100 · 미국 달러(단위 1 은 안 붙임)", () => {
    expect(currencyListLabel("JPY", 100)).toBe("일본 엔 100");
    expect(currencyListLabel("VND", 100)).toBe("베트남 동 100");
    expect(currencyListLabel("USD", 1)).toBe("미국 달러");
  });
});

describe("yearStats — 1년 최저 · 최고 · 평균 (받은 값으로만)", () => {
  it("최저 · 최고 · 평균", () => {
    expect(yearStats([{ baseRate: 1301 }, { baseRate: 1421 }, { baseRate: 1331 }])).toEqual({ min: 1301, max: 1421, avg: (1301 + 1421 + 1331) / 3 });
  });

  it("값이 하나면 셋 다 같음 · 없으면 null", () => {
    expect(yearStats([{ baseRate: 1382 }])).toEqual({ min: 1382, max: 1382, avg: 1382 });
    expect(yearStats([])).toBeNull();
  });
});

describe("detailLine — 오늘 환율 옆 한 줄 (90일 백분위 · 기준일 · 출처)", () => {
  const base = { windowDays: 90, date: "2026-11-13", source: "koreaexim" as const };

  it("쌈 · 보통 · 비쌈 — 기존 신호 문장 + 기준일 + 출처", () => {
    expect(detailLine({ ...base, signal: "cheap", percentile: 0.12 })).toBe("최근 90일 중 88%의 날보다 낮음 · 2026-11-13 한국수출입은행");
    expect(detailLine({ ...base, signal: "expensive", percentile: 0.9 })).toBe("최근 90일 중 90%의 날보다 높음 · 2026-11-13 한국수출입은행");
    expect(detailLine({ ...base, signal: "normal", percentile: 0.5 })).toBe("최근 90일 중간 수준 · 2026-11-13 한국수출입은행");
  });

  it("예비 출처(Frankfurter)면 그 사실을 씀", () => {
    expect(detailLine({ ...base, signal: "cheap", percentile: 0.2, source: "frankfurter" })).toBe("최근 90일 중 80%의 날보다 낮음 · 2026-11-13 Frankfurter (예비)");
  });

  it("신호가 없으면 '신호를 내지 않았습니다' 문장 (숫자를 만들지 않음)", () => {
    expect(detailLine({ ...base, signal: null, percentile: null })).toBe("최근 90일 자료가 모자라 신호를 내지 않았습니다 · 2026-11-13 한국수출입은행");
  });
});

describe("extremeDays — 그래프에 찍을 최고 · 최저 날 (작업 0175)", () => {
  const days = [
    { date: "2026-01-02", baseRate: 1400 },
    { date: "2026-02-03", baseRate: 1554.4 },
    { date: "2026-03-04", baseRate: 1322.6 },
    { date: "2026-04-05", baseRate: 1450 },
  ];

  it("최고 · 최저의 날짜와 값", () => {
    expect(extremeDays(days)).toEqual({ max: { date: "2026-02-03", baseRate: 1554.4 }, min: { date: "2026-03-04", baseRate: 1322.6 } });
  });

  it("들어온 순서가 섞여도 같음 · 같은 값이면 앞선 날짜", () => {
    expect(extremeDays([...days].reverse())).toEqual(extremeDays(days));
    expect(extremeDays([{ date: "2026-05-02", baseRate: 1500 }, { date: "2026-05-01", baseRate: 1500 }, { date: "2026-05-03", baseRate: 1400 }])).toEqual({ max: { date: "2026-05-01", baseRate: 1500 }, min: { date: "2026-05-03", baseRate: 1400 } });
  });

  it("하루뿐이면 최고 = 최저 = 그날 · 없으면 null", () => {
    expect(extremeDays([{ date: "2026-05-01", baseRate: 1382 }])).toEqual({ max: { date: "2026-05-01", baseRate: 1382 }, min: { date: "2026-05-01", baseRate: 1382 } });
    expect(extremeDays([])).toBeNull();
  });

  it("카드(yearStats)와 같은 값 — 최고 · 최저 (C4)", () => {
    const e = extremeDays(days);
    const y = yearStats(days);
    expect(e?.max.baseRate).toBe(y?.max);
    expect(e?.min.baseRate).toBe(y?.min);
  });

  it("기간을 바꾸면 그 기간의 최고 · 최저 (C2) — 1년 최고는 7개월 전 · 1개월 안에서는 다른 값", () => {
    // 2025-11-15 부터 하루씩 365일 — 7개월쯤 전에 최고(1600) · 최근 한 달(30일 창)은 1300 ~ 1340 사이
    const start = Date.parse("2025-11-15T00:00:00Z");
    const year = Array.from({ length: 366 }, (_, i) => {
      const date = new Date(start + i * 86400_000).toISOString().slice(0, 10);
      const baseRate = i === 200 ? 1600 : i === 5 ? 1250 : i >= 330 ? 1300 + (i % 5) * 10 : 1400;
      return { date, baseRate };
    });
    const byId = (id: string) => extremeDays(sliceDays(year, PERIODS.find((p) => p.id === id)?.days ?? 0));
    expect(byId("1y")?.max.baseRate).toBe(1600);
    expect(byId("1y")?.min.baseRate).toBe(1250);
    expect(byId("1m")?.max.baseRate).toBe(1340);
    expect(byId("1m")?.min.baseRate).toBe(1300);
    expect(byId("3m")?.max.baseRate).toBeLessThan(1600); // 3개월 창에는 7개월 전 최고가 없음
  });
});

describe("extremeLabelText — 그래프 라벨 글 (작업 0175)", () => {
  it("'최고 1,554.4원' · '최저 1,322.6원' (실제 자료의 값)", () => {
    expect(extremeLabelText("max", { baseRate: 1554.4, unit: 1 })).toBe("최고 1,554.4원");
    expect(extremeLabelText("min", { baseRate: 1322.6, unit: 1 })).toBe("최저 1,322.6원");
  });

  it("100 단위 통화는 단위를 같이 · 100 미만 값은 소수 둘째 자리까지", () => {
    expect(extremeLabelText("max", { baseRate: 912.34, unit: 100 })).toBe("최고 912.34원 / 100");
    expect(extremeLabelText("min", { baseRate: 39.84, unit: 1 })).toBe("최저 39.84원");
  });
});

// 작업 0212 — 1년 최저 · 최고 · 평균 카드는 같은 자릿수 (표시만 · 계산 값은 그대로)
import { cardRateText } from "./detail-view";

describe("cardRateText — 세 카드 같은 자릿수 (작업 0212)", () => {
  it("100원 이상 통화는 소수 첫째 자리 · 평균도 최저 · 최고와 같게", () => {
    const rate = { baseRate: 1335, unit: 1 };
    expect([1322.6, 1554.4, 1447.63].map((v) => cardRateText(v, rate))).toEqual(["1,322.6원", "1,554.4원", "1,447.6원"]);
  });
  it("100원 미만 통화는 소수 둘째 자리 · 단위가 있으면 '원 / 100'", () => {
    expect([39.6, 41, 40.123].map((v) => cardRateText(v, { baseRate: 40, unit: 1 }))).toEqual(["39.60원", "41.00원", "40.12원"]);
    expect(cardRateText(912.34, { baseRate: 890, unit: 100 })).toBe("912.3원 / 100");
  });
  it("계산 값은 바꾸지 않음 — yearStats 평균은 반올림 안 된 그대로", () => {
    expect(yearStats([{ baseRate: 1000 }, { baseRate: 1001.25 }])?.avg).toBe(1000.625);
  });
});
