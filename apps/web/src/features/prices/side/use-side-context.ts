"use client";

// 목록의 나라 링크가 사이드바를 여는 통로 (작업 0361 2단계) — 제공자(side-provider) 안에서만 값이 있음 · 밖에서는 null(링크 그대로 나라 페이지로)
import { type MouseEvent, createContext, useContext } from "react";

export type SideCtx = {
  /** 목록 나라 링크를 눌렀을 때 — 그냥 왼쪽 클릭이고 이 나라의 내용이 있으면 링크 이동을 막고 사이드바 · 시트를 엶(이미 열려 있으면 내용만 바꿈) · 새 탭 · 키 조합 · 내용이 없는 나라는 링크 그대로 · order = 지금 목록 순서(‹ › · n / 전체) */
  onLink: (code: string, e: MouseEvent<HTMLElement>, order: string[]) => void;
};

export const SideContext = createContext<SideCtx | null>(null);

export const useSideContext = (): SideCtx | null => useContext(SideContext);
