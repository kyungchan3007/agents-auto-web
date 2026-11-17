// 작업 0201 — 여행 물가 머리 문장: 고른 나라 기준 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//
// builder 가 만들 것 — apps/web/src/features/travel-price/lib/prices-copy.ts 에 더함
//   export function pickedHeadline(country: string | null | undefined, rows: { country: string; name: string; relative: number; year: number }[]): { title: string; note: string } | null
//     - 그 나라 줄이 있을 때만 · 없으면(안 골랐음 · 자료 없는 나라) null → 쓰는 쪽이 지금 문장(가장 싼 나라)
//     - relative < 0.9 → "{나라}{은|는} 한국보다 물가가 {N}% 낮습니다" · > 1.1 → "… {N}% 높습니다" (N = round(|1 − relative| × 100))
//     - 0.9 ~ 1.1 → "{나라}{은|는} 한국과 물가가 비슷합니다" (구간 3칸과 같은 기준 · BAND_EDGE)
//     - note = "세계은행 {year}년 자료"
import { describe, expect, it } from "vitest";
import { pickedHeadline } from "./prices-copy";

const rows = [
  { country: "IND", name: "인도", relative: 0.37, year: 2024 },
  { country: "JPN", name: "일본", relative: 1.12, year: 2024 },
  { country: "THA", name: "태국", relative: 0.62, year: 2023 },
  { country: "FRA", name: "프랑스", relative: 1.04, year: 2024 },
  { country: "USA", name: "미국", relative: 1.5, year: 2024 },
];

describe("pickedHeadline", () => {
  it("낮은 나라 — 인도는 한국보다 물가가 63% 낮습니다", () => {
    expect(pickedHeadline("IND", rows)).toEqual({ title: "인도는 한국보다 물가가 63% 낮습니다", note: "세계은행 2024년 자료" });
  });
  it("높은 나라 — 받침 있는 이름은 '은'", () => {
    expect(pickedHeadline("JPN", rows)?.title).toBe("일본은 한국보다 물가가 12% 높습니다");
    expect(pickedHeadline("USA", rows)?.title).toBe("미국은 한국보다 물가가 50% 높습니다");
  });
  it("받침 없는 이름은 '는' · 자료 연도가 note 로", () => {
    expect(pickedHeadline("THA", rows)).toEqual({ title: "태국은 한국보다 물가가 38% 낮습니다", note: "세계은행 2023년 자료" });
  });
  it("비슷한 나라(0.9 ~ 1.1)", () => {
    expect(pickedHeadline("FRA", rows)?.title).toBe("프랑스는 한국과 물가가 비슷합니다");
  });
  it("안 골랐거나 줄이 없는 나라 → null (지금 문장)", () => {
    expect(pickedHeadline(null, rows)).toBeNull();
    expect(pickedHeadline(undefined, rows)).toBeNull();
    expect(pickedHeadline("ARE", rows)).toBeNull();
    expect(pickedHeadline("IND", [])).toBeNull();
    expect(pickedHeadline("toString", rows)).toBeNull();
  });
});
