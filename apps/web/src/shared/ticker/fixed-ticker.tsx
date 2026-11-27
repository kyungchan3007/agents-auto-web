"use client";

// 홈 밖 모든 화면의 바닥 고정 환율 띠 + 그 높이만큼의 아래 여백 (작업 0399) — 홈("/")은 hero 아래 띠가 따로 있어 그리지 않음
//   여백(rt-spacer)은 처음 그림부터 같이 있어 띠가 붙을 때 · 글꼴이 올 때 페이지가 움직이지 않음 · 바닥 출처 띠 · 마지막 내용을 가리지 않음
import { RateTicker } from "./rate-ticker";
import type { TickerItem } from "./ticker";
import { useFixedTicker } from "./use-fixed-ticker";

export function FixedTicker({ items, date }: { items: TickerItem[]; date: string | null }) {
  const show = useFixedTicker();
  if (!show || items.length === 0) return null;
  return (
    <>
      <div aria-hidden className="rt-spacer" />
      <RateTicker items={items} date={date} variant="fixed" />
    </>
  );
}
