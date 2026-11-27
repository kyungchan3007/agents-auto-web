// 작업 0385 — hero 캐러셀 순수 계산 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//
// builder 가 만들 것: apps/web/src/features/home/carousel/carousel.ts (순수 .ts · React 를 가져오지 않음)
//   export type SlideId = "bf" | "sea"                         // bf = 블랙프라이데이 장 · sea = 여행 타이밍(기본 울트라마린) 장
//   export const SLIDES: readonly SlideId[]                    // ["bf", "sea"] — 처음 열리면 첫 장(bf)
//   export const SLIDE_MS: Record<SlideId, number>             // { bf: 9000, sea: 7000 } — 자동 넘김 장별 시간(ms)
//   export const SWIPE_MIN = 50                                // 옆으로 밀기 최소 거리(px)
//   export function slideMs(id: SlideId): number               // SLIDE_MS[id]
//   export function nextSlide(id: SlideId): SlideId            // 다음 장 · 마지막 다음은 처음으로
//   export function prevSlide(id: SlideId): SlideId            // 이전 장 · 처음 이전은 마지막으로
//   export function swipeDirection(dx: number): "next" | "prev" | null   // dx 는 (끝 x − 시작 x) · 왼쪽으로 밂(dx ≤ −50)=다음 · 오른쪽으로 밂(dx ≥ 50)=이전 · |dx| < 50 이면 null
//   export function remainingMs(id: SlideId, elapsedMs: number): number  // 장 시간에서 지나간 시간을 뺀 남은 시간 · 0 ~ 장 시간 사이로 자름(마우스 멈춤 뒤 남은 시간부터 이어가려고)
import { describe, expect, it } from "vitest";
import { SLIDES, SLIDE_MS, SWIPE_MIN, nextSlide, prevSlide, remainingMs, slideMs, swipeDirection } from "./carousel";

describe("장 순서 · 시간", () => {
  it("두 장 — 블프가 첫 장(처음 열리면 이 장) · 다음이 여행 타이밍", () => {
    expect(SLIDES).toEqual(["bf", "sea"]);
  });
  it("장 시간 — 블프 9초 · 기본 7초", () => {
    expect(SLIDE_MS).toEqual({ bf: 9000, sea: 7000 });
    expect(slideMs("bf")).toBe(9000);
    expect(slideMs("sea")).toBe(7000);
  });
});

describe("다음 · 이전", () => {
  it("다음 — bf → sea → bf (돌아감)", () => {
    expect(nextSlide("bf")).toBe("sea");
    expect(nextSlide("sea")).toBe("bf");
  });
  it("이전 — sea → bf → sea (돌아감)", () => {
    expect(prevSlide("sea")).toBe("bf");
    expect(prevSlide("bf")).toBe("sea");
  });
  it("다음 다음 = 제자리 · 다음 이전 = 제자리", () => {
    for (const id of SLIDES) {
      expect(nextSlide(nextSlide(id))).toBe(id);
      expect(prevSlide(nextSlide(id))).toBe(id);
    }
  });
});

describe("밀기 판정 — |dx| ≥ 50", () => {
  it("최소 거리는 50px", () => {
    expect(SWIPE_MIN).toBe(50);
  });
  it("왼쪽으로 50px 이상 밀면 다음 · 오른쪽으로 50px 이상이면 이전", () => {
    expect(swipeDirection(-50)).toBe("next");
    expect(swipeDirection(-120)).toBe("next");
    expect(swipeDirection(50)).toBe("prev");
    expect(swipeDirection(300)).toBe("prev");
  });
  it("50px 미만이면 넘기지 않음(null) · 0 도 null", () => {
    for (const dx of [0, 1, -1, 49, -49, 49.9, -49.9]) expect(swipeDirection(dx), String(dx)).toBeNull();
  });
});

describe("남은 시간 — 마우스 멈춤 뒤 이어가기", () => {
  it("지나간 시간이 없으면 장 시간 그대로", () => {
    expect(remainingMs("bf", 0)).toBe(9000);
    expect(remainingMs("sea", 0)).toBe(7000);
  });
  it("지나간 만큼 뺌", () => {
    expect(remainingMs("bf", 3000)).toBe(6000);
    expect(remainingMs("sea", 6500)).toBe(500);
  });
  it("다 지났거나 넘으면 0 · 음수 입력은 장 시간으로 자름", () => {
    expect(remainingMs("bf", 9000)).toBe(0);
    expect(remainingMs("sea", 99999)).toBe(0);
    expect(remainingMs("sea", -500)).toBe(7000);
  });
});
