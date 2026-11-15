// ✈️ 그래프 선을 따라 나는 비행기의 경로 계산 — 순수 (작업 0169 · 테스트 있음)
//   비행기 생김새(plane.glb · 조명 · 크기)는 lib/plane.ts · objects/plane.tsx 그대로 — 여기는 "어디에 어느 방향으로" 만
export type RoutePoint = { x: number; y: number };

/** 1월 → 12월 한 번 나는 데 걸리는 시간 (초 · 기본값) */
export const ROUTE_SECONDS = 14;

const finite = (n: number) => (Number.isFinite(n) ? n : 0);
const clamp01 = (n: number) => Math.min(1, Math.max(0, finite(n)));

/** 점 사이 직선 구간 (길이 0 인 구간은 뺌) */
function segments(points: RoutePoint[]) {
  const out: { a: RoutePoint; b: RoutePoint; len: number; start: number }[] = [];
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (!(len > 0)) continue;
    out.push({ a, b, len, start: total });
    total += len;
  }
  return { out, total };
}

/**
 * progress(0 ~ 1 · 선 전체 길이 기준)의 위치와 진행 방향(라디안 · atan2(dy, dx))
 * 구간 경계(점 위)에서는 앞으로 갈 구간의 방향 · progress 1 은 마지막 구간 · 범위 밖은 자름 · NaN 은 0 · 점이 없으면 null
 */
export function routePosition(points: RoutePoint[], progress: number): { x: number; y: number; angle: number } | null {
  if (points.length === 0) return null;
  const { out, total } = segments(points);
  if (out.length === 0) return { x: points[0].x, y: points[0].y, angle: 0 };
  const target = clamp01(progress) * total;
  const seg = out.find((s) => target < s.start + s.len) ?? out[out.length - 1];
  const t = Math.min(1, Math.max(0, (target - seg.start) / seg.len));
  return {
    x: seg.a.x + (seg.b.x - seg.a.x) * t,
    y: seg.a.y + (seg.b.y - seg.a.y) * t,
    angle: Math.atan2(seg.b.y - seg.a.y, seg.b.x - seg.a.x),
  };
}

/** index 번째 점이 선 위 어디쯤인지 진행률(0 ~ 1 · 길이 기준) · 범위 밖 index 는 null · 점이 하나면 0 */
export function progressAt(points: RoutePoint[], index: number): number | null {
  if (!Number.isInteger(index) || index < 0 || index >= points.length) return null;
  let upTo = 0;
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const len = Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    total += len;
    if (i <= index) upTo += len;
  }
  return total > 0 ? upTo / total : 0;
}

/**
 * 시간 t(초) → 진행률 — animate=false(움직임 줄이기)면 t 와 상관없이 stopProgress(가장 싼 달 점에 멈춤) · true 면 0 이상 1 미만으로 반복
 * t 가 음수 · NaN · Infinity 면 0
 */
export function routeProgress(t: number, animate: boolean, stopProgress: number, seconds = ROUTE_SECONDS): number {
  if (!animate) return clamp01(stopProgress);
  if (!Number.isFinite(t) || t < 0 || !(seconds > 0)) return 0;
  return (t / seconds) % 1;
}
