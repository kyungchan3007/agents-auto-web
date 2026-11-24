// 작업 0347 — 홈 첫 화면 안내 9-C 의 문구 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
// 요구(request.md): "11월에 떠나세요" 설명 문장 아래 안내 문장 + "가입 없이 무료" 작은 줄 · 문장은 "어디로 가세요? 아래 칸에 도시나 나라를 넣으면 환율 · 물가 · 떠나기 좋은 때를 한 번에 보여 드립니다"(시안의 "항공권"은 8개 도시에만 맞아 바꿈)
//
// builder 가 만들 것 — apps/web/src/features/home/timing/hero-guide.ts
//   export const HERO_GUIDE = { lead: string; free: string }     // lead = 안내 문장 · free = 작은 줄
// apps/web/src/shared/trip/trip-copy.ts — export const TRIP_SEARCH_PLACEHOLDER (카드 검색 칸 자리표시 글 · 테스트는 trip-copy.test.ts)
import { describe, expect, it } from "vitest";
import { HERO_GUIDE } from "./hero-guide";

describe("홈 첫 화면 안내 문구", () => {
  it("안내 문장 — 사용자가 정한 글 그대로", () => {
    expect(HERO_GUIDE.lead).toBe("어디로 가세요? 아래 칸에 도시나 나라를 넣으면 환율 · 물가 · 떠나기 좋은 때를 한 번에 보여 드립니다");
  });

  it("'항공권' 은 쓰지 않음 — 8개 도시에만 맞는 약속이라 바꿈", () => {
    expect(HERO_GUIDE.lead).not.toContain("항공권");
  });

  it("작은 줄 — '가입 없이 무료' 와 아래 화살표", () => {
    expect(HERO_GUIDE.free).toBe("가입 없이 무료 · ↓");
  });

  it("긴 줄표(—)를 쓰지 않음 (사이트 글쓰기 규칙: 쉼표 · 가운뎃점)", () => {
    expect(HERO_GUIDE.lead + HERO_GUIDE.free).not.toMatch(/[—–]/);
  });
});
