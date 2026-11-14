// 작업 0164 — 3D 비행기 순수 로직 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   three/objects/plane.tsx 는 이 순수 로직만 씀 (기존 tower.ts · geo.ts 방식 — 그리는 코드는 테스트하지 않음)
//
// builder 가 만들 것 — packages/ui/src/three/lib/plane.ts
//   export type PlanePart = { name: string; shape: "box" | "cylinder" | "cone" | "sphere"; position: [number, number, number]; size: [number, number, number]; rotation?: [number, number, number] }
//   export const PLANE_PARTS: readonly PlanePart[]       // 코드로 만든 도형만 (외부 모델 파일 없음) — 이름에 fuselage(몸통) · wing(날개) · tail(꼬리) 포함
//   export function planeMotion(t: number /* 초 */, animate: boolean): { position: [number, number, number]; rotation: [number, number, number] }
//     - animate=false(움직임 줄이기) 면 t 가 얼마든 항상 같은 값 (멈춘 그림) · t=0 일 때의 값과 같음
//     - animate=true 면 시간에 따라 변함 (천천히 떠다님) · 위아래 흔들림은 ±0.3 안 · 기울기는 ±0.35rad 안 (멀미 · 화면 밖으로 안 나감)
//     - 같은 t 면 같은 값 (순수 함수) · NaN · Infinity 를 돌려주지 않음 (t 가 아주 커도)
import { describe, expect, it } from "vitest";
import { PLANE_PARTS, planeMotion } from "./plane";

describe("비행기 도형 — 코드로 만든 부품", () => {
  it("몸통 · 날개 · 꼬리가 있음", () => {
    const names = PLANE_PARTS.map((p) => p.name).join(" ");
    for (const need of ["fuselage", "wing", "tail"]) expect(names, need).toContain(need);
  });

  it("부품은 기본 도형(box · cylinder · cone · sphere)뿐 · 모든 숫자가 유한 · 크기는 양수 (외부 모델 파일 없음)", () => {
    expect(PLANE_PARTS.length).toBeGreaterThanOrEqual(3);
    for (const p of PLANE_PARTS) {
      expect(["box", "cylinder", "cone", "sphere"], p.name).toContain(p.shape);
      for (const n of [...p.position, ...p.size, ...(p.rotation ?? [])]) expect(Number.isFinite(n), p.name).toBe(true);
      for (const s of p.size) expect(s, p.name).toBeGreaterThan(0);
    }
  });

  it("날개는 좌우 대칭 (x 가 마주보는 두 쪽 · 또는 가운데 한 개로 폭이 몸통보다 넓음)", () => {
    const wings = PLANE_PARTS.filter((p) => p.name.includes("wing"));
    expect(wings.length).toBeGreaterThanOrEqual(1);
    const fuselage = PLANE_PARTS.find((p) => p.name.includes("fuselage"));
    const spanOf = (w: (typeof wings)[number]) => Math.abs(w.position[0]) + Math.max(...w.size);
    const widest = Math.max(...wings.map(spanOf));
    expect(widest).toBeGreaterThan(Math.max(...(fuselage?.size ?? [0])) / 2);
    if (wings.length >= 2) expect(wings.reduce((s, w) => s + w.position[0], 0)).toBeCloseTo(0, 6);
  });
});

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
