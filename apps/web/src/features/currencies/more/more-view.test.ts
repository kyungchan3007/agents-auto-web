// 작업 0356 — 통화 상세 "다른 나라 통화 보기" 버튼의 글 · 국기 규칙 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
// 요구(request.md): 글 "다른 나라 통화 보기" / 아래 줄 "22개 통화 오늘 환율을 한눈에"(개수는 실제 목록 개수) ·
//   국기는 기본 목록 앞 네 통화, 사이드바에서 고르면 그 통화 하나만 · 아래 줄 "고른 통화 · 일본 엔 100 846.76원"
//
// builder 가 만들 것 — apps/web/src/features/currencies/more/more-view.ts (순수 함수 · tsx 는 그리기만)
//   export const MORE_TITLE = "다른 나라 통화 보기"
//   export const moreSubText = (count: number) => string                                   // "22개 통화 오늘 환율을 한눈에"
//   export const pickedSubText = (p: { name: string; unit: number; rate: string }) => string  // "고른 통화 · 일본 엔 100 846.76원" (rate 는 "846.76원" 처럼 원까지 든 글 · 단위는 1 이어도 그대로 씀)
//   export const DEFAULT_FLAGS = 4
//   export function buttonFlags(codes: string[], picked: string | null): string[]          // 고른 게 없으면 목록 앞 네 개 · 고르면 그 하나 · 목록이 네 개보다 적으면 있는 만큼 · 고른 코드가 목록에 없으면 기본(앞 네 개)
import { describe, expect, it } from "vitest";
import { DEFAULT_FLAGS, MORE_TITLE, buttonFlags, moreSubText, pickedSubText } from "./more-view";

describe("버튼 글 (작업 0356)", () => {
  it("제목 · 아래 줄 — 개수는 받은 숫자 그대로", () => {
    expect(MORE_TITLE).toBe("다른 나라 통화 보기");
    expect(moreSubText(22)).toBe("22개 통화 오늘 환율을 한눈에");
    expect(moreSubText(7)).toBe("7개 통화 오늘 환율을 한눈에");
  });

  it("고른 통화 줄 — 이름 · 고시 단위 · 환율 글", () => {
    expect(pickedSubText({ name: "일본 엔", unit: 100, rate: "846.76원" })).toBe("고른 통화 · 일본 엔 100 846.76원");
    expect(pickedSubText({ name: "미국 달러", unit: 1, rate: "1,324.3원" })).toBe("고른 통화 · 미국 달러 1 1,324.3원");
  });
});

describe("버튼 국기 (작업 0356)", () => {
  const codes = ["JPY", "USD", "EUR", "CNY", "GBP", "THB"];
  it("기본은 목록 앞 네 통화", () => {
    expect(DEFAULT_FLAGS).toBe(4);
    expect(buttonFlags(codes, null)).toEqual(["JPY", "USD", "EUR", "CNY"]);
  });
  it("고르면 그 통화 하나만 (목록 앞이 아니어도)", () => {
    expect(buttonFlags(codes, "THB")).toEqual(["THB"]);
    expect(buttonFlags(codes, "JPY")).toEqual(["JPY"]);
  });
  it("목록이 네 개보다 적으면 있는 만큼 · 없는 코드를 고르면 기본 · 빈 목록은 빈 배열 (지어내지 않음)", () => {
    expect(buttonFlags(["JPY", "USD"], null)).toEqual(["JPY", "USD"]);
    expect(buttonFlags(codes, "XXX")).toEqual(["JPY", "USD", "EUR", "CNY"]);
    expect(buttonFlags([], null)).toEqual([]);
  });
});
