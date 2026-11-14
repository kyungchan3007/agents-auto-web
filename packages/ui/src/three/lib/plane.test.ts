// 작업 0164 — 3D 비행기 순수 로직 (glTF 모델 방식으로 설계 변경 · 2026-11-15 추가 요청)
//   objects/plane.tsx 는 모델 파일을 url prop 으로 받아 불러오고(drei useGLTF), 크기 · 조명 · 움직임 값은 이 순수 로직에서 가져옴
//   (그리는 코드는 기존 tower.ts · geo.ts 방식대로 테스트하지 않고, 아래 소스 검사로 경계만 확인)
//
// builder 가 만들 것 — packages/ui/src/three/lib/plane.ts
//   삭제: PLANE_PARTS · PlanePart (코드 도형 목록) — export 에서 사라져야 함
//   유지: planeMotion(t: number /* 초 */, animate: boolean): { position: [x,y,z]; rotation: [x,y,z] }
//     - animate=false(움직임 줄이기) 면 t 가 얼마든 항상 같은 값 (t=0 의 값) · animate=true 면 시간에 따라 변함
//     - 흔들림은 ±0.3 안 · 기울기 변화는 ±0.35rad 안 · 순수 함수 · t 가 아주 커도 유한
//   추가: export const PLANE_TARGET_SIZE = 1.6        // 모델의 가장 긴 변을 이 크기로 (시험판 tpl.html 과 같은 값)
//   추가: export type Box3Like = { min: [number, number, number]; max: [number, number, number] }
//   추가: export function fitModel(box: Box3Like, target = PLANE_TARGET_SIZE): { scale: number; offset: [number, number, number] }
//     - 모델 좌표 p 에 p * scale + offset 을 하면 상자의 가장 긴 변 = target 이고 상자 중심이 원점 (크기 맞추기 · 가운데 맞추기)
//     - 상자가 점 하나(크기 0) 거나 숫자가 유한하지 않으면 scale 1 · offset 은 유한한 값 (NaN · Infinity 를 돌려주지 않음)
//   추가: export const PLANE_LIGHTS: readonly { color: string /* #rrggbb */; position: [x,y,z]; intensity: number }[]
//     - 사이트 오로라 점광 3개 — 청록 · 보라 · 분홍 (색상 각도로 확인) · 위치는 유한 · 세기는 양수 (환경 조명은 three RoomEnvironment 로 plane.tsx 가 따로 둠)
//   objects/plane.tsx (소스 검사): PlaneProps 에 url: string · drei useGLTF 로 불러옴 · PLANE_PARTS 를 쓰지 않음 · 도형(boxGeometry 등)으로 기체를 만들지 않음
//   travel-price 쪽 상수(모델 주소 · 출처 문구)는 apps/web/src/features/travel-price/lib/plane-model.test.ts 에서 확인
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import * as planeLib from "./plane";
import { PLANE_LIGHTS, PLANE_TARGET_SIZE, fitModel, planeMotion } from "./plane";

describe("planeMotion — 움직임 줄이기면 멈춤", () => {
  it("animate=false → 시간이 지나도 같은 값 · t=0 의 값과 같음", () => {
    const still = planeMotion(0, false);
    for (const t of [0.5, 1, 3.7, 100, 1e6]) expect(planeMotion(t, false), String(t)).toEqual(still);
    expect(still.position).toEqual(planeMotion(0, false).position);
  });

  it("animate=true → 시간에 따라 변함", () => {
    const a = planeMotion(0, true);
    const moved = [0.5, 1, 1.7, 2.5].some((t) => JSON.stringify(planeMotion(t, true)) !== JSON.stringify(a));
    expect(moved).toBe(true);
  });

  it("움직일 때도 흔들림 · 기울기가 범위 안 (0 ~ 60초 구간 표본)", () => {
    const base = planeMotion(0, false);
    for (let t = 0; t <= 60; t += 0.37) {
      const m = planeMotion(t, true);
      expect(Math.abs(m.position[1] - base.position[1]), String(t)).toBeLessThanOrEqual(0.3 + 1e-9);
      m.rotation.forEach((r, i) => expect(Math.abs(r - base.rotation[i]), `${t} rot${i}`).toBeLessThanOrEqual(0.35 + 1e-9));
    }
  });

  it("순수 함수 · t 가 아주 커도 유한한 값", () => {
    expect(planeMotion(12.34, true)).toEqual(planeMotion(12.34, true));
    for (const t of [1e6, 1e9]) {
      const m = planeMotion(t, true);
      for (const n of [...m.position, ...m.rotation]) expect(Number.isFinite(n), String(t)).toBe(true);
    }
  });
});

