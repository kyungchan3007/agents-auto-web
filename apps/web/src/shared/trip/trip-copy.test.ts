// 작업 0347 — 카드 검색 칸 자리표시 글 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   builder 가 만들 것 — apps/web/src/shared/trip/trip-copy.ts: export const TRIP_SEARCH_PLACEHOLDER = "어디로 가세요? 도시 · 나라 (예: 도쿄, 베트남)"  (trip-switcher.tsx 가 씀)
import { describe, expect, it } from "vitest";
import { TRIP_SEARCH_PLACEHOLDER } from "./trip-copy";

describe("카드 검색 칸 자리표시 글", () => {
  it("사용자가 정한 글 그대로 — 도시 · 나라 · 예시 둘", () => {
    expect(TRIP_SEARCH_PLACEHOLDER).toBe("어디로 가세요? 도시 · 나라 (예: 도쿄, 베트남)");
  });
});
