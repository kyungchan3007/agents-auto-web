// 인트로 4단계 이륙 — 비행기 · 카메라 키 경로 · 스크롤 → 진행값 (순수 함수 · three · React 없음 · 작업 0185 · 테스트 flight.test.ts)
// 확정 시안 intro3.src.html 의 값 그대로 — 사용자가 스크롤로 게이트 → 유도로 → 활주로를 달려 "바퀴가 뜨는 순간(LIFT)"까지만 움직이고, 뜬 뒤는 자동

/** 4단계가 시작할 때 진행값 (게이트 자리) */
export const FLIGHT_START = 0.35;
/** 바퀴가 뜨는 진행값 — 여기까지만 스크롤 */
export const LIFT = 0.8;
/** 이 값을 넘으면 창문 전환을 시작 */
export const WINDOW_AT = 0.97;

export type Vec3 = [number, number, number];
export type Pose = { pos: Vec3; heading: number; pitch: number };
export type Shot = { target: Vec3; zoom: number; yaw: number };

// 이륙 구간 카메라 — 늘 남쪽(터미널 쪽)에서 봐서 도시가 활주로 뒤 배경이 되게
export const CAMERA_KEYS: { at: number; target: Vec3; zoom: number; yaw: number }[] = [
  { at: 0.35, target: [-6, 0, 1], zoom: 2.5, yaw: 200 },
  { at: 0.5, target: [-26, 0, 6], zoom: 2.1, yaw: 212 },
  { at: 0.62, target: [-30, 0, 10], zoom: 2.0, yaw: 200 },
  { at: 0.8, target: [10, 1, 10], zoom: 1.65, yaw: 190 },
  { at: 1, target: [44, 16, 10], zoom: 1.35, yaw: 182 },
];
export const PLANE_KEYS: { at: number; pos: Vec3 }[] = [
  { at: 0, pos: [-6, 0, 1.4] },
  { at: 0.35, pos: [-6, 0, 1.4] },
  { at: 0.42, pos: [-6, 0, 6] },
  { at: 0.52, pos: [-34, 0, 6] },
  { at: 0.57, pos: [-34, 0, 10] },
  { at: 0.62, pos: [-34, 0, 10] },
  { at: 0.8, pos: [14, 0, 10] },
  { at: 1, pos: [58, 30, 8] },
];

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const smooth = (t: number) => t * t * (3 - 2 * t);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const mix3 = (a: Vec3, b: Vec3, t: number): Vec3 => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];

/** p(0~1) 가 놓인 두 키와 그 사이 비율 */
function span<T extends { at: number }>(keys: T[], p: number): [T, T, number] {
  const q = clamp01(p);
  for (let i = 1; i < keys.length; i++) {
    if (q <= keys[i].at) {
      const a = keys[i - 1];
      const b = keys[i];
      return [a, b, b.at === a.at ? 1 : (q - a.at) / (b.at - a.at)];
    }
  }
  const l = keys[keys.length - 1];
  return [l, l, 1];
}

/** 비행기 자리 · 방향 — 키 사이 보간 (0.62~0.8 활주로 구간은 t² 로 가속) · heading = atan2(-dz, dx) · pitch = atan2(dy, 평면 거리) */
export function planeAt(p: number): Pose {
  const [a, b, t] = span(PLANE_KEYS, p);
  const pos = mix3(a.pos, b.pos, a.at === 0.62 ? t * t : t);
  let from = a.pos;
  let to = b.pos;
  // 같은 자리에 서 있는 키 사이에서는 다음 키 쪽을 봄
  if (from.every((v, i) => v === to[i])) {
    const i = PLANE_KEYS.indexOf(b);
    from = b.pos;
    to = PLANE_KEYS[Math.min(i + 1, PLANE_KEYS.length - 1)].pos;
  }
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const dz = to[2] - from[2];
  const flat = Math.hypot(dx, dz);
  return { pos, heading: flat === 0 ? 0 : Math.atan2(-dz, dx), pitch: flat === 0 ? 0 : Math.atan2(dy, flat) };
}

/** 카메라 — 키 사이 smoothstep 보간 · p 는 FLIGHT_START ~ 1 로 자름 (4단계는 0.35 에서 시작) */
export function cameraAt(p: number): Shot {
  const [a, b, t] = span(CAMERA_KEYS, clamp(p, FLIGHT_START, 1));
  const s = smooth(t);
  return { target: mix3(a.target, b.target, s), zoom: mix(a.zoom, b.zoom, s), yaw: mix(a.yaw, b.yaw, s) };
}

/** 휠 한 번의 진행 — ±60 으로 자르고 3400 으로 나눔 */
export const scrollDelta = (deltaY: number): number => clamp(deltaY, -60, 60) / 3400;

/** 키 한 번의 진행 — 아래 · PageDown · 스페이스 +0.04 / 위 · PageUp −0.04 */
export function keyDelta(key: string): number {
  if (key === "ArrowDown" || key === "PageDown" || key === " ") return 0.04;
  if (key === "ArrowUp" || key === "PageUp") return -0.04;
  return 0;
}

/** 목표 진행값 — 0.35 아래로 안 내려가고 LIFT + 0.01 위로 안 올라감 (뜬 뒤는 자동) */
export const nudge = (goal: number, d: number): number => clamp(goal + d, FLIGHT_START, LIFT + 0.01);

/** 스크롤 중에 바퀴가 뜨는 값(LIFT − 0.004)에 닿았는지 */
export const liftReached = (flight: number, auto: boolean): boolean => !auto && flight >= LIFT - 0.004;

/** 진행 막대 0~1 — 시작 0 · LIFT 에서 1 */
export const meter = (flight: number): number => clamp01((flight - FLIGHT_START) / (LIFT - FLIGHT_START));

/** 현재 진행값이 목표로 부드럽게 따라감 (움직임 줄이기면 바로) */
export const advance = (flight: number, goal: number, dtSec: number, still: boolean): number => flight + (goal - flight) * (still ? 1 : Math.min(1, dtSec * 5));

/** 뜬 뒤 자동 진행 — 초당 0.09(움직임 줄이기면 초당 1) · 1 에서 멈춤 */
export const autoGoal = (goal: number, dtSec: number, still: boolean): number => Math.min(1, goal + dtSec * (still ? 1 : 0.09));

/** 창문 전환을 시작할 때 — 자동 · 0.97 이상 · 아직 전환 중이 아님 */
export const windowDue = (flight: number, auto: boolean, windowing: boolean): boolean => auto && flight >= WINDOW_AT && !windowing;
