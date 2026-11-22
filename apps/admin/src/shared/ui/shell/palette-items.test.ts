// 찾기 창 거르기 · 순위 · 고른 줄 (작업 0312 — admin-shell.tsx 에 있던 계산을 순수 함수로)
import { describe, expect, it } from "vitest";
import { clampSel, findKeyLabel, rankItems, stepSel } from "./palette-items";

const items = [
  { group: "화면", label: "작업실" },
  { group: "규칙", label: "보호 파일은 사람 승인" },
  { group: "궁금한 것", label: "관세는 어떻게 계산하나요" },
];

describe("찾기 창", () => {
  it("찾는 글이 없으면 전부 · 원래 순서", () => {
    expect(rankItems(items, "").map((x) => x.it.label)).toEqual(items.map((x) => x.label));
  });
  it("초성으로 찾음 · 묶음 이름으로도 찾음", () => {
    expect(rankItems(items, "ㄱㅅ").map((x) => x.it.label)).toContain("관세는 어떻게 계산하나요");
    expect(rankItems(items, "규칙").map((x) => x.it.label)).toEqual(["보호 파일은 사람 승인"]);
  });
  it("고른 줄 · 화살표 · 단축키 표시", () => {
    expect(clampSel(5, 2)).toBe(1);
    expect(clampSel(0, 0)).toBe(0);
    expect(stepSel(1, 2, true)).toBe(0);
    expect(stepSel(0, 2, false)).toBe(1);
    expect(findKeyLabel("MacIntel")).toBe("⌘K");
    expect(findKeyLabel("Win32")).toBe("Ctrl K");
  });
});
