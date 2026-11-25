"use client";

// 통화 상세 "다른 나라 통화 보기"가 쓰는 공통 자료 · 고른 통화 (작업 0356) — 둘러보기 틀(browse-layout)이 한 번 감싸 통화를 바꿔도(클라이언트 이동) 남음 · 새로 고치면 기본으로(저장하지 않음)
// 목록 자료는 맨 아래 둘러보기 표와 같은 값(items) 그대로 — 상세 페이지가 따로 받지 않음
import type { ReactNode } from "react";
import type { ListItem } from "../browse/list";
import { MoreContext } from "./use-more-context";
import { usePickedCurrency } from "./use-picked-currency";

export function MoreProvider({ items, date, children }: { items: ListItem[]; date: string | null; children: ReactNode }) {
  const { picked, setPicked } = usePickedCurrency();
  return <MoreContext.Provider value={{ items, date, picked, setPicked }}>{children}</MoreContext.Provider>;
}
