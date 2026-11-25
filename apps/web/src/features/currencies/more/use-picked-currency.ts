"use client";

// 사이드바에서 고른 통화 — 그 통화 페이지가 열린 동안만 기억 (그 페이지를 떠나면 기본 국기 넷으로 · 새로 고침해도 기본) (작업 0356)
//   고르는 순간 정해지고(닫는 움직임에서 그 국기 하나가 버튼으로 돌아가야 해서) · 그 통화 페이지에 도착한 뒤 다른 통화로 떠나면 지움
import { useEffect, useRef, useState } from "react";
import { useCurrentCode } from "../browse/use-currency-list";

export function usePickedCurrency() {
  const current = useCurrentCode();
  const [picked, setPicked] = useState<string | null>(null);
  const arrived = useRef(false); // 고른 통화 페이지에 도착했는지
  useEffect(() => {
    if (picked === null) {
      arrived.current = false;
    } else if (current === picked) {
      arrived.current = true;
    } else if (arrived.current) {
      arrived.current = false;
      setPicked(null);
    }
  }, [current, picked]);
  return { picked, setPicked };
}
