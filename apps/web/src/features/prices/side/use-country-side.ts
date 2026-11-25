"use client";

// 여행 물가 나라 사이드바 · 시트 상태 (작업 0361 2단계) — 지금 나라 · 목록 순서 · ‹ › · 바뀌는 방향
//   열기 · 닫기 · 모션 A · 포커스 · Esc · 잠금은 공통 부품(@hav/ui hooks/side-panel/use-side-panel) · 1024px 이상은 사이드바(막 없음 · 잠금 없음 · 본문을 밀어냄) · 미만은 시트(막 · 잠금)
//   연 채로 다른 나라 · ‹ › 를 누르면 닫히지 않고 내용만 옆으로 바뀜 · 닫으면 마지막으로 연 나라 링크로 돌아가 포커스
import { countryPath } from "@hav/shared/travel";
import { useSidePanel } from "@hav/ui/hooks/side-panel/use-side-panel";
import { type MouseEvent, useRef, useState } from "react";
import { type SideEntry, SHEET_HEIGHT_PCT, SIDE_WIDTH, neighbors, posText, swapDir } from "./side-view";
import { useSideMode } from "./use-side-mode";

/** 목록에 그려진 그 나라의 링크 (‹ › 로 옮겨 가도 닫을 때 그 줄로 돌아가게) */
const linkOf = (code: string): HTMLElement | null => document.querySelector<HTMLElement>(`[data-testid="price-band-link"][href="${countryPath(code)}"]`);

export function useCountrySide(entries: SideEntry[]) {
  const mode = useSideMode();
  const origin = useRef<HTMLElement | null>(null);
  const side = useSidePanel({ origin, lock: mode.lock, backdrop: mode.backdrop, trap: mode.kind === "sheet", keepOrigin: mode.kind === "side" });
  const [code, setCode] = useState<string | null>(null);
  const [order, setOrder] = useState<string[]>([]);
  const [dir, setDir] = useState<1 | -1>(1);
  const [swaps, setSwaps] = useState(0);
  const byCode = Object.fromEntries(entries.map((e) => [e.code, e]));
  const entry = code ? (byCode[code] ?? null) : null;
  const near = code ? neighbors(order, code) : { index: -1, prev: null, next: null };

  const switchTo = (to: string, el: HTMLElement | null) => {
    if (code) setDir(swapDir(order, code, to));
    setCode(to);
    setSwaps((n) => n + 1);
    side.moveOrigin(el);
  };

  return {
    mode,
    entry,
    mounted: side.mounted,
    open: side.open,
    pushed: side.open && mode.kind === "side", // 본문을 밀어냄
    swaps,
    dir,
    width: SIDE_WIDTH,
    sheetHeight: SHEET_HEIGHT_PCT,
    pos: code ? posText(order, code) : "",
    prev: near.prev,
    next: near.next,
    panelRef: side.panelRef,
    backdropRef: side.backdropRef,
    onKeyDown: side.onKeyDown,
    onClose: () => void side.hide(),
    onLink: (c: string, e: MouseEvent<HTMLElement>, ord: string[]) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || !(c in byCode)) return; // 새 탭 · 키 조합 · 내용이 없는 나라는 링크 그대로
      e.preventDefault();
      const el = e.currentTarget;
      if (side.mounted && !side.open) return; // 닫는 중
      if (side.open) return switchTo(c, el);
      origin.current = el;
      setOrder(ord);
      setCode(c);
      setDir(1);
      side.show();
    },
    go: (c: string | null) => {
      if (c && c in byCode) switchTo(c, linkOf(c));
    },
  };
}
