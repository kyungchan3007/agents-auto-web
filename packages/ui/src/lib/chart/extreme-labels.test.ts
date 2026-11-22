// 작업 0175 추가 요청 — 통화 그래프의 최고 · 최저 금액 라벨 위치 (순수 함수 · 테스트 먼저 · 구현 전에는 FAIL 이 정상)
// 사용자 "통화 페이지 그래프에 왜 금액이 안 나와 최고 금액이랑 최저 금액" · C3: 오늘 점 · 라벨끼리 겹치면 위아래로 비킴 · 휴대폰에서도 잘리지 않음
//
// builder 가 만들 것 — packages/ui/src/lib/chart/extreme-labels.ts
//   export type Pt = { x: number; y: number }
//   export type Box = { left: number; top: number; right: number; bottom: number }
//   export type Placed = { x: number; y: number; anchor: "start" | "middle" | "end"; box: Box }   // x = 글자 기준 가로 위치(anchor 에 따라 왼쪽 · 가운데 · 오른쪽) · y = 글자 칸 위쪽 · box = 글자 칸
//   export function placeExtremeLabels(a: {
//     max: Pt & { text: string }; min: Pt & { text: string }; today: Pt
//     bounds: Box                                        // 라벨이 들어가야 하는 영역 (그래프 칸 + 위아래 여백)
//     font?: { size: number; charWidth: number }          // 기본 { size: 13, charWidth: 7.5 } — 글자 칸: 높이 size · 폭 글자 수 × charWidth
//     dotRadius?: number                                  // 최고 · 최저 점 반지름 (기본 4)
//     todayRadius?: number                                // 오늘 점 반지름 (기본 6)
//     gap?: number                                        // 점과 글자 칸 사이 (기본 8)
//   }): { max: Placed; min: Placed }
//   규칙
//     1. 기본 — 최고는 점 위(box.bottom = 점.y − gap) · 최저는 점 아래(box.top = 점.y + gap) · 가로는 점 가운데
//     2. 칸이 bounds 를 벗어나면 안쪽으로 — 왼쪽 끝은 anchor "start"(box.left ≥ bounds.left) · 오른쪽 끝은 "end"(box.right ≤ bounds.right) · 위가 모자라면 점 아래로
//     3. 겹치면 비킴 — 두 라벨끼리 · 오늘 점(원) · 최고 · 최저 점(원)을 가리지 않음: 반대쪽(위 ↔ 아래)으로 · 그래도 겹치면 가로 붙임(start · end) · 그래도면 한 글자 높이씩 더 비킴
//     4. 최고 · 최저가 같은 점(값이 모두 같을 때)이어도 최고는 위 · 최저는 아래로 갈라짐
//   모든 경우에 두 칸이 bounds 안 · 서로 안 겹침 · 세 점(오늘 · 최고 · 최저)을 안 가림 (아래 임의 시나리오 검사)
import { describe, expect, it } from "vitest";
import { type Box, type Pt, placeExtremeLabels } from "./extreme-labels";

const BOUNDS: Box = { left: 0, top: 0, right: 600, bottom: 200 };
const FONT = { size: 13, charWidth: 7.5 };
const W = (text: string) => text.length * FONT.charWidth;
const MAX_TEXT = "최고 1,554.4원";
const MIN_TEXT = "최저 1,322.6원";

const args = (max: Pt, min: Pt, today: Pt, over: Partial<Parameters<typeof placeExtremeLabels>[0]> = {}) => ({ max: { ...max, text: MAX_TEXT }, min: { ...min, text: MIN_TEXT }, today, bounds: BOUNDS, ...over });

const overlap = (a: Box, b: Box) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
/** 원이 칸과 겹치는지 — 칸에서 원 중심까지 가장 가까운 거리 < 반지름 */
const hitsCircle = (box: Box, c: Pt, r: number) => {
  const dx = Math.max(box.left - c.x, 0, c.x - box.right);
  const dy = Math.max(box.top - c.y, 0, c.y - box.bottom);
  return dx * dx + dy * dy < r * r;
};
const inside = (box: Box, b: Box) => box.left >= b.left - 1e-9 && box.right <= b.right + 1e-9 && box.top >= b.top - 1e-9 && box.bottom <= b.bottom + 1e-9;

