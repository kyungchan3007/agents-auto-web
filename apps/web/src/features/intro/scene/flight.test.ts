// 작업 0185 — 인트로 4단계 이륙: 비행기 · 카메라 키 경로 · 스크롤 → 진행값 (순수 함수 · 테스트 먼저 · 구현 전에는 FAIL 이 정상)
// 확정 시안 .tmp/intro/intro3.src.html 의 값 그대로 — 사용자가 스크롤로 게이트 → 유도로 → 활주로를 달려 "바퀴가 뜨는 순간(LIFT)"까지만 움직이고, 뜬 뒤는 자동
//
// builder 가 만들 것 — apps/web/src/features/intro/scene/flight.ts (three · React 없음)
//   export const FLIGHT_START = 0.35        // 4단계가 시작할 때 진행값 (게이트 자리)
//   export const LIFT = 0.8                 // 바퀴가 뜨는 진행값 — 여기까지만 스크롤
//   export const WINDOW_AT = 0.97           // 이 값을 넘으면 창문 전환을 시작
//   export type Vec3 = [number, number, number]
//   export type Pose = { pos: Vec3; heading: number; pitch: number }
//   export type Shot = { target: Vec3; zoom: number; yaw: number }
//   export const PLANE_KEYS: { at: number; pos: Vec3 }[]      // 시안 값 그대로 (아래 테스트가 값을 고정)
//   export const CAMERA_KEYS: { at: number; target: Vec3; zoom: number; yaw: number }[]
//   export function planeAt(p: number): Pose                 // 키 사이 보간 (0.62~0.8 구간은 t² 로 가속) · heading = atan2(-dz, dx) · pitch = atan2(dy, 평면 거리) · p 는 0~1 로 자름
//   export function cameraAt(p: number): Shot                // 키 사이 smoothstep 보간 · p 는 FLIGHT_START(0.35)~1 로 자름 (4단계는 0.35 에서 시작 — 그 앞은 첫 키)
//   export function scrollDelta(deltaY: number): number      // clamp(deltaY, -60, 60) / 3400
//   export function keyDelta(key: string): number            // ArrowDown · PageDown · " " → 0.04 / ArrowUp · PageUp → -0.04 / 그 밖 0
//   export function nudge(goal: number, d: number): number   // clamp(goal + d, FLIGHT_START, LIFT + 0.01)
//   export function liftReached(flight: number, auto: boolean): boolean   // !auto 이고 flight ≥ LIFT − 0.004
//   export function meter(flight: number): number            // clamp01((flight − FLIGHT_START) / (LIFT − FLIGHT_START)) — 진행 막대 0~1
//   export function advance(flight: number, goal: number, dtSec: number, still: boolean): number   // flight += (goal − flight) × (still ? 1 : min(1, dt × 5))
//   export function autoGoal(goal: number, dtSec: number, still: boolean): number                    // 뜬 뒤 자동: min(1, goal + dt × (still ? 1 : 0.09))
//   export function windowDue(flight: number, auto: boolean, windowing: boolean): boolean            // auto 이고 flight ≥ WINDOW_AT 이고 아직 전환 중이 아님
import { describe, expect, it } from "vitest";
import { CAMERA_KEYS, FLIGHT_START, LIFT, PLANE_KEYS, WINDOW_AT, advance, autoGoal, cameraAt, keyDelta, liftReached, meter, nudge, planeAt, scrollDelta, windowDue } from "./flight";

const close = (a: number, b: number, d = 1e-6) => expect(Math.abs(a - b)).toBeLessThanOrEqual(d);

