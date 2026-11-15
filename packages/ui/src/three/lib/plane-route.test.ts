// 작업 0169 — 그래프 선을 따라 나는 3D 비행기의 경로 계산 (순수 · 테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   비행기 생김새(plane.glb · 조명 · 크기)는 lib/plane.ts · objects/plane.tsx 그대로 — 여기는 "어디에 어느 방향으로" 만
//
// builder 가 만들 것 — packages/ui/src/three/lib/plane-route.ts
//   export type RoutePoint = { x: number; y: number }                 // 그래프 선의 점들 (1월 → 12월 · 3D 장면 좌표 · y 위쪽)
//   export function routePosition(points: RoutePoint[], progress: number): { x: number; y: number; angle: number } | null
//     - progress 0 ~ 1 은 선 전체 길이(점 사이 직선 길이의 합) 기준 진행률 · 범위 밖은 0 ~ 1 로 자름 · NaN 은 0
//     - angle = 지금 있는 구간의 진행 방향 Math.atan2(dy, dx) (라디안) · 구간 경계(정확히 점 위)에서는 앞으로 갈 구간 · progress 1 은 마지막 구간
//     - 길이가 0 인 구간(같은 점이 겹침)은 건너뜀 · NaN 을 돌려주지 않음 · 점이 없으면 null · 점이 하나면 { x, y, angle: 0 }
//   export function progressAt(points: RoutePoint[], index: number): number | null
//     - index 번째 점이 선 위 어디쯤인지 진행률 (0 ~ 1 · 길이 기준) · 범위 밖 index 는 null · 점이 하나면 0
//   export const ROUTE_SECONDS = 14                                   // 1월 → 12월 한 번 나는 데 걸리는 시간 (초 · 기본값)
//   export function routeProgress(t: number, animate: boolean, stopProgress: number, seconds = ROUTE_SECONDS): number
//     - animate=false(움직임 줄이기) 면 t 와 상관없이 항상 stopProgress (가장 싼 달 점에 멈춤) · 0 ~ 1 로 자름
//     - animate=true 면 (t / seconds) 를 1 로 나눈 나머지(반복 이동 · 0 이상 1 미만) · t 가 음수 · NaN · Infinity 면 0
//   objects/plane-route.tsx (소스 검사): 같은 모델 · 조명 값(lib/plane 의 fitModel · PLANE_LIGHTS … 또는 objects/plane)을 씀 · Stage 안 · routePosition · routeProgress 사용 · url · points prop
//   scene/lazy.tsx: PlaneRouteLazy 추가 (늦게 불러오기 유지)
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { ROUTE_SECONDS, progressAt, routePosition, routeProgress } from "./plane-route";

const L = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }]; // 길이 1 + 1 = 2

describe("routePosition — 선 위 위치 · 진행 방향", () => {
  it("시작 · 끝 점", () => {
    expect(routePosition(L, 0)).toEqual({ x: 0, y: 0, angle: 0 });
    const end = routePosition(L, 1);
    expect(end).toMatchObject({ x: 1, y: 1 });
    expect(end?.angle).toBeCloseTo(Math.PI / 2, 9);
  });

  it("점 사이는 길이 비율로 — 0.25 → (0.5, 0) 오른쪽 · 0.75 → (1, 0.5) 위쪽", () => {
    const a = routePosition(L, 0.25);
    expect(a?.x).toBeCloseTo(0.5, 9);
    expect(a?.y).toBeCloseTo(0, 9);
    expect(a?.angle).toBeCloseTo(0, 9);
    const b = routePosition(L, 0.75);
    expect(b?.x).toBeCloseTo(1, 9);
    expect(b?.y).toBeCloseTo(0.5, 9);
    expect(b?.angle).toBeCloseTo(Math.PI / 2, 9);
  });

  it("구간 경계(점 위)에서는 앞으로 갈 구간의 방향", () => {
    const m = routePosition(L, 0.5);
    expect(m?.x).toBeCloseTo(1, 9);
    expect(m?.y).toBeCloseTo(0, 9);
    expect(m?.angle).toBeCloseTo(Math.PI / 2, 9);
  });

  it("길이가 다른 구간은 길이 비율 — (0,0)→(3,0)→(3,1): 0.75 는 첫 구간 끝", () => {
    const p = routePosition([{ x: 0, y: 0 }, { x: 3, y: 0 }, { x: 3, y: 1 }], 0.5);
    expect(p?.x).toBeCloseTo(2, 9); // 전체 4 의 절반 = 2
    expect(p?.y).toBeCloseTo(0, 9);
  });

  it("내려가는 구간은 음수 각도", () => {
    expect(routePosition([{ x: 0, y: 1 }, { x: 1, y: 0 }], 0.5)?.angle).toBeCloseTo(-Math.PI / 4, 9);
  });

  it("범위 밖은 0 ~ 1 로 자름 · NaN 은 0", () => {
    expect(routePosition(L, -3)).toEqual(routePosition(L, 0));
    expect(routePosition(L, 7)).toEqual(routePosition(L, 1));
    expect(routePosition(L, Number.NaN)).toEqual(routePosition(L, 0));
  });

  it("겹친 점(길이 0 구간)을 건너뛰고 NaN 을 만들지 않음", () => {
    const p = routePosition([{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 2, y: 0 }], 0.5);
    expect(p?.x).toBeCloseTo(1, 9);
    for (const n of [p?.x, p?.y, p?.angle]) expect(Number.isFinite(n)).toBe(true);
  });

  it("점이 없으면 null · 하나면 그 점", () => {
    expect(routePosition([], 0.5)).toBeNull();
    expect(routePosition([{ x: 2, y: 3 }], 0.5)).toEqual({ x: 2, y: 3, angle: 0 });
  });
});