function invariants(r: ReturnType<typeof placeExtremeLabels>, max: Pt, min: Pt, today: Pt, why: string) {
  expect(inside(r.max.box, BOUNDS), `${why}: 최고 라벨이 영역 안`).toBe(true);
  expect(inside(r.min.box, BOUNDS), `${why}: 최저 라벨이 영역 안`).toBe(true);
  expect(overlap(r.max.box, r.min.box), `${why}: 두 라벨이 안 겹침`).toBe(false);
  for (const [name, box] of [["최고", r.max.box], ["최저", r.min.box]] as const) {
    expect(hitsCircle(box, today, 6), `${why}: ${name} 라벨이 오늘 점을 안 가림`).toBe(false);
    expect(hitsCircle(box, max, 4), `${why}: ${name} 라벨이 최고 점을 안 가림`).toBe(false);
    expect(hitsCircle(box, min, 4), `${why}: ${name} 라벨이 최저 점을 안 가림`).toBe(false);
  }
}

describe("기본 위치", () => {
  const max = { x: 300, y: 80 };
  const min = { x: 120, y: 120 };
  const today = { x: 560, y: 100 };
  const r = placeExtremeLabels(args(max, min, today));

  it("최고는 점 위 · 최저는 점 아래 · 가로는 점 가운데", () => {
    expect(r.max.box.bottom).toBeCloseTo(max.y - 8, 6);
    expect(r.min.box.top).toBeCloseTo(min.y + 8, 6);
    expect(r.max.anchor).toBe("middle");
    expect(r.min.anchor).toBe("middle");
    expect((r.max.box.left + r.max.box.right) / 2).toBeCloseTo(max.x, 6);
  });

  it("칸 크기 = 글자 수 × charWidth · 높이 = 글자 크기", () => {
    expect(r.max.box.right - r.max.box.left).toBeCloseTo(W(MAX_TEXT), 6);
    expect(r.max.box.bottom - r.max.box.top).toBeCloseTo(FONT.size, 6);
  });

  it("x · y 는 anchor 와 box 에 맞음 (y = 칸 위쪽 · x = 가운데 anchor 면 칸 가운데)", () => {
    expect(r.max.y).toBeCloseTo(r.max.box.top, 6);
    expect(r.max.x).toBeCloseTo((r.max.box.left + r.max.box.right) / 2, 6);
  });

  it("옵션을 주면 따름 — gap 12 · font 크기 · charWidth", () => {
    const r2 = placeExtremeLabels(args(max, min, today, { gap: 12, font: { size: 16, charWidth: 9 } }));
    expect(r2.max.box.bottom).toBeCloseTo(max.y - 12, 6);
    expect(r2.max.box.bottom - r2.max.box.top).toBeCloseTo(16, 6);
    expect(r2.max.box.right - r2.max.box.left).toBeCloseTo(MAX_TEXT.length * 9, 6);
  });
});

describe("화면 안으로 — 양 끝 · 위아래 (휴대폰에서도 잘리지 않음)", () => {
  it("왼쪽 끝 점 — anchor start · 칸이 왼쪽 경계 안", () => {
    const r = placeExtremeLabels(args({ x: 10, y: 80 }, { x: 300, y: 120 }, { x: 560, y: 100 }));
    expect(r.max.anchor).toBe("start");
    expect(r.max.box.left).toBeGreaterThanOrEqual(0);
    expect(r.max.box.left).toBeLessThanOrEqual(10); // 점 가까이
  });

  it("오른쪽 끝 점 — anchor end · 칸이 오른쪽 경계 안", () => {
    const r = placeExtremeLabels(args({ x: 300, y: 80 }, { x: 592, y: 120 }, { x: 100, y: 100 }));
    expect(r.min.anchor).toBe("end");
    expect(r.min.box.right).toBeLessThanOrEqual(600);
    expect(r.min.box.right).toBeGreaterThanOrEqual(592);
  });

  it("최고 점이 맨 위에 붙으면 위 칸이 영역 밖 → 점 아래로 (영역 안에 둠)", () => {
    const max = { x: 300, y: 6 };
    const r = placeExtremeLabels(args(max, { x: 100, y: 150 }, { x: 560, y: 100 }));
    expect(r.max.box.top).toBeGreaterThanOrEqual(max.y);
    expect(inside(r.max.box, BOUNDS)).toBe(true);
  });

  it("최저 점이 맨 아래에 붙으면 아래 칸이 영역 밖 → 점 위로", () => {
    const min = { x: 300, y: 196 };
    const r = placeExtremeLabels(args({ x: 100, y: 60 }, min, { x: 560, y: 100 }));
    expect(r.min.box.bottom).toBeLessThanOrEqual(min.y);
    expect(inside(r.min.box, BOUNDS)).toBe(true);
  });
});

