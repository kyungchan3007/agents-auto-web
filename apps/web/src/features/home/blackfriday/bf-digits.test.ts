// 작업 0385 — 블프 입력칸 숫자만 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//
// builder 가 만들 것: apps/web/src/features/home/blackfriday/bf-digits.ts (순수 .ts · React 를 가져오지 않음)
//   export function digitsOnly(s: string): string   // 0-9(반각 숫자) 외 글자를 모두 버리고 남은 숫자만 · 문자 · 기호 · 한글 · 소수점 · 쉼표 · - · $ · 공백 모두 버림
//   use-bf-calc 의 onAmount 가 이 값을 상태(amount)로 정함 · 입력 칸은 inputMode="numeric" pattern="[0-9]*"
import { describe, expect, it } from "vitest";
import { digitsOnly } from "./bf-digits";

describe("digitsOnly — 작업서 예시", () => {
  it.each([
    ["12a3", "123"],
    ["$250", "250"],
    ["1,000", "1000"],
    ["가나12", "12"],
    ["ab99cd", "99"],
    ["1.5", "15"],
  ])("%j → %j", (input, want) => {
    expect(digitsOnly(input)).toBe(want);
  });
});

describe("digitsOnly — 그 밖", () => {
  it("숫자만 있으면 그대로 · 빈 글은 빈 글", () => {
    expect(digitsOnly("250")).toBe("250");
    expect(digitsOnly("")).toBe("");
  });
  it("숫자가 없으면 빈 글 (문자 · 기호 · 한글 · 공백)", () => {
    for (const s of ["abc", "가나다", "$,.-", "  ", "-", "."]) expect(digitsOnly(s), JSON.stringify(s)).toBe("");
  });
  it("음수 · 지수 표기 · 공백 섞임도 숫자만", () => {
    expect(digitsOnly("-20")).toBe("20");
    expect(digitsOnly("1e3")).toBe("13");
    expect(digitsOnly(" 1 2 3 ")).toBe("123");
  });
  it("전각 숫자 · 다른 문자 체계의 숫자는 막음 (반각 0-9 만)", () => {
    expect(digitsOnly("１２３")).toBe("");
    expect(digitsOnly("٣٤")).toBe("");
    expect(digitsOnly("1２3")).toBe("13");
  });
  it("이미 정리된 값을 다시 넣어도 같음", () => {
    expect(digitsOnly(digitsOnly("ab99cd"))).toBe("99");
  });
});
