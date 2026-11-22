"use client";

// 검색 예시 상태 (작업 0306) — 입력 · 고른 줄 · 고른 결과 글 · 화살표 · Enter · Esc (사이트 통화 검색과 같은 콤보박스 동작)
import { type KeyboardEvent, useId, useState } from "react";
import { DEMO_CODES, demoSearch } from "./search-demo";

export function useSearchDemo() {
  const uid = useId();
  const [q, setQ] = useState("");
  const [act, setAct] = useState(-1);
  const [picked, setPicked] = useState("");
  const hits = demoSearch(q);
  const listId = `${uid}-list`;
  const optId = (i: number) => `${uid}-o-${i}`;
  const choose = (i: number) => {
    const h = hits[i];
    if (!h) return;
    setPicked(`→ ${h.code} ${h.name} 상세로 이동합니다 (사이트에서는 /currencies/${h.code})`);
    setQ("");
    setAct(-1);
  };
  const type = (v: string) => {
    setQ(v);
    setAct(-1);
    setPicked("");
  };
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (!hits.length) return;
      e.preventDefault();
      setAct((a) => (a + (e.key === "ArrowDown" ? 1 : -1) + hits.length) % hits.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(act >= 0 ? act : 0);
    } else if (e.key === "Escape") type("");
  };
  return { q, type, hits, act, picked, choose, onKeyDown, listId, optId, total: DEMO_CODES.length, empty: q.trim() !== "" && hits.length === 0 };
}
