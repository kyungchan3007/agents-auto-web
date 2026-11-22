"use client";

// 페이드 업 — 구간이 화면에 들어올 때 한 번, 안에서 data-fu="순서" 를 단 조각들이 0.09초씩 늦게 아래 28px 에서 제자리로 떠오르며 나타남 (작업 0254 · 시안 27번 B안)
//   <FadeUpGroup className="…"> <Eyebrow data-fu={0} /> <h2 data-fu={1} /> <p data-fu={2} /> <div data-fu={3} /> … </FadeUpGroup>
//   순서: 작은 제목(0) → 큰 제목(1) → 설명(2) → 칩 · 단추(3) → 카드 · 표 · 그래프(4)  ·  표시한 조각이 없으면 구간 전체가 한 덩어리로
//   서버 첫 그림은 제자리 (자바스크립트가 못 돌아도 내용이 보임 · 숨겨 두지 않으니 자리 밀림 없음) · 움직임 줄이기면 움직이지 않음 · 끝난 뒤 transform 이 남지 않음 (slide-in.tsx 와 같은 약속)
import type { ReactNode } from "react";
import { useFadeUp } from "../../hooks/motion/use-fade-up";

export const FADE_UP_MS = 700;
export const FADE_UP_STEP_MS = 90;
const DISTANCE = "translateY(28px)";

export function FadeUpGroup({ children, className = "", id, "data-testid": testId = "fade-up" }: { children: ReactNode; className?: string; id?: string; /** 기존 화면 약속을 이어 쓸 때 부르는 쪽이 data-testid 를 그대로 적음 */ "data-testid"?: string }) {
  const ref = useFadeUp({ ms: FADE_UP_MS, stepMs: FADE_UP_STEP_MS, distance: DISTANCE });
  return (
    <div ref={ref} id={id} data-testid={testId} className={className}>
      {children}
    </div>
  );
}