describe("크기 · 가운데 맞추기 (fitModel)", () => {
  const apply = (p: [number, number, number], f: ReturnType<typeof fitModel>) => p.map((v, i) => v * f.scale + f.offset[i]);

  it("가장 긴 변이 목표 크기가 되고 중심이 원점", () => {
    const box = { min: [-10, 2, 4] as [number, number, number], max: [30, 12, 24] as [number, number, number] }; // 크기 40 × 10 × 20 · 중심 (10, 7, 14)
    const f = fitModel(box);
    expect(f.scale).toBeCloseTo(PLANE_TARGET_SIZE / 40, 9);
    const lo = apply(box.min, f);
    const hi = apply(box.max, f);
    expect(hi[0] - lo[0]).toBeCloseTo(PLANE_TARGET_SIZE, 9);
    for (let i = 0; i < 3; i++) expect((lo[i] + hi[i]) / 2, `축 ${i}`).toBeCloseTo(0, 9);
  });

  it("목표 크기를 따로 줄 수 있음 · 기본값은 PLANE_TARGET_SIZE(1.6)", () => {
    expect(PLANE_TARGET_SIZE).toBe(1.6);
    expect(fitModel({ min: [0, 0, 0], max: [2, 1, 1] }, 4).scale).toBeCloseTo(2, 9);
    expect(fitModel({ min: [0, 0, 0], max: [2, 1, 1] }).scale).toBeCloseTo(0.8, 9);
  });

  it("긴 변이 y · z 여도 같음 · 비율은 유지(한 가지 scale)", () => {
    expect(fitModel({ min: [0, 0, 0], max: [1, 5, 2] }).scale).toBeCloseTo(PLANE_TARGET_SIZE / 5, 9);
    expect(fitModel({ min: [0, 0, 0], max: [1, 2, 8] }).scale).toBeCloseTo(PLANE_TARGET_SIZE / 8, 9);
  });

  it("크기 0 · 유한하지 않은 상자는 scale 1 · 유한한 offset (NaN 을 만들지 않음)", () => {
    for (const box of [{ min: [1, 1, 1], max: [1, 1, 1] }, { min: [0, 0, 0], max: [Number.NaN, 1, 1] }, { min: [0, 0, 0], max: [Infinity, 1, 1] }] as { min: [number, number, number]; max: [number, number, number] }[]) {
      const f = fitModel(box);
      expect(f.scale, JSON.stringify(box)).toBe(1);
      for (const n of f.offset) expect(Number.isFinite(n), JSON.stringify(box)).toBe(true);
    }
  });
});

describe("조명 (오로라 점광 3개)", () => {
  /** #rrggbb → 색상 각도 0~360 */
  const hue = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    const max = Math.max(r, g, b);
    const d = max - Math.min(r, g, b);
    const h = d === 0 ? 0 : max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return (h * 60 + 360) % 360;
  };

  it("정확히 3개 · 색은 청록 · 보라 · 분홍 · 위치 유한 · 세기 양수", () => {
    expect(PLANE_LIGHTS).toHaveLength(3);
    for (const l of PLANE_LIGHTS) {
      expect(l.color).toMatch(/^#[0-9a-fA-F]{6}$/);
      for (const n of l.position) expect(Number.isFinite(n)).toBe(true);
      expect(l.intensity).toBeGreaterThan(0);
    }
    const hues = PLANE_LIGHTS.map((l) => hue(l.color));
    expect(hues.some((h) => h >= 160 && h <= 200), `청록 ${hues}`).toBe(true);
    expect(hues.some((h) => h >= 230 && h <= 290), `보라 ${hues}`).toBe(true);
    expect(hues.some((h) => h >= 300 && h <= 345), `분홍 ${hues}`).toBe(true);
  });
});

describe("코드 도형 방식은 없어짐 · 모델은 url prop 으로", () => {
  it("lib/plane 이 PLANE_PARTS · PlanePart 를 내보내지 않음", () => {
    expect(Object.keys(planeLib)).not.toContain("PLANE_PARTS");
  });

  it("objects/plane.tsx — url prop · useGLTF · 도형 목록 없음", () => {
    const src = readFileSync(new URL("../objects/plane.tsx", import.meta.url), "utf8");
    expect(src).toMatch(/\burl\s*:\s*string/); // PlaneProps 에 url
    expect(src).toMatch(/useGLTF/);
    expect(src).not.toMatch(/PLANE_PARTS/);
    expect(src).not.toMatch(/<(box|cylinder|cone|sphere)Geometry/);
  });
});
