"use client";

// 고른 통화 — 사이드바 · 칩 · 검색 어느 쪽으로 바꿔도 마지막 통화 하나 (작업 0356 · 0366) · 그 페이지 흐름 안에서만 기억(새로 고침하면 기본 국기 넷)
//   사이드바는 고르는 순간 정해짐(닫는 움직임에서 그 국기 하나가 버튼으로 돌아가야 해서) · 그 밖(칩 · 검색 · 뒤로 가기)은 통화가 바뀐 순간 그 통화가 고른 통화
import { useState } from "react";
import { useCurrentCode } from "../browse/use-currency-list";

export function usePickedCurrency() {
  const current = useCurrentCode();
  const [picked, setPicked] = useState<string | null>(null);
  const [seen, setSeen] = useState(current); // 지난번에 본 통화 — 처음 들어온 통화는 고른 것이 아님
  if (current !== seen) {
    // 렌더 중 파생 상태: 통화가 바뀐 순간 그 통화가 고른 통화
    setSeen(current);
    if (current) setPicked(current);
  }
  return { picked, setPicked };
}
