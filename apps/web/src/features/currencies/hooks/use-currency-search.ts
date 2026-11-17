"use client";

// 통화 검색 상태 — 입력 · 열림 · 활성 줄 · 키보드 (WAI-ARIA 콤보박스 · 계산은 @hav/shared/currency-search) (작업 0192)
import { type CurrencyHit, searchCurrencies } from "@hav/shared/currency-search";
import { useRouter } from "next/navigation";
import { type ChangeEvent, type KeyboardEvent, useId, useState } from "react";
import { SEARCH_LIMIT } from "../lib/search-view";

export function useCurrencySearch(codes: string[]) {
  const router = useRouter();
  const uid = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const hits: CurrencyHit[] = open ? searchCurrencies(query, codes, SEARCH_LIMIT) : [];
  const expanded = hits.length > 0;
  const empty = open && query.trim() !== "" && hits.length === 0;
  const listId = `${uid}-list`;
  const optionId = (i: number) => `${uid}-opt-${i}`;

  const close = () => {
    setOpen(false);
    setActive(-1);
  };
  const choose = (code: string) => {
    setQuery("");
    close();
    router.push(`/currencies/${code}`);
  };
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setOpen(true);
    setActive(-1);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (!expanded) {
        if (query.trim() !== "") setOpen(true);
        return;
      }
      e.preventDefault();
      const n = hits.length;
      setActive(e.key === "ArrowDown" ? (active + 1) % n : (active - 1 + n) % n);
    } else if (e.key === "Enter") {
      const hit = hits[active] ?? hits[0];
      if (!hit) return;
      e.preventDefault();
      choose(hit.code);
    } else if (e.key === "Escape" && (open || query !== "")) {
      e.preventDefault();
      close();
    }
  };

  return {
    query,
    hits,
    expanded,
    empty,
    active,
    listId,
    optionId,
    activeId: expanded && active >= 0 ? optionId(active) : undefined,
    choose,
    close,
    onChange,
    onKeyDown,
    onFocus: () => setOpen(query.trim() !== ""),
    setActive,
  };
}
