// 공항 시험 장면 — 스크롤 진행(0~1) → 카메라 · 비행기 위치 (순수 함수 · 작업 0184)
//   카메라: 정류장마다 바라볼 곳 · 확대 · 방향을 두고 그 사이를 부드럽게 이음
//   비행기: 게이트 → 유도로 → 활주로 끝 → 달리기 → 이륙

export type Vec3 = [number, number, number];
export type CameraKey = { at: number; target: Vec3; zoom: number; yaw: number };
export type PlaneKey = { at: number; pos: Vec3 };

export const CAMERA_KEYS: CameraKey[] = [
  { at: 0, target: [-6, 0, -4], zoom: 1.5, yaw: 30 }, // 터미널 전체
  { at: 0.3, target: [12, 3, -6], zoom: 2.1, yaw: 55 }, // 관제탑
  { at: 0.55, target: [-30, 0, 9], zoom: 1.9, yaw: 20 }, // 활주로 끝 — 비행기 대기
  { at: 0.8, target: [12, 1, 10], zoom: 1.5, yaw: 0 }, // 달리기
  { at: 1, target: [40, 9, 10], zoom: 1.2, yaw: -15 }, // 이륙
];

export const PLANE_KEYS: PlaneKey[] = [
  { at: 0, pos: [-6, 0, 0] }, // 게이트
  { at: 0.35, pos: [-6, 0, 0] },
  { at: 0.42, pos: [-6, 0, 6] }, // 유도로로 나감
  { at: 0.52, pos: [-34, 0, 6] },
  { at: 0.57, pos: [-34, 0, 10] }, // 활주로 끝
  { at: 0.62, pos: [-34, 0, 10] }, // 잠깐 대기
  { at: 0.8, pos: [14, 0, 10] }, // 달리기
  { at: 1, pos: [48, 14, 10] }, // 이륙
];

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const smooth = (t: number) => t * t * (3 - 2 * t);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const mix3 = (a: Vec3, b: Vec3, t: number): Vec3 => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];

/** p 가 들어간 구간의 앞 · 뒤 키와 구간 안 비율 */
function span<K extends { at: number }>(keys: K[], p: number): [K, K, number] {
  const q = clamp01(p);
  for (let i = 1; i < keys.length; i++) {
    if (q <= keys[i].at) {
      const a = keys[i - 1];
      const b = keys[i];
      return [a, b, b.at === a.at ? 1 : (q - a.at) / (b.at - a.at)];
    }
  }
  const last = keys[keys.length - 1];
  return [last, last, 1];
}

export function cameraAt(p: number): Omit<CameraKey, "at"> {
  const [a, b, t] = span(CAMERA_KEYS, p);
  const s = smooth(t);
  return { target: mix3(a.target, b.target, s), zoom: mix(a.zoom, b.zoom, s), yaw: mix(a.yaw, b.yaw, s) };
}

/** 비행기 위치 · 머리 방향(라디안 · +x 가 0) · 기수 각도(오르면 +) */
export function planeAt(p: number): { pos: Vec3; heading: number; pitch: number } {
  const [a, b, t] = span(PLANE_KEYS, p);
  // 달리기는 점점 빨라지게 (가속) · 나머지는 일정
  const eased = a.at === 0.62 ? t * t : t;
  const pos = mix3(a.pos, b.pos, eased);
  // 멈춘 구간이면 다음에 움직일 방향을 바라봄
  let from = a.pos;
  let to = b.pos;
  if (from.every((v, i) => v === to[i])) {
    const i = PLANE_KEYS.indexOf(b);
    const next = PLANE_KEYS[Math.min(i + 1, PLANE_KEYS.length - 1)];
    from = b.pos;
    to = next.pos;
  }
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const dz = to[2] - from[2];
  const flat = Math.hypot(dx, dz);
  return { pos, heading: flat === 0 ? 0 : Math.atan2(-dz, dx), pitch: flat === 0 ? 0 : Math.atan2(dy, flat) };
}

/** 지금 보여 줄 설명 카드 번호 (0부터) */
export const STOPS = [0, 0.3, 0.55, 0.8] as const;
export function stopAt(p: number): number {
  let i = 0;
  STOPS.forEach((at, k) => {
    if (clamp01(p) >= at - 0.05) i = k;
  });
  return i;
}
