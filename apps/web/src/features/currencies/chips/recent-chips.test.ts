// 작업 0231 — 고른 통화 칩 계산 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   사용자 원문: "칩들은 내가 선택한 나라들을 칩으로 추가를 하자 최대 5개를 보여주고 5개가 넘어가면 더보기가 생겨서 … 박스안에는 최대 5개 까지 보여주고 만약 5개 이상이면 페이지 네이션으로"
//
// builder 가 만들 것 — apps/web/src/features/currencies/chips/recent-chips.ts
//   export const RECENT_KEY = "flapfx:recent-currencies"     // 브라우저 저장 키(즐겨찾기 "flapfx:favorites" 와 같은 방식 · 새 키)
//   export const CHIP_MAX = 5 · BOX_PAGE = 5 · RECENT_CAP = 30
//   parseRecent(raw: string | null): string[]                 // 저장된 글 → 코드 목록 · 모양이 틀리면 [] · 대문자 세 글자 코드만 · 중복 · 이상한 값은 버림 · RECENT_CAP 까지만
//   pushRecent(list: string[], code: string): string[]        // 고른 통화를 맨 앞에 · 이미 있으면 그 자리에서 빼 맨 앞으로 · RECENT_CAP 넘으면 오래된(뒤) 것부터 빠짐 · 코드가 이상하면 그대로
//   chipRow(stored: string[], current: string, available: string[]): string[]
//     // 칩 줄에 놓일 전체 순서 — 저장된 게 없으면 지금 운영 그대로(lib/redesign.ts chipCodes: 받은 통화 중 JPY · USD · EUR · THB + 지금 통화가 넷에 없으면 맨 앞) · 있으면 저장 순서에서 받은 통화(available)만
//   visibleChips(list: string[], max = CHIP_MAX): { shown: string[]; hidden: string[]; more: number }   // 줄에 보이는 처음 max 개 · 나머지 · 나머지 수
//   moreLabel(n: number): string                              // `더보기 +${n}`
//   boxPage(list: string[], page: number, size = BOX_PAGE): { items: string[]; page: number; pages: number; label: string }
//     // 상자 한 쪽 — page 는 0부터 · 범위 밖은 자름 · pages = max(1, ceil(길이 / size)) · label `${page + 1} / ${pages}`
import { describe, expect, it } from "vitest";
import { BOX_PAGE, CHIP_MAX, RECENT_CAP, RECENT_KEY, boxPage, chipRow, moreLabel, parseRecent, pushRecent, visibleChips } from "./recent-chips";

describe("상수", () => {
  it("키 · 5개 · 한 쪽 5개 · 최대 30개", () => {
    expect(RECENT_KEY).toBe("flapfx:recent-currencies");
    expect([CHIP_MAX, BOX_PAGE, RECENT_CAP]).toEqual([5, 5, 30]);
  });
});

describe("parseRecent — 저장된 글 읽기", () => {
  it("정상 · 틀린 모양 · 이상한 값 · 중복", () => {
    expect(parseRecent('["GBP","JPY","USD"]')).toEqual(["GBP", "JPY", "USD"]);
    expect(parseRecent('["GBP","gbp","GBP",3,"EURO","JPY"]')).toEqual(["GBP", "JPY"]);
    expect(parseRecent("{")).toEqual([]);
    expect(parseRecent('{"a":1}')).toEqual([]);
    expect(parseRecent(null)).toEqual([]);
  });
  it("최대 30개까지만", () => {
    const many = Array.from({ length: 40 }, (_, i) => `A${String.fromCharCode(65 + (i % 26))}${String.fromCharCode(65 + Math.floor(i / 26))}`);
    expect(parseRecent(JSON.stringify(many))).toHaveLength(RECENT_CAP);
  });
});