describe("상수 · 키 경로(시안 값 그대로)", () => {
  it("시작 0.35 · 바퀴가 뜨는 값 0.8 · 창문 전환 0.97", () => {
    expect([FLIGHT_START, LIFT, WINDOW_AT]).toEqual([0.35, 0.8, 0.97]);
  });

  it("비행기 키 8개 — 게이트 → 유도로 → 활주로 → 상승", () => {
    expect(PLANE_KEYS).toEqual([
      { at: 0, pos: [-6, 0, 1.4] }, { at: 0.35, pos: [-6, 0, 1.4] }, { at: 0.42, pos: [-6, 0, 6] }, { at: 0.52, pos: [-34, 0, 6] },
      { at: 0.57, pos: [-34, 0, 10] }, { at: 0.62, pos: [-34, 0, 10] }, { at: 0.8, pos: [14, 0, 10] }, { at: 1, pos: [58, 30, 8] },
    ]);
  });

  it("카메라 키 5개 — 늘 터미널 쪽에서 봄", () => {
    expect(CAMERA_KEYS).toEqual([
      { at: 0.35, target: [-6, 0, 1], zoom: 2.5, yaw: 200 }, { at: 0.5, target: [-26, 0, 6], zoom: 2.1, yaw: 212 },
      { at: 0.62, target: [-30, 0, 10], zoom: 2.0, yaw: 200 }, { at: 0.8, target: [10, 1, 10], zoom: 1.65, yaw: 190 }, { at: 1, target: [44, 16, 10], zoom: 1.35, yaw: 182 },
    ]);
  });

  it("키는 at 오름차순 · 모두 0~1", () => {
    for (const keys of [PLANE_KEYS, CAMERA_KEYS]) for (let i = 0; i < keys.length; i++) {
      expect(keys[i].at).toBeGreaterThanOrEqual(0);
      expect(keys[i].at).toBeLessThanOrEqual(1);
      if (i) expect(keys[i].at).toBeGreaterThanOrEqual(keys[i - 1].at);
    }
  });
});

describe("planeAt — 비행기 자리 · 방향", () => {
  it("처음 · 게이트에 서 있음 (0 ~ 0.35 는 같은 자리 · 방향 0)", () => {
    for (const p of [0, 0.2, 0.35]) {
      const a = planeAt(p);
      expect(a.pos).toEqual([-6, 0, 1.4]);
    }
  });

  it("키 자리에서는 키 값 그대로", () => {
    expect(planeAt(0.52).pos).toEqual([-34, 0, 6]);
    expect(planeAt(0.62).pos).toEqual([-34, 0, 10]);
    expect(planeAt(0.8).pos).toEqual([14, 0, 10]);
    expect(planeAt(1).pos).toEqual([58, 30, 8]);
  });

  it("0.62~0.8 활주로 구간은 t² 로 가속 — 0.71 에서 x = −34 + 48 × 0.25 = −22", () => {
    const a = planeAt(0.71);
    close(a.pos[0], -22);
    expect(a.pos[1]).toBe(0);
    expect(a.pos[2]).toBe(10);
    close(a.heading, 0); // +x 로 달림
    close(a.pitch, 0); // 땅 위
  });

  it("0.8 이후 떠오름 — 직선 보간 · 0.9 에서 [36, 15, 9] · 코가 위(pitch > 0)", () => {
    const a = planeAt(0.9);
    close(a.pos[0], 36);
    close(a.pos[1], 15);
    close(a.pos[2], 9);
    expect(a.pitch).toBeGreaterThan(0);
    close(a.pitch, Math.atan2(30, Math.hypot(44, -2)));
    close(a.heading, Math.atan2(2, 44)); // atan2(-dz, dx) · dz = −2
  });

  it("유도로 구간(0.42~0.52)은 서쪽(−x)으로 · 방향 π", () => {
    const a = planeAt(0.47);
    expect(a.pos[0]).toBeLessThan(-6);
    expect(a.pos[0]).toBeGreaterThan(-34);
    close(Math.abs(a.heading), Math.PI);
  });

  it("범위 밖은 0~1 로 자름", () => {
    expect(planeAt(-3).pos).toEqual(planeAt(0).pos);
    expect(planeAt(9).pos).toEqual(planeAt(1).pos);
  });

  it("떠오르는 동안 높이가 줄지 않음 (0.8 → 1)", () => {
    let prev = -1;
    for (let p = 0.8; p <= 1.0001; p += 0.02) {
      const y = planeAt(p).pos[1];
      expect(y).toBeGreaterThanOrEqual(prev);
      prev = y;
    }
  });
});

describe("cameraAt — 카메라", () => {
  it("키 자리에서는 키 값 · 처음은 첫 키", () => {
    for (const k of CAMERA_KEYS) {
      const c = cameraAt(k.at);
      expect(c.target).toEqual(k.target);
      close(c.zoom, k.zoom);
      close(c.yaw, k.yaw);
    }
    expect(cameraAt(0).target).toEqual(CAMERA_KEYS[0].target); // 0.35 앞은 첫 키로 자름
    expect(cameraAt(-3)).toEqual(cameraAt(FLIGHT_START));
  });

  it("키 사이는 smoothstep — 가운데에서 두 키의 한가운데 (0.35 ~ 0.5 의 0.425 → zoom 2.3)", () => {
    const c = cameraAt(0.425);
    close(c.zoom, 2.3);
    close(c.yaw, 206);
    close(c.target[0], -16);
  });

  it("범위 밖은 0~1 로 자름", () => {
    expect(cameraAt(5)).toEqual(cameraAt(1));
  });
});

