// 작업 0231 — 통화 바꾸기 전환(시안 7) 계산 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   참고 구현: .tmp/motion-pages/m-currencies-USD.js (scrollToRate · flyFlag · movePlane · go)
//
// builder 가 만들 것 — apps/web/src/features/currencies/lib/switch-motion.ts
//   scrollTarget(kickerTop: number, scrollY: number, navH: number, gap = 96): number   // 환율 자리(국기 라벨 줄)가 메뉴 띠 아래 gap 만큼에 오게 하는 스크롤 값 = max(0, kickerTop + scrollY − navH − gap)
//   needsScroll(scrollY: number, target: number, tolerance = 8): boolean               // |scrollY − target| ≥ tolerance 일 때만 올라감
//   scrollDuration(distance: number): number                                           // min(900, 380 + |distance| × 0.25) ms
//   arcPoint(from: { x: number; y: number }, to: { x: number; y: number }, t: number, lift = 60): { x: number; y: number }
//     // 국기 포물선 — t 0 → from · t 1 → to · 가운데는 두 점을 이은 직선에서 lift(px) 만큼 위로 솟음(포물선: 4·t·(1−t)·lift) · t 는 0~1 로 자름
//   planeHeading(oldPos: number | null, newPos: number | null): "left" | "right" | null   // 비행기 위치(0~1)가 줄면 "left"(기수를 돌림) · 늘거나 같으면 "right" · 어느 쪽이 없으면 null
//   // 전환 기억(모듈 단위 작은 저장소 · lib/switch-memory.ts)
//   rememberSwitch(s: SwitchSnapshot): void   SwitchSnapshot = { code: string; big: number | null; min: number | null; max: number | null; avg: number | null; pos: number | null; amount: number | null; at: number }
//   takeSwitchFrom(newCode: string, now?: number): SwitchSnapshot | null   // 직전에 보이던 다른 통화의 값을 한 번만 돌려주고 비움 · 같은 통화 · 기억 없음 · 10초 넘게 지난 기억은 null
//   clearSwitch(): void
import { beforeEach, describe, expect, it } from "vitest";
import { arcPoint, needsScroll, planeHeading, scrollDuration, scrollTarget } from "./switch-motion";
import { clearSwitch, rememberSwitch, takeSwitchFrom } from "./switch-memory";

describe("scrollTarget · needsScroll · scrollDuration", () => {
  it("환율 자리를 메뉴 아래 96px 에 — kickerTop(화면 기준) + scrollY − navH − 96", () => {
    expect(scrollTarget(700, 1200, 72)).toBe(700 + 1200 - 72 - 96);
    expect(scrollTarget(150, 0, 72)).toBe(0); // 이미 위쪽이면 음수 → 0
  });
  it("이미 거의 맞으면(8px 안) 올라가지 않음", () => {
    expect(needsScroll(1000, 1000)).toBe(false);
    expect(needsScroll(1000, 1007.9)).toBe(false);
    expect(needsScroll(1000, 1008)).toBe(true);
    expect(needsScroll(0, 900)).toBe(true);
  });
  it("시간 = 380ms + 거리 × 0.25 (900ms 까지)", () => {
    expect(scrollDuration(0)).toBe(380);
    expect(scrollDuration(400)).toBe(480);
    expect(scrollDuration(-400)).toBe(480);
    expect(scrollDuration(5000)).toBe(900);
  });
});

describe("arcPoint — 국기 포물선", () => {
  const a = { x: 100, y: 40 }, b = { x: 500, y: 300 };
  it("처음 · 끝은 두 점", () => {
    expect(arcPoint(a, b, 0)).toEqual(a);
    expect(arcPoint(a, b, 1)).toEqual(b);
  });
  it("가운데는 직선보다 lift 만큼 위(y 가 작음)", () => {
    const m = arcPoint(a, b, 0.5, 60);
    expect(m.x).toBeCloseTo(300, 6);
    expect(m.y).toBeCloseTo(170 - 60, 6); // 직선 가운데 170 에서 위로 60
  });
  it("t 는 0~1 로 자름 · 기본 lift 60", () => {
    expect(arcPoint(a, b, -1)).toEqual(a);
    expect(arcPoint(a, b, 2)).toEqual(b);
    expect(arcPoint(a, b, 0.5).y).toBeCloseTo(110, 6);
  });
  it("솟음은 t(1−t) 모양 — 4분의 1 지점은 가운데의 75%", () => {
    const q = arcPoint({ x: 0, y: 0 }, { x: 100, y: 0 }, 0.25, 40);
    expect(q.y).toBeCloseTo(-30, 6);
  });
});

describe("planeHeading — 왼쪽으로 가면 기수를 돌림", () => {
  it("줄면 left · 늘거나 같으면 right · 없으면 null", () => {
    expect(planeHeading(0.8, 0.2)).toBe("left");
    expect(planeHeading(0.2, 0.8)).toBe("right");
    expect(planeHeading(0.5, 0.5)).toBe("right");
    expect(planeHeading(null, 0.5)).toBeNull();
    expect(planeHeading(0.5, null)).toBeNull();
  });
});

describe("전환 기억 — 직전 통화 값에서 이어 가기 (처음 · 새로 고침은 없음 → 움직임 없이 최종)", () => {
  beforeEach(() => clearSwitch());
  const snap = (code: string, at = 1000) => ({ code, big: 835.23, min: 833.5, max: 965.5, avg: 914.1, pos: 0.02, amount: 10000, at });
  it("기억이 없으면 null (처음 들어옴 · 새로 고침)", () => {
    expect(takeSwitchFrom("USD", 1000)).toBeNull();
  });
  it("다른 통화로 바뀔 때 직전 값을 한 번만 돌려줌", () => {
    rememberSwitch(snap("JPY"));
    expect(takeSwitchFrom("USD", 2000)).toMatchObject({ code: "JPY", big: 835.23, pos: 0.02 });
    expect(takeSwitchFrom("USD", 2000)).toBeNull();
  });
  it("같은 통화면 null · 10초 넘게 지났으면 null", () => {
    rememberSwitch(snap("JPY"));
    expect(takeSwitchFrom("JPY", 2000)).toBeNull();
    rememberSwitch(snap("JPY", 1000));
    expect(takeSwitchFrom("USD", 1000 + 10001)).toBeNull();
    rememberSwitch(snap("JPY", 1000));
    expect(takeSwitchFrom("USD", 1000 + 9999)).not.toBeNull();
  });
  it("가장 마지막 기억만", () => {
    rememberSwitch(snap("JPY", 1000));
    rememberSwitch(snap("EUR", 1500));
    expect(takeSwitchFrom("USD", 2000)?.code).toBe("EUR");
  });
});
