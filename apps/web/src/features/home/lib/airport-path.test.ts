import { describe, expect, it } from "vitest";
import { CAMERA_KEYS, cameraAt, planeAt, stopAt } from "./airport-path";

describe("공항 시험 장면 — 스크롤 진행 → 카메라 · 비행기 (작업 0184)", () => {
  it("처음과 끝은 첫 · 마지막 카메라 키 그대로", () => {
    expect(cameraAt(0)).toEqual({ target: CAMERA_KEYS[0].target, zoom: CAMERA_KEYS[0].zoom, yaw: CAMERA_KEYS[0].yaw });
    expect(cameraAt(1).target).toEqual(CAMERA_KEYS.at(-1)!.target);
  });

  it("범위 밖 진행은 끝에 붙음", () => {
    expect(cameraAt(-1)).toEqual(cameraAt(0));
    expect(cameraAt(2)).toEqual(cameraAt(1));
  });

  it("두 키 사이는 그 사이 값", () => {
    const z = cameraAt(0.15).zoom;
    expect(z).toBeGreaterThan(1.5);
    expect(z).toBeLessThan(2.1);
  });

  it("처음엔 게이트에 서서 유도로 쪽(+z)을 바라봄", () => {
    const p = planeAt(0.1);
    expect(p.pos).toEqual([-6, 0, 0]);
    expect(p.heading).toBeCloseTo(-Math.PI / 2);
  });

  it("활주로에서는 +x 로 달리고 땅에 붙어 있음", () => {
    const p = planeAt(0.7);
    expect(p.heading).toBeCloseTo(0);
    expect(p.pos[1]).toBe(0);
    expect(p.pitch).toBe(0);
  });

  it("끝에선 떠올라 기수가 위로", () => {
    const p = planeAt(1);
    expect(p.pos[1]).toBeGreaterThan(10);
    expect(p.pitch).toBeGreaterThan(0);
  });

  it("설명 카드는 정류장 순서대로", () => {
    expect(stopAt(0)).toBe(0);
    expect(stopAt(0.3)).toBe(1);
    expect(stopAt(0.6)).toBe(2);
    expect(stopAt(1)).toBe(3);
  });
});