describe("progressAt — 점이 선 위 어디쯤", () => {
  it("시작 0 · 끝 1 · 가운데 점은 길이 비율", () => {
    expect(progressAt(L, 0)).toBe(0);
    expect(progressAt(L, 2)).toBe(1);
    expect(progressAt(L, 1)).toBeCloseTo(0.5, 9);
    expect(progressAt([{ x: 0, y: 0 }, { x: 3, y: 0 }, { x: 3, y: 1 }], 1)).toBeCloseTo(0.75, 9);
  });

  it("범위 밖 index 는 null · 점이 하나면 0", () => {
    expect(progressAt(L, -1)).toBeNull();
    expect(progressAt(L, 3)).toBeNull();
    expect(progressAt([], 0)).toBeNull();
    expect(progressAt([{ x: 0, y: 0 }], 0)).toBe(0);
  });

  it("progressAt 으로 구한 진행률의 위치 = 그 점", () => {
    const pr = progressAt(L, 1) ?? Number.NaN;
    expect(routePosition(L, pr)).toMatchObject({ x: 1, y: 0 });
  });
});

describe("routeProgress — 시간 → 진행률 · 움직임 줄이기면 멈춤", () => {
  it("animate=false 면 시간이 지나도 stopProgress (가장 싼 달 점에 멈춤)", () => {
    for (const t of [0, 0.5, 7, 100, 1e6]) expect(routeProgress(t, false, 0.4), String(t)).toBe(0.4);
  });

  it("stopProgress 는 0 ~ 1 로 자름", () => {
    expect(routeProgress(3, false, -1)).toBe(0);
    expect(routeProgress(3, false, 5)).toBe(1);
  });

  it("animate=true 면 시간에 따라 0 → 1 반복 (기본 ROUTE_SECONDS)", () => {
    expect(routeProgress(0, true, 0.4)).toBe(0);
    expect(routeProgress(ROUTE_SECONDS / 2, true, 0.4)).toBeCloseTo(0.5, 9);
    expect(routeProgress(ROUTE_SECONDS, true, 0.4)).toBe(0); // 한 바퀴 돌고 처음으로
    expect(routeProgress(ROUTE_SECONDS * 2.25, true, 0.4)).toBeCloseTo(0.25, 9);
  });

  it("걸리는 시간을 따로 줄 수 있음", () => {
    expect(routeProgress(5, true, 0, 10)).toBeCloseTo(0.5, 9);
  });

  it("항상 0 이상 1 미만 · t 가 음수 · NaN · Infinity 여도 0", () => {
    for (const t of [-5, Number.NaN, Infinity, -Infinity]) expect(routeProgress(t, true, 0.4), String(t)).toBe(0);
    for (let t = 0; t < 200; t += 3.7) {
      const p = routeProgress(t, true, 0.4);
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThan(1);
    }
  });
});

describe("objects/plane-route.tsx · lazy.tsx — 소스 검사", () => {
  const THREE = fileURLToPath(new URL("..", import.meta.url));
  const read = (p: string) => readFileSync(join(THREE, p), "utf8");
  const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

  it("plane-route.tsx: 경로 계산 · 정지 규칙을 쓰고 Stage 안에서 · url · points prop", () => {
    const src = code(read("objects/plane-route.tsx"));
    expect(src).toMatch(/routePosition/);
    expect(src).toMatch(/routeProgress/);
    expect(src).toMatch(/\bStage\b/);
    expect(src).toMatch(/\burl\s*:\s*string/);
    expect(src).toMatch(/\bpoints\b/);
  });

  it("plane-route.tsx: 비행기 모델 · 조명 값은 그대로 가져다 씀 (lib/plane 또는 objects/plane) · 도형으로 새로 만들지 않음", () => {
    const src = code(read("objects/plane-route.tsx"));
    expect(src).toMatch(/from\s*"(\.\.\/lib\/plane|\.\/plane)"/);
    expect(src).not.toMatch(/<(box|cylinder|cone|sphere)Geometry/);
    expect(src).not.toMatch(/PLANE_PARTS/);
  });

  it("lazy.tsx 에 PlaneRouteLazy (늦게 불러오기)", () => {
    expect(read("scene/lazy.tsx")).toMatch(/PlaneRouteLazy\s*=\s*lazyNear/);
  });
});
