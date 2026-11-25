// 테두리 버튼 모양의 링크 (작업 0355 · 시안 10-A) — 눈에 띄는 "다음으로 이어 가기" 자리 · 작업 0356 의 "다른 나라 통화 보기" 도 같은 모양 규칙
// 글은 부품이 정하지 않고 받은 것만 그림 · 훅 없음(서버에서 그려도 됨) · 누르는 자리 높이 44px 이상(tap-44 · 작업 0268) · 끝 화살표는 꾸밈
import type { ReactNode } from "react";

export function OutlineLink({ href, children, testId }: { href: string; children: ReactNode; testId?: string }) {
  return (
    <a href={href} data-testid={testId} className="tap-44 inline-flex min-h-11 items-center gap-1.5 rounded-pill border-2 border-line bg-card px-5 py-2.5 text-body font-bold text-fg hover:bg-surface-2">
      {children}
      <span aria-hidden="true">›</span>
    </a>
  );
}