describe("스크롤 → 진행값", () => {
  it("scrollDelta — ±60 으로 자르고 3400 으로 나눔", () => {
    close(scrollDelta(60), 60 / 3400);
    close(scrollDelta(1000), 60 / 3400);
    close(scrollDelta(-1000), -60 / 3400);
    close(scrollDelta(17), 17 / 3400);
    expect(scrollDelta(0)).toBe(0);
  });

  it("keyDelta — 아래 · PageDown · 스페이스 +0.04 / 위 · PageUp −0.04 / 그 밖 0", () => {
    for (const k of ["ArrowDown", "PageDown", " "]) expect(keyDelta(k), k).toBe(0.04);
    for (const k of ["ArrowUp", "PageUp"]) expect(keyDelta(k), k).toBe(-0.04);
    for (const k of ["a", "Enter", "Tab", "Escape"]) expect(keyDelta(k), k).toBe(0);
  });

  it("nudge — 0.35 아래로 안 내려가고 LIFT + 0.01 위로 안 올라감", () => {
    close(nudge(0.5, 0.04), 0.54);
    expect(nudge(0.35, -0.5)).toBe(0.35);
    close(nudge(0.79, 0.5), 0.81);
    close(nudge(LIFT, 0.04), LIFT + 0.01);
  });

  it("스크롤만으로는 LIFT 까지만 — 아무리 굴려도 0.81 을 넘지 않음 (뜬 뒤는 자동)", () => {
    let goal = FLIGHT_START;
    for (let i = 0; i < 500; i++) goal = nudge(goal, scrollDelta(120));
    expect(goal).toBeLessThanOrEqual(LIFT + 0.01 + 1e-9);
    expect(goal).toBeGreaterThanOrEqual(LIFT);
  });

  it("liftReached — 스크롤 중에 LIFT − 0.004 에 닿으면 참 · 자동이면 거짓", () => {
    expect(liftReached(0.7, false)).toBe(false);
    expect(liftReached(LIFT - 0.005, false)).toBe(false);
    expect(liftReached(LIFT - 0.004, false)).toBe(true);
    expect(liftReached(0.95, false)).toBe(true);
    expect(liftReached(0.95, true)).toBe(false);
  });

  it("meter — 시작 0 · LIFT 에서 1 · 가운데 0.5 · 자름", () => {
    expect(meter(FLIGHT_START)).toBe(0);
    expect(meter(LIFT)).toBe(1);
    close(meter((FLIGHT_START + LIFT) / 2), 0.5);
    expect(meter(0)).toBe(0);
    expect(meter(1)).toBe(1);
  });
});

describe("진행 · 자동", () => {
  it("advance — 목표로 부드럽게 (dt 0.1 이면 절반) · 움직임 줄이기면 바로", () => {
    close(advance(0.4, 0.8, 0.1, false), 0.6);
    close(advance(0.4, 0.8, 1, false), 0.8); // dt × 5 가 1 을 넘으면 1 로 자름
    expect(advance(0.4, 0.8, 0.016, true)).toBe(0.8);
  });

  it("autoGoal — 뜬 뒤 초당 0.09 씩(움직임 줄이기면 초당 1) · 1 에서 멈춤", () => {
    close(autoGoal(0.8, 1, false), 0.89);
    expect(autoGoal(0.8, 100, false)).toBe(1);
    expect(autoGoal(0.8, 0.5, true)).toBe(1);
    expect(autoGoal(0.8, 0, false)).toBe(0.8);
  });

  it("windowDue — 자동 · 0.97 이상 · 아직 전환 안 함일 때만 한 번", () => {
    expect(windowDue(0.96, true, false)).toBe(false);
    expect(windowDue(0.97, true, false)).toBe(true);
    expect(windowDue(0.99, true, true)).toBe(false);
    expect(windowDue(0.99, false, false)).toBe(false);
  });

  it("뜬 뒤 자동으로 창문까지 걸리는 시간은 약 2초 안팎 (LIFT 0.8 → 0.97 · 초당 0.09 → 약 1.9초)", () => {
    let goal = LIFT;
    let t = 0;
    while (goal < WINDOW_AT && t < 20) { goal = autoGoal(goal, 0.016, false); t += 0.016; }
    expect(t).toBeGreaterThan(1.5);
    expect(t).toBeLessThan(2.5);
  });
});
