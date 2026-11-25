// 테두리 버튼 모양의 링크 (작업 0355 · 시안 10-A) — 눈에 띄는 "다음으로 이어 가기" 자리 · 작업 0356 의 "다른 나라 통화 보기" 도 같은 모양 규칙
// 글은 부품이 정하지 않고 받은 것만 그림 · 훅 없음(서버에서 그려도 됨) · 누르는 자리 높이 44px 이상(tap-44 · 작업 0268) · 끝 화살표는 꾸밈
import type { ReactNode } from "react";

/** 테두리 버튼 공통 모양 규칙 — 테두리 · 흰 바탕 · 글자색 · 누르는 자리 44px · 마우스를 올리면 살짝 칠함 (모서리 둥글기 · 안쪽 여백은 쓰는 곳이 정함) — 링크(OutlineLink)와 열기 버튼(통화 상세 "다른 나라 통화 보기")이 같이 씀 */
export const OUTLINE_BOX = "tap-44 border-2 border-line bg-card text-fg hover:bg-surface-2";

export function OutlineLink({ href, children, testId }: { href: string; children: ReactNode; testId?: string }) {
  return (
    <a href={href} data-testid={testId} className={`${OUTLINE_BOX} inline-flex min-h-11 items-center gap-1.5 rounded-pill px-5 py-2.5 text-body font-bold`}>
      {children}
      <span aria-hidden="true">›</span>
    </a>
  );
}
