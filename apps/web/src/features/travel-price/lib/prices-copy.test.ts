// 작업 0170 — /prices(여행 물가) 큰 문장 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
// Figma 04 · SR-PRC-01 — 큰 문장: 물가가 가장 낮은 나라 + 세계은행 자료 연도
//
// builder 가 만들 것 — apps/web/src/features/travel-price/lib/prices-copy.ts
//   pricesHeadline(rows: { name: string; relative: number /* 한국 = 1 */; year: number }[]): { title: string; note: string } | null
//     - 물가(relative)가 가장 낮은 나라 · 같으면 앞선 나라
//     - relative < 1: title `${name}${은/는} 한국보다 물가가 ${Math.round((1 - relative) * 100)}% 낮습니다` (받침 있으면 "은" · 없으면 "는") · note `세계은행 ${year}년 자료`
//     - 가장 낮은 나라도 relative ≥ 1 이면 title "한국보다 물가가 낮은 나라가 없습니다" · note 는 같은 규칙
//     - 줄이 없으면 null (문장을 지어내지 않음 — 화면은 "자료 없음")
import { describe, expect, it } from "vitest";
import { pricesHeadline } from "./prices-copy";

describe("pricesHeadline", () => {
  const rows = [
    { name: "일본", relative: 0.92, year: 2025 },
    { name: "베트남", relative: 0.48, year: 2025 },
    { name: "태국", relative: 0.56, year: 2024 },
  ];

  it("물가가 가장 낮은 나라 + 세계은행 자료 연도", () => {
    expect(pricesHeadline(rows)).toEqual({ title: "베트남은 한국보다 물가가 52% 낮습니다", note: "세계은행 2025년 자료" });
  });

  it("받침이 없는 나라는 '는' — 프랑스", () => {
    expect(pricesHeadline([{ name: "프랑스", relative: 0.9, year: 2025 }])?.title).toBe("프랑스는 한국보다 물가가 10% 낮습니다");
  });

  it("그 나라의 자료 연도를 씀 (다른 나라 연도가 아니라)", () => {
    expect(pricesHeadline([{ name: "태국", relative: 0.56, year: 2024 }, { name: "일본", relative: 0.92, year: 2025 }])?.note).toBe("세계은행 2024년 자료");
  });

  it("모두 한국보다 비싸면 낮은 나라가 없다고", () => {
    expect(pricesHeadline([{ name: "미국", relative: 1.31, year: 2025 }, { name: "스위스", relative: 1.58, year: 2025 }])).toEqual({ title: "한국보다 물가가 낮은 나라가 없습니다", note: "세계은행 2025년 자료" });
  });

  it("줄이 없으면 null", () => {
    expect(pricesHeadline([])).toBeNull();
  });
});

// 작업 0209 — 안 고른 상태의 머리 사진은 큰 문장의 나라(가장 싼 나라)
import { lowestCountry } from "./prices-copy";

describe("lowestCountry — 큰 문장 속 나라 (작업 0209)", () => {
  const rows = [
    { country: "JPN", name: "일본", relative: 1.1, year: 2024 },
    { country: "IND", name: "인도", relative: 0.4, year: 2024 },
    { country: "THA", name: "태국", relative: 0.6, year: 2024 },
  ];
  it("pricesHeadline 과 같은 나라 — 한국(1)보다 낮은 가장 싼 나라", () => {
    expect(lowestCountry(rows)).toBe("IND");
    expect(pricesHeadline(rows)?.title).toContain("인도");
  });
  it("자료가 없거나 한국보다 낮은 나라가 없으면 null (지금 사진)", () => {
    expect(lowestCountry([])).toBeNull();
    expect(lowestCountry([{ country: "JPN", name: "일본", relative: 1.1, year: 2024 }])).toBeNull();
  });
});
