"use client";

// /currencies 통화 목록 페이지 맨 아래 "둘러보기" 표 (작업 0365) — 통화 상세에서는 빼고(사이드바 목록이 대신함) 이 페이지에만 그림 · 자료는 틀(browse-layout)이 준 items
import { FadeUpGroup } from "@hav/ui/motion/fade-up";
import { Eyebrow } from "@hav/ui/text/heading";
import { useMoreContext } from "../more/use-more-context";
import { CurrencyTable } from "./currency-table";

export function BrowseList() {
  const { items } = useMoreContext();
  return (
    <FadeUpGroup id="currency-list" data-testid="currency-list" className="mt-[4.5rem] min-w-0 sm:mt-24">
      <Eyebrow data-fu={0}>둘러보기</Eyebrow>
      <div data-fu={3} className="mt-4">
        <CurrencyTable items={items} />
      </div>
    </FadeUpGroup>
  );
}
