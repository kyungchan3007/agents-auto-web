// 작업 0185 — 3D 장면 없이 훅이 이륙을 굴리는 한 프레임 (tickFlight) · 장면이 하던 계산과 같은지
import { describe, expect, it } from "vitest";
import { FLIGHT_START, LIFT, WINDOW_AT, advance, autoGoal, tickFlight } from "./flight";

describe("tickFlight", () => {
  it("스크롤 중(자동 아님) — 목표는 그대로 · 진행값이 목표로 따라감 · 아직 안 뜸", () => {
    const r = tickFlight({ flight: FLIGHT_START, goal: 0.6, auto: false, windowing: false }, 0.1, false);
    expect(r.goal).toBe(0.6);
    expect(r.flight).toBeCloseTo(advance(FLIGHT_START, 0.6, 0.1, false), 10);
    expect(r.lift).toBe(false);
    expect(r.window).toBe(false);
  });

  it("바퀴가 뜨는 값에 닿으면 lift (자동이 아닐 때만)", () => {
    expect(tickFlight({ flight: LIFT, goal: LIFT, auto: false, windowing: false }, 0.016, false).lift).toBe(true);
    expect(tickFlight({ flight: LIFT, goal: LIFT, auto: true, windowing: false }, 0.016, false).lift).toBe(false);
  });

  it("뜬 뒤(자동) — 목표가 초당 0.09 씩 오르고 0.97 에 닿으면 창문 시점", () => {
    expect(tickFlight({ flight: 0.8, goal: 0.8, auto: true, windowing: false }, 1, false).goal).toBeCloseTo(autoGoal(0.8, 1, false), 10);
    expect(tickFlight({ flight: WINDOW_AT, goal: 1, auto: true, windowing: false }, 0.016, false).window).toBe(true);
    expect(tickFlight({ flight: WINDOW_AT, goal: 1, auto: true, windowing: true }, 0.016, false).window).toBe(false);
  });

  it("움직임 줄이기 — 바로 목표로", () => {
    expect(tickFlight({ flight: 0.4, goal: 0.7, auto: false, windowing: false }, 0.016, true).flight).toBe(0.7);
  });

  it("프레임을 돌려 뜬 뒤 약 2초 안에 창문 시점 (LIFT → 0.97 · 초당 0.09)", () => {
    let s = { flight: LIFT, goal: LIFT, auto: true, windowing: false };
    let t = 0;
    while (t < 20) {
      const r = tickFlight(s, 0.016, false);
      s = { ...s, flight: r.flight, goal: r.goal };
      t += 0.016;
      if (r.window) break;
    }
    expect(t).toBeGreaterThan(1.5);
    expect(t).toBeLessThan(4);
  });
});