describe("pushRecent — 맨 앞에 붙임", () => {
  const base = ["JPY", "USD", "EUR", "THB"];
  it("새 통화는 맨 앞 · 나머지는 한 칸씩 뒤로", () => {
    expect(pushRecent(base, "GBP")).toEqual(["GBP", "JPY", "USD", "EUR", "THB"]);
  });
  it("이미 있으면 맨 앞으로 옮김(중복 없음)", () => {
    expect(pushRecent(base, "EUR")).toEqual(["EUR", "JPY", "USD", "THB"]);
    expect(pushRecent(base, "JPY")).toEqual(base);
  });
  it("30개를 넘으면 가장 오래된 것부터 빠짐", () => {
    const full = Array.from({ length: RECENT_CAP }, (_, i) => `A${String.fromCharCode(65 + (i % 26))}${String.fromCharCode(65 + Math.floor(i / 26))}`);
    const out = pushRecent(full, "ZZZ");
    expect(out).toHaveLength(RECENT_CAP);
    expect(out[0]).toBe("ZZZ");
    expect(out).not.toContain(full[RECENT_CAP - 1]);
  });
  it("원래 목록은 바꾸지 않음", () => {
    const copy = [...base];
    pushRecent(base, "GBP");
    expect(base).toEqual(copy);
  });
});

describe("chipRow — 줄에 놓일 전체 순서", () => {
  const all = ["USD", "JPY", "EUR", "THB", "GBP", "SGD", "AUD"];
  it("저장된 게 없으면 지금 운영 그대로 — 네 통화 순서 JPY · USD · EUR · THB", () => {
    expect(chipRow([], "JPY", all)).toEqual(["JPY", "USD", "EUR", "THB"]);
  });
  it("저장된 게 없고 지금 통화가 넷 밖이면 맨 앞(운영 그대로)", () => {
    expect(chipRow([], "GBP", all)).toEqual(["GBP", "JPY", "USD", "EUR", "THB"]);
  });
  it("받지 않은 통화는 줄에서 뺌(운영 그대로: 있는 것만)", () => {
    expect(chipRow([], "JPY", ["USD", "JPY"])).toEqual(["JPY", "USD"]);
  });
  it("저장된 게 있으면 저장 순서(받은 통화만)", () => {
    expect(chipRow(["SGD", "GBP", "XXX", "JPY"], "SGD", all)).toEqual(["SGD", "GBP", "JPY"]);
  });
});

describe("visibleChips — 줄에는 5개까지 + 더보기 +N", () => {
  it("5개 이하는 더보기 없음", () => {
    expect(visibleChips(["A", "B", "C", "D"])).toEqual({ shown: ["A", "B", "C", "D"], hidden: [], more: 0 });
    expect(visibleChips(["A", "B", "C", "D", "E"]).more).toBe(0);
  });
  it("6개부터 더보기 +N — 나머지가 가려짐", () => {
    const l = ["A", "B", "C", "D", "E", "F", "G"];
    expect(visibleChips(l)).toEqual({ shown: ["A", "B", "C", "D", "E"], hidden: ["F", "G"], more: 2 });
  });
  it("max 를 바꿀 수 있음", () => {
    expect(visibleChips(["A", "B", "C"], 2)).toEqual({ shown: ["A", "B"], hidden: ["C"], more: 1 });
  });
});

describe("moreLabel", () => {
  it("'더보기 +N'", () => {
    expect(moreLabel(1)).toBe("더보기 +1");
    expect(moreLabel(12)).toBe("더보기 +12");
  });
});

describe("boxPage — 상자 한 쪽 5개 · ‹ 1 / 2 ›", () => {
  const l = Array.from({ length: 12 }, (_, i) => `C${i}`);
  it("쪽마다 5개 · 마지막 쪽은 나머지", () => {
    expect(boxPage(l, 0)).toEqual({ items: ["C0", "C1", "C2", "C3", "C4"], page: 0, pages: 3, label: "1 / 3" });
    expect(boxPage(l, 1).items).toEqual(["C5", "C6", "C7", "C8", "C9"]);
    expect(boxPage(l, 2)).toEqual({ items: ["C10", "C11"], page: 2, pages: 3, label: "3 / 3" });
  });
  it("범위 밖은 자름 · 6개면 두 쪽 · 비어 있으면 1 쪽", () => {
    expect(boxPage(l, 9).page).toBe(2);
    expect(boxPage(l, -3).page).toBe(0);
    expect(boxPage(["A", "B", "C", "D", "E", "F"], 0).pages).toBe(2);
    expect(boxPage([], 0)).toEqual({ items: [], page: 0, pages: 1, label: "1 / 1" });
  });
});
