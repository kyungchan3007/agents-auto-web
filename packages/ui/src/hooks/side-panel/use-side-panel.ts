"use client";

// 사이드바 · 시트 공통 상태 · 움직임 (작업 0361 1단계 · 0356 통화 상세 "다른 나라 통화 보기"에서 꺼냄) — 열기 · 닫기(✕ · 바깥 · Esc) · 모션 · 포커스 가두기 · 뒤 화면 잠금
//   쓰는 화면이 정하는 선택 사항(2단계 여행 물가가 다르게 씀):
//     lock      뒤 화면 스크롤 잠금 켜기(기본) · 끄기
//     backdrop  뒤를 덮는 막을 그림(기본 · 덮기) · 안 그림(본문을 밀어내는 넓은 화면 · 막 없음)
//     origin    늘어날 시작 요소(버튼 · 누른 줄)의 ref — 없으면 옆(넓은 화면) · 아래(좁은 화면)에서 밀려 들어옴 · 닫으면 시작 요소로 돌아가 포커스도 그리로
//     label     시작 요소가 사라지며 잠깐 보일 글
//     preScroll 열 때 목록을 미리 내려 둘 위치 계산(지금 줄이 보이게)
//   패널 안 약속(side-panel-motion): 머리 [data-side-head] · 스크롤 목록 [data-scroll-ok] · 닫기 단추 [data-side-close] · 지금 줄 [aria-current="page"] · 날아갈 조각 [data-fly] ↔ 목록의 제 자리 [data-fly-to]
//   내용 바꾸기(옆으로)는 2단계 · 여기서는 쓰는 화면이 패널 안 children 을 갈아 끼우면 됨
import { useReducedMotion } from "motion/react";
import { type KeyboardEvent, type RefObject, useEffect, useLayoutEffect, useRef, useState } from "react";
import { hideBtn, partsOf, playClose, playOpen, preScroll, settle, showBtn, trapTab } from "../../lib/side-panel/side-panel-motion";
import { useScrollLock } from "./use-scroll-lock";

export type SidePanelOptions = {
  lock?: boolean;
  backdrop?: boolean;
  origin?: RefObject<HTMLElement | null>;
  label?: string;
  preScroll?: (rowTop: number, listHeight: number) => number;
  /** Tab 이 패널 안에서만 돌게(모달) · 기본 true · 뒤를 덮지 않는 사이드바는 false */
  trap?: boolean;
  /** 열린 뒤에도 시작 요소를 계속 보임(기본 false = 패널이 시작 요소를 대신해 숨김) · 뒤를 덮지 않는 사이드바에서 누른 줄이 사라지지 않게 */
  keepOrigin?: boolean;
};

/** 열리는 움직임(0.68초)이 끝난 뒤 */
const OPEN_SETTLE_MS = 720;

const frames = () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

export function useSidePanel({ lock = true, backdrop: withBackdrop = true, origin, label, preScroll: preScrollTop, trap = true, keepOrigin = false }: SidePanelOptions = {}) {
  const reduce = !!useReducedMotion();
  const [open, setOpen] = useState(false); // 열림(닫는 움직임이 시작되면 false)
  const [mounted, setMounted] = useState(false); // 패널이 화면에 있음(닫는 움직임이 끝날 때까지 true)
  const panel = useRef<HTMLElement | null>(null);
  const backdrop = useRef<HTMLDivElement | null>(null);
  const opening = useRef(false); // 열기를 막 눌러 다시 열리지 않게
  const closing = useRef(false); // 닫는 중에 또 닫지 않게
  const refocus = useRef(false); // 닫힌 뒤 포커스를 시작 요소로 돌려야 함

  useScrollLock(lock && mounted);

  const els = () => (panel.current ? { btn: origin?.current ?? null, panel: panel.current, backdrop: backdrop.current, ...partsOf(panel.current) } : null);

  // 열림: 패널이 그려진 직후 — 목록을 미리 내려 두고 · 모션 · 포커스를 안으로
  useLayoutEffect(() => {
    const e = els();
    if (!open || !e) return;
    if (e.list && preScrollTop) preScroll(e.list, preScrollTop);
    if (reduce) {
      if (e.btn && !keepOrigin) hideBtn(e.btn);
    } else {
      playOpen(e, label);
      const btn = e.btn;
      if (keepOrigin && btn) window.setTimeout(() => showBtn(btn), OPEN_SETTLE_MS); // 늘어나는 움직임이 끝나면 다시 보임
    }
    (e.panel.querySelector<HTMLElement>("[data-side-close]") ?? e.panel).focus({ preventScroll: true });
    // 열릴 때 한 번만 — 다른 값이 바뀔 때마다 다시 움직이지 않음
  }, [open, reduce]);

  // 패널이 화면에서 치워진 뒤(그려진 다음)에도 포커스가 시작 요소에 있게 — 포커스를 가진 요소가 사라지면 body 로 가는 것을 막음
  useEffect(() => {
    if (mounted || !refocus.current) return;
    refocus.current = false;
    origin?.current?.focus({ preventScroll: true });
    const t = requestAnimationFrame(() => origin?.current?.focus({ preventScroll: true })); // 브라우저가 사라진 요소의 포커스를 body 로 돌린 뒤에도 한 번 더
    return () => cancelAnimationFrame(t);
  }, [mounted, origin]);

  const show = () => {
    if (opening.current || closing.current || open) return;
    opening.current = true;
    setMounted(true);
    setOpen(true);
    window.setTimeout(() => (opening.current = false), reduce ? 0 : 720);
  };

  /** 닫기 — 닫는 움직임이 끝나면 resolve (그 뒤에 쓰는 화면이 이어서 할 일을 함) */
  const hide = async (): Promise<void> => {
    const e = els();
    if (!open || closing.current) return;
    closing.current = true;
    setOpen(false);
    if (!reduce && e) {
      settle(e); // 열리는 움직임이 끝나기 전에 닫아도 바로 닫는 움직임으로
      await frames(); // 시작 요소(국기 등)가 새로 그려진 뒤에 돌아갈 자리를 잼
      const again = els();
      if (again) await playClose(again);
    } else if (e?.btn) showBtn(e.btn);
    refocus.current = true;
    setMounted(false);
    origin?.current?.focus({ preventScroll: true });
    closing.current = false;
  };

  // Esc 는 문서 전체에서 들음 — 패널 안 글을 눌러 포커스가 body 로 가도 닫힘 (포커스가 안에 있든 없든)
  useEffect(() => {
    if (!open) return;
    const onEsc = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      void hide();
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  });

  /** Tab 이 패널 밖으로 나가지 않게 */
  const onKeyDown = (e: KeyboardEvent) => {
    if (trap && panel.current) trapTab(e, panel.current);
  };

  /** 열린 채 시작 요소를 바꿈(다른 줄을 눌렀을 때) — 이전 것은 다시 보이고 새 것이 시작 요소가 되어 닫으면 그리로 돌아감 */
  const moveOrigin = (next: HTMLElement | null) => {
    const prev = origin?.current ?? null;
    if (prev && prev !== next) showBtn(prev);
    if (origin) origin.current = next;
    if (next && !reduce && !keepOrigin) hideBtn(next);
  };

  return { open, mounted, show, hide, moveOrigin, panelRef: panel, backdropRef: backdrop, onKeyDown, withBackdrop };
}
