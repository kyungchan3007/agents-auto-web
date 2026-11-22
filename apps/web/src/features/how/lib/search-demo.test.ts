// 만드는 방식 검색 예시 (작업 0306) — 실제 검색 함수 결과에 순위 글 · 나라 · 도시 글
import { describe, expect, it } from "vitest";
import { demoSearch } from "./search-demo";

describe("검색 예시 (작업 0306)", () => {
  it("코드 앞글자 — jp → JPY", () => {
    expect(demoSearch("jp")[0]).toMatchObject({ code: "JPY", rank: "코드 앞글자" });
  });
  it("이름 앞글자 — 엔 → 엔화", () => {
    expect(demoSearch("엔")[0]).toMatchObject({ code: "JPY", rank: "이름 앞글자" });
  });
  it("나라 · 도시 앞글자 — 베트 → VND(나라) · 다낭 → VND(도시 · 베트남 다낭)", () => {
    expect(demoSearch("베트")[0]).toMatchObject({ code: "VND", rank: "나라 앞글자" });
    expect(demoSearch("다낭")[0]).toMatchObject({ code: "VND", rank: "도시 앞글자", where: "베트남 다낭" });
  });
  it("가운데 일치 — 크푸 → EUR(독일 프랑크푸르트)", () => {
    expect(demoSearch("크푸")[0]).toMatchObject({ code: "EUR", rank: "가운데 일치", where: "독일 프랑크푸르트" });
  });
  it("없으면 빈 목록 · 최대 8줄", () => {
    expect(demoSearch("없는도시이름")).toEqual([]);
    expect(demoSearch("a").length).toBeLessThanOrEqual(8);
  });
});
