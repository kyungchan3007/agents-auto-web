// 통화 바꾸기 전환 계산 — 순수 함수 (작업 0231 · 모션 7 · 테스트 switch-motion.test.ts · 시안 m-currencies-USD.js scrollToRate · flyFlag · movePlane)

/** 날아가는 국기 요소의 testid — 전환 중에만 DOM 에 있음 */
export const FLAG_FLY_ID = "flag-fly";

/** 환율 자리(국기 라벨 줄)가 메뉴 띠 아래 gap 만큼에 오게 하는 스크롤 값 — kickerTop 은 화면 기준 · 이미 위쪽이면 0 */
export const scrollTarget = (kickerTop: number, scrollY: number, navH: number, gap = 96): number => Math.max(0, kickerTop + scrollY - navH - gap);

/** 이미 거의 맞으면(tolerance 안) 움직이지 않음 */
export const needsScroll = (scrollY: number, target: number, tolerance = 8): boolean => Math.abs(scrollY - target) >= tolerance;

/** 올라가는 시간(ms) — 380 + 거리 × 0.25 (900 까지) */
export const scrollDuration = (distance: number): number => Math.min(900, 380 + Math.abs(distance) * 0.25);

/** 국기 포물선 — 두 점을 이은 직선에서 가운데가 lift(px) 만큼 위로 솟음(4·t·(1−t)·lift) · t 는 0~1 로 자름 */
export function arcPoint(from: { x: number; y: number }, to: { x: number; y: number }, t: number, lift = 60): { x: number; y: number } {
  const k = Math.min(1, Math.max(0, t));
  return { x: from.x + (to.x - from.x) * k, y: from.y + (to.y - from.y) * k - 4 * k * (1 - k) * lift };
}

/** 비행기 위치(0~1)가 줄면 "left"(기수를 돌림) · 늘거나 같으면 "right" · 어느 쪽이 없으면 null */
export function planeHeading(oldPos: number | null, newPos: number | null): "left" | "right" | null {
  if (oldPos === null || newPos === null) return null;
  return newPos < oldPos ? "left" : "right";
}
