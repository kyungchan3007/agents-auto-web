// 사이드바 · 바텀 시트 틀 (작업 0361 1단계 · 0356 통화 상세 사이드바에서 꺼냄) — 그리기만: 화면 맨 위(portal)에 막 + 패널 · 넓은 화면(sm 이상)은 오른쪽 440px 전체 높이 · 좁은 화면은 아래 85% 시트
//   상태 · 움직임 · 잠금 · 포커스 가두기 · Esc 는 hooks/side-panel/use-side-panel 이 주고 · 이 틀은 받은 ref · 핸들러를 달기만 함 · 안 내용(머리 · 목록)은 쓰는 화면이 children 으로
//   내용은 [data-side-head] · [data-scroll-ok] · [data-side-close] 표시를 달면 모션 · 잠금 · 초점이 알아봄 (hooks/side-panel/use-side-panel 머리 설명)
import type { KeyboardEvent, ReactNode, Ref } from "react";
import { createPortal } from "react-dom";

type Props = {
  panelRef: Ref<HTMLElement>;
  backdropRef: Ref<HTMLDivElement>;
  onClose: () => void;
  onKeyDown: (e: KeyboardEvent) => void;
  /** 제목 요소의 id (aria-labelledby) */
  labelledBy: string;
  /** 막을 그림(덮기) · false 면 뒤를 가리지 않음 */
  backdrop?: boolean;
  testId?: string;
  backdropTestId?: string;
  children: ReactNode;
};

export function SidePanel({ panelRef, backdropRef, onClose, onKeyDown, labelledBy, backdrop = true, testId, backdropTestId, children }: Props) {
  return createPortal(
    <>
      {backdrop && <div ref={backdropRef} data-testid={backdropTestId} onClick={onClose} className="fixed inset-0 z-[70] bg-[#0f1432]/45" />}
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        data-testid={testId}
        data-surface="light"
        onKeyDown={onKeyDown}
        tabIndex={-1}
        className="fixed z-[71] flex flex-col outline-none overflow-hidden bg-card text-fg max-sm:inset-x-0 max-sm:bottom-0 max-sm:h-[85dvh] max-sm:rounded-t-[1.5rem] sm:top-0 sm:right-0 sm:h-dvh sm:w-[440px]"
      >
        {children}
      </aside>
    </>,
    document.body,
  );
}
