"use client";

// 통화 상세 "다른 나라 통화 보기" 상태 (작업 0356 · 0361 1단계) — 이 화면 고유 부분만: 검색 · 고른 통화 · 버튼 국기 · 통화 줄
//   열기 · 닫기 · 모션 A · 뒤 화면 잠금 · 포커스 가두기 · Esc 는 공통 사이드바(@hav/ui hooks/side-panel/use-side-panel)가 함 · 줄 · 글 계산은 more-view.ts (tsx 는 그리기만)
//   자바스크립트가 없으면(하이드레이션 전) hydrated=false → 버튼 자리에 둘러보기로 가는 링크를 그림
import { useSidePanel } from "@hav/ui/hooks/side-panel/use-side-panel";
import { type MouseEvent, useRef, useState, useSyncExternalStore } from "react";
import { useCurrencyPick } from "../browse/use-currency-pick";
import { commitPick } from "../chips/use-recent-currencies";
import { MORE_TITLE, buttonFlags, filterSideRows, moreSubText, pickedSub, preScrollTop, sideRows } from "./more-view";
import { useMoreContext } from "./use-more-context";

const subscribe = () => () => undefined;
/** 브라우저에서 하이드레이션이 끝난 뒤 true (서버 그림 · 하이드레이션 중에는 false) */
const useHydrated = () => useSyncExternalStore(subscribe, () => true, () => false);

export function useCurrencyMore() {
  const { items, date, picked, setPicked } = useMoreContext();
  const hydrated = useHydrated();
  const codes = items.map((i) => i.currency);
  const { pick, current } = useCurrencyPick(codes, commitPick);
  const [query, setQuery] = useState("");
  const btn = useRef<HTMLButtonElement | null>(null);
  const side = useSidePanel({ origin: btn, label: MORE_TITLE, preScroll: preScrollTop });
  const { open, mounted, show, hide, panelRef, backdropRef, onKeyDown } = side;

  const rows = sideRows(items);
  const flags = buttonFlags(rows.map((r) => r.currency), picked); // 표 · 사이드바 목록과 같은 정렬 순서(많이 내린 순)
  const sub = pickedSub(items, picked && codes.includes(picked) ? picked : null) ?? moreSubText(items.length);

  const onOpen = () => {
    if (items.length > 0) show();
  };

  /** 닫기 — 고른 통화가 있으면 그 국기 하나만 버튼으로 돌아감(고른 통화를 먼저 정함) */
  const close = async (code?: string): Promise<void> => {
    if (!open) return;
    if (code) setPicked(code);
    await hide();
    setQuery("");
  };

  /** 통화 줄 — 닫는 움직임 뒤 그 통화로 바뀜(칩 · 목록과 같은 전환) · 새 탭 · 키 조합은 링크 그대로 */
  const onRow = async (code: string, e: MouseEvent) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    await close(code);
    await pick(code);
  };

  return {
    hydrated,
    open,
    mounted,
    flags,
    sub,
    date,
    query,
    setQuery,
    shown: filterSideRows(rows, query).map((r) => ({ ...r, current: r.currency === current })),
    btnRef: btn,
    panelRef,
    backdropRef,
    onOpen,
    onClose: () => void close(),
    onKeyDown,
    onRow,
  };
}
