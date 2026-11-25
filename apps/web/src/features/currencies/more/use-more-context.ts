"use client";

// "다른 나라 통화 보기"가 쓰는 공통 자료 · 고른 통화를 나르는 컨텍스트 (작업 0356) — 만드는 것 · 읽는 훅만 (그리기는 more-provider.tsx)
import { createContext, useContext } from "react";
import type { ListItem } from "../browse/list";

export type MoreValue = { items: ListItem[]; date: string | null; picked: string | null; setPicked: (code: string | null) => void };

export const MoreContext = createContext<MoreValue>({ items: [], date: null, picked: null, setPicked: () => undefined });

export const useMoreContext = (): MoreValue => useContext(MoreContext);
