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
//   detailLine(p: { signal: Signal | null; percentile: number | null; windowDays: number; date: string; source: "koreaexim" | "frankfurter" }): string
//     - `${percentileText(signal, percentile, windowDays)} · ${date} ${SOURCE_NAME[source]}` — percentileText · SOURCE_NAME 은 @hav/shared/currency 의 것 그대로 (신호가 없으면 percentileText 의 "자료가 모자라 신호를 내지 않았습니다" 문장)
import { describe, expect, it } from "vitest";
import { currencyListLabel, currencyListName, detailLine, yearStats } from "./detail-view";

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
