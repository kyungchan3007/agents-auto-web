// 사이드바 · 바텀 시트 틀 (작업 0361 1단계 · 0356 통화 상세 사이드바에서 꺼냄) — 그리기만: 화면 맨 위(portal)에 막 + 패널 · 넓은 화면(sm 이상)은 오른쪽 440px 전체 높이 · 좁은 화면은 아래 85% 시트
//   상태 · 움직임 · 잠금 · 포커스 가두기 · Esc 는 hooks/side-panel/use-side-panel 이 주고 · 이 틀은 받은 ref · 핸들러를 달기만 함 · 안 내용(머리 · 목록)은 쓰는 화면이 children 으로
//   내용은 [data-side-head] · [data-scroll-ok] · [data-side-close] 표시를 달면 모션 · 잠금 · 초점이 알아봄 (hooks/side-panel/use-side-panel 머리 설명)
import type { CSSProperties, KeyboardEvent, ReactNode, Ref } from "react";
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
  /** 패널 폭(px) · 기본 440 (통화 상세) — 여행 물가는 420 */
  width?: number;
  /** 시트 높이(화면 높이의 %) · 기본 85 (통화 상세) — 여행 물가는 78 */
  sheetHeight?: number;
  /** 모양: auto = 작은 화면(sm 미만)은 시트 · 넓으면 오른쪽 사이드바(통화 상세) · side · sheet = 폭과 상관없이 고정(여행 물가는 1024px 에서 직접 가름) */
  layout?: "auto" | "side" | "sheet";
  /** 뒤를 막는 창인가(aria-modal) · 기본 true · 뒤를 덮지 않는 사이드바는 false */
  modal?: boolean;
  /** 닫힌 채 미리 그리기(작업 0365) · true 면 막 · portal 없이 그 자리에 숨겨서(hidden) 그림 — 서버 첫 그림 HTML 에 내용(링크)이 남고 화면 · 접근성 트리에서는 빠짐 · 열면 false 로 바꿔 portal 로 */
  closed?: boolean;
  children: ReactNode;
};

const LAYOUT = {
  auto: "max-sm:inset-x-0 max-sm:bottom-0 max-sm:h-(--sheet-h) max-sm:rounded-t-[1.5rem] sm:top-0 sm:right-0 sm:h-dvh sm:w-(--side-w)",
  side: "top-0 right-0 h-dvh w-(--side-w)",
  sheet: "inset-x-0 bottom-0 h-(--sheet-h) rounded-t-[1.5rem]",
} as const;

export function SidePanel({ panelRef, backdropRef, onClose, onKeyDown, labelledBy, backdrop = true, testId, backdropTestId, width = 440, sheetHeight = 85, layout = "auto", modal = true, closed = false, children }: Props) {
  if (closed) {
    return (
      <aside hidden data-testid={testId} data-surface="light">
        {children}
      </aside>
    );
  }
  return createPortal(
    <>
      {backdrop && <div ref={backdropRef} data-testid={backdropTestId} onClick={onClose} className="fixed inset-0 z-[70] bg-[#0f1432]/45" />}
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal={modal}
        aria-labelledby={labelledBy}
        data-testid={testId}
        data-surface="light"
        onKeyDown={onKeyDown}
        tabIndex={-1}
        style={{ "--side-w": `${width}px`, "--sheet-h": `${sheetHeight}dvh` } as CSSProperties}
        className={`fixed z-[71] flex flex-col overflow-hidden bg-card text-fg outline-none ${LAYOUT[layout]}`}
      >
        {children}
      </aside>
    </>,
    document.body,
  );
}
