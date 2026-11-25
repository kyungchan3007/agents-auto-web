"use client";

// 통화 상세 "다른 나라 통화 보기" 상태 · 움직임 (작업 0356 · 모션 A + 스크롤 1) — 열기 · 닫기(✕ · 바깥 · Esc · 통화 줄) · 포커스 · 검색 · 고른 통화
//   열고 닫는 움직임은 more-motion.ts · 뒤 화면 잠금은 use-scroll-lock · 줄 · 글 계산은 more-view.ts (tsx 는 그리기만)
//   자바스크립트가 없으면(하이드레이션 전) hydrated=false → 버튼 자리에 둘러보기로 가는 링크를 그림
import { useReducedMotion } from "motion/react";
import { type KeyboardEvent, type MouseEvent, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { useCurrencyPick } from "../browse/use-currency-pick";
import { commitPick } from "../chips/use-recent-currencies";
import { useMoreContext } from "./use-more-context";
import { MORE_TITLE, buttonFlags, filterSideRows, moreSubText, pickedSub, preScrollTop, sideRows } from "./more-view";
import { hideBtn, playClose, playOpen, preScroll, settle, showBtn, trapTab } from "./more-motion";
import { useScrollLock } from "./use-scroll-lock";

const subscribe = () => () => undefined;
/** 브라우저에서 하이드레이션이 끝난 뒤 true (서버 그림 · 하이드레이션 중에는 false) */
const useHydrated = () => useSyncExternalStore(subscribe, () => true, () => false);

const frames = () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

export function useCurrencyMore() {
  const { items, date, picked, setPicked } = useMoreContext();
  const reduce = !!useReducedMotion();
  const hydrated = useHydrated();
  const codes = items.map((i) => i.currency);
  const { pick, current } = useCurrencyPick(codes, commitPick);
  const [open, setOpen] = useState(false); // 열림(닫는 움직임이 시작되면 false)
  const [mounted, setMounted] = useState(false); // 사이드바가 화면에 있음(닫는 움직임이 끝날 때까지 true)
  const [query, setQuery] = useState("");
  const btn = useRef<HTMLButtonElement | null>(null);
  const panel = useRef<HTMLElement | null>(null);
  const backdrop = useRef<HTMLDivElement | null>(null);
  const list = useRef<HTMLUListElement | null>(null);
  const head = useRef<HTMLDivElement | null>(null);
  const closeBtn = useRef<HTMLButtonElement | null>(null);
  const opening = useRef(false); // 열기를 막 눌러 다시 열리지 않게
  const closing = useRef(false); // 닫는 중에 또 닫지 않게
  const refocus = useRef(false); // 닫힌 뒤 포커스를 버튼으로 돌려야 함

  useScrollLock(mounted);

  const rows = sideRows(items);
  const flags = buttonFlags(rows.map((r) => r.currency), picked); // 표 · 사이드바 목록과 같은 정렬 순서(많이 내린 순)
  const sub = pickedSub(items, picked && codes.includes(picked) ? picked : null) ?? moreSubText(items.length);

  // 열림: 사이드바가 그려진 직후 — 목록을 미리 내려 두고 · 모션 A · 포커스를 안으로
  useLayoutEffect(() => {
    if (!open || !panel.current || !list.current || !btn.current || !backdrop.current || !head.current) return;
    preScroll(list.current, preScrollTop);
    if (reduce) hideBtn(btn.current);
    else playOpen({ btn: btn.current, panel: panel.current, backdrop: backdrop.current, list: list.current, head: head.current }, MORE_TITLE);
    closeBtn.current?.focus({ preventScroll: true });
  }, [open, reduce]);

  // 사이드바가 화면에서 치워진 뒤(그려진 다음)에도 포커스가 버튼에 있게 — 포커스를 가진 요소가 사라지면 body 로 가는 것을 막음
  useEffect(() => {
    if (mounted || !refocus.current) return;
    refocus.current = false;
    btn.current?.focus({ preventScroll: true });
    const t = requestAnimationFrame(() => btn.current?.focus({ preventScroll: true })); // 브라우저가 사라진 요소의 포커스를 body 로 돌린 뒤에도 한 번 더
    return () => cancelAnimationFrame(t);
  }, [mounted]);

  const onOpen = () => {
    if (opening.current || closing.current || open || items.length === 0) return;
    opening.current = true;
    setMounted(true);
    setOpen(true);
    window.setTimeout(() => (opening.current = false), reduce ? 0 : 720);
  };

  /** 닫기 — 고른 통화가 있으면 그 국기 하나만 버튼으로 돌아감(고른 통화를 먼저 정함) */
  const close = async (code?: string): Promise<void> => {
    if (!open || closing.current) return;
    closing.current = true;
    setOpen(false);
    if (code) setPicked(code);
    if (!reduce && panel.current && btn.current && backdrop.current && list.current && head.current) {
      const els = { btn: btn.current, panel: panel.current, backdrop: backdrop.current, list: list.current, head: head.current };
      settle(els); // 열리는 움직임이 끝나기 전에 닫아도 바로 닫는 움직임으로
      await frames(); // 버튼 국기가 새로 그려진 뒤에 돌아갈 자리를 잼
      await playClose(els);
    } else if (btn.current) showBtn(btn.current);
    refocus.current = true;
    setMounted(false);
    setQuery("");
    btn.current?.focus({ preventScroll: true });
    closing.current = false;
  };

  // Esc 는 문서 전체에서 들음 — 사이드바 안 글을 눌러 포커스가 body 로 가도 닫힘 (포커스가 안에 있든 없든)
  useEffect(() => {
    if (!open) return;
    const onEsc = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      void close();
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  });

  /** Tab 이 사이드바 밖으로 나가지 않게 */
  const onKeyDown = (e: KeyboardEvent) => {
    if (panel.current) trapTab(e, panel.current);
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
    panelRef: panel,
    backdropRef: backdrop,
    listRef: list,
    headRef: head,
    closeRef: closeBtn,
    onOpen,
    onClose: () => void close(),
    onKeyDown,
    onRow,
  };
}
