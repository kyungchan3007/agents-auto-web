// 어드민 찾기 (작업 0303 · ADD-02) — 낱자 · 초성 · 띄어쓰기 무시 · 찾은 자리
import { describe, expect, it } from "vitest";
import { choOf, match, pieces } from "./match";

describe("어드민 찾기 (작업 0303)", () => {
  it("초성 — 한글 음절은 초성 · 그 밖은 그대로", () => {
    expect(choOf("관")).toBe("ㄱ");
    expect(choOf("세")).toBe("ㅅ");
    expect(choOf("A")).toBe("A");
  });

  it("낱자 그대로 찾으면 그 자리 · 앞에서 찾으면 점수가 더 큼", () => {
    expect(match("관세청 과세환율", "관세")).toEqual({ hits: [0, 1], score: 4 });
    expect(match("해외직구 관세 계산기", "관세")).toEqual({ hits: [5, 6], score: 3 });
  });

  it("초성으로 찾음 · 낱자보다 점수가 작음", () => {
    expect(match("관세청 과세환율", "ㄱㅅ")).toEqual({ hits: [0, 1], score: 3 });
    expect(match("구글 검색 노출", "ㄱㅅ")?.hits).toEqual([3, 4]);
  });

  it("띄어쓰기 · 대소문자 무시 · 못 찾으면 null · 빈 검색은 모두", () => {
    expect(match("CI gate", "ci g")?.hits).toEqual([0, 1, 3]);
    expect(match("작업실", "GEO")).toBeNull();
    expect(match("작업실", " ")).toEqual({ hits: [], score: 0 });
  });

  it("조각 — 찾은 글자만 묶음", () => {
    expect(pieces("관세청", [0, 1])).toEqual([
      ["관세", true],
      ["청", false],
    ]);
  });
});