describe("겹치면 비킴 (C3)", () => {
  it("오늘 점이 최고 라벨 자리에 있으면 라벨이 다른 쪽으로 — 오늘 점을 안 가림", () => {
    const max = { x: 300, y: 80 };
    const today = { x: 300, y: 62 }; // 기본 최고 라벨(위) 한가운데
    const min = { x: 100, y: 150 };
    const r = placeExtremeLabels(args(max, min, today));
    invariants(r, max, min, today, "오늘 점이 라벨 자리");
  });

  it("최고 · 최저가 가까워(같은 높이 · 옆자리) 라벨이 부딪히면 위아래로 갈라짐", () => {
    const max = { x: 300, y: 100 };
    const min = { x: 330, y: 100 };
    const today = { x: 560, y: 100 };
    invariants(placeExtremeLabels(args(max, min, today)), max, min, today, "붙은 최고 · 최저");
  });

  it("최고 · 최저가 같은 점(값이 모두 같음)이어도 최고는 위 · 최저는 아래로", () => {
    const p = { x: 300, y: 100 };
    const r = placeExtremeLabels(args(p, p, { x: 560, y: 100 }));
    expect(r.max.box.bottom).toBeLessThanOrEqual(p.y);
    expect(r.min.box.top).toBeGreaterThanOrEqual(p.y);
    expect(overlap(r.max.box, r.min.box)).toBe(false);
  });

  it("오늘 점이 최고 점과 같은 곳(오늘이 최고)이어도 가리지 않음", () => {
    const max = { x: 590, y: 20 };
    const min = { x: 200, y: 140 };
    invariants(placeExtremeLabels(args(max, min, max)), max, min, max, "오늘 = 최고");
  });
});

describe("임의 시나리오 600개 — 항상 영역 안 · 안 겹침 · 점을 안 가림", () => {
  /** 시드 고정 난수 (mulberry32) — 실패하면 같은 시나리오가 다시 나옴 */
  function rng(seed: number) {
    return () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  it("그래프 점 범위(가로 10~590 · 세로 10~150) 안의 임의 최고 · 최저 · 오늘", () => {
    const rand = rng(175);
    const pt = (): Pt => ({ x: 10 + rand() * 580, y: 10 + rand() * 140 });
    for (let i = 0; i < 600; i++) {
      const [max, min, today] = [pt(), pt(), pt()];
      const r = placeExtremeLabels(args(max, min, today));
      invariants(r, max, min, today, `시나리오 ${i} max=${JSON.stringify(max)} min=${JSON.stringify(min)} today=${JSON.stringify(today)}`);
    }
  });
});

// 작업 0211 — 3D 비행기처럼 피해야 할 칸(avoid)을 가리지 않음
describe("avoid — 피해야 할 칸 (작업 0211)", () => {
  const max: Pt & { text: string } = { x: 500, y: 40, text: "최고 158.6" };
  const min: Pt & { text: string } = { x: 200, y: 120, text: "2025-05 최저 · 지수 118.8" };
  const today: Pt = { x: 560, y: 80 };
  const hit = (a: Box, b: Box) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
  it("avoid 가 없으면 지금과 같음 — 최저 라벨은 점 아래 가운데", () => {
    const r = placeExtremeLabels({ max, min, today, bounds: BOUNDS });
    expect(r.min.anchor).toBe("middle");
  });
  it("비행기가 점 왼쪽에 서 있으면 최저 라벨이 그 칸을 피해 점에서 오른쪽으로 놓임", () => {
    const plane: Box = { left: 50, top: 85, right: 180, bottom: 150 };
    const r = placeExtremeLabels({ max, min, today, bounds: BOUNDS, avoid: [plane] });
    expect(hit(r.min.box, plane)).toBe(false);
    expect(hit(r.max.box, plane)).toBe(false);
    expect(r.min.box.left).toBeGreaterThanOrEqual(min.x - 1);
  });
});
