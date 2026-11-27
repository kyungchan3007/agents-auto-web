// hero 캐러셀 순수 계산 (작업 0385) — 장 순서 · 장별 시간 · 다음/이전 · 밀기 판정 · 남은 시간 · 그리기는 hero-carousel.tsx · 상태는 use-hero-carousel.ts
export type SlideId = "bf" | "sea";

/** 장 순서 — 처음 열리면 첫 장(블랙프라이데이) */
export const SLIDES: readonly SlideId[] = ["bf", "sea"];

/** 자동 넘김 장별 시간(ms) — 블프 9초 · 여행 타이밍 7초 */
export const SLIDE_MS: Record<SlideId, number> = { bf: 9000, sea: 7000 };

/** 옆으로 밀기 최소 거리(px) */
export const SWIPE_MIN = 50;

/** 알약 · 접근성 이름에 쓰는 장 이름 */
export const SLIDE_LABEL: Record<SlideId, string> = { bf: "블랙프라이데이", sea: "여행 타이밍" };

export const slideMs = (id: SlideId): number => SLIDE_MS[id];

const at = (id: SlideId, step: number): SlideId => SLIDES[(SLIDES.indexOf(id) + step + SLIDES.length) % SLIDES.length];

/** 다음 장 — 마지막 다음은 처음 */
export const nextSlide = (id: SlideId): SlideId => at(id, 1);

/** 이전 장 — 처음 이전은 마지막 */
export const prevSlide = (id: SlideId): SlideId => at(id, -1);

/** dx = 끝 x − 시작 x · 왼쪽으로 밂(≤ −50) = 다음 · 오른쪽으로 밂(≥ 50) = 이전 · 그 사이는 넘기지 않음 */
export function swipeDirection(dx: number): "next" | "prev" | null {
  if (dx <= -SWIPE_MIN) return "next";
  if (dx >= SWIPE_MIN) return "prev";
  return null;
}

/** 장 시간에서 지나간 시간을 뺀 남은 시간 — 0 ~ 장 시간으로 자름(마우스 멈춤 뒤 남은 시간부터 이어가려고) */
export const remainingMs = (id: SlideId, elapsedMs: number): number => Math.min(SLIDE_MS[id], Math.max(0, SLIDE_MS[id] - elapsedMs));

/** 입력 · 고르기 칸인가 — 여기에 초점이 가거나 값이 들어가면 자동 넘김을 끔 */
export const isEntryField = (tag: string): boolean => ["INPUT", "SELECT", "TEXTAREA"].includes(tag.toUpperCase());
