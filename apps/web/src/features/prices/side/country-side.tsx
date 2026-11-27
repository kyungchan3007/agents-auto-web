"use client";

// 여행 물가 나라 사이드바 · 시트 내용 (작업 0361 2단계 · 시안 12번) — 그리기만 · 틀 · 모션은 공통 부품(@hav/ui layout/side-panel)
//   머리: 경로 · ✕ · ‹ n / 전체 › / 본문(스크롤): 물가 문장 · 오늘 통화 한 줄 답 · 물가 값 · 하루 예산 예시 · 다음으로 볼 것 · 맨 아래 나라 페이지 링크
//   받지 못한 통화는 한 줄 답 자리에 이유 · 연 채로 다른 나라로 바뀌면 내용만 옆으로(움직임 줄이기는 바로)
import { OutlineLink } from "@hav/ui/action/outline-link";
import { SidePanel } from "@hav/ui/layout/side-panel";
import Link from "next/link";
import type { SideEntry } from "./side-view";
import type { useCountrySide } from "./use-country-side";

const NAV = "tap-44 grid size-11 place-items-center rounded-full border-2 border-line text-[1.25rem] font-bold text-fg hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent";

export function CountrySide({ s, entry }: { s: ReturnType<typeof useCountrySide>; entry: SideEntry }) {
  const swap = s.swaps > 0 ? (s.dir === 1 ? "animate-[side-swap-next_.32s_cubic-bezier(.2,.8,.2,1)] motion-reduce:animate-none" : "animate-[side-swap-prev_.32s_cubic-bezier(.2,.8,.2,1)] motion-reduce:animate-none") : "";
  return (
    <SidePanel
      panelRef={s.panelRef}
      backdropRef={s.backdropRef}
      onClose={s.onClose}
      onKeyDown={s.onKeyDown}
      labelledBy="country-side-title"
      testId="country-sidebar"
      backdropTestId="country-side-backdrop"
      width={s.width}
      sheetHeight={s.sheetHeight}
      layout={s.mode.kind}
      backdrop={s.mode.backdrop}
      modal={s.mode.backdrop}
    >
      <div data-side-head className="shrink-0 px-5 pt-5 sm:px-6 sm:pt-6">
        <div className="flex items-center justify-between gap-3">
          <p data-testid="country-side-crumb" className="text-small text-fg-2">
            {entry.crumb}
          </p>
          <button type="button" data-side-close data-testid="country-side-close" aria-label="닫기" onClick={s.onClose} className={NAV}>
            <span aria-hidden>✕</span>
          </button>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <button type="button" data-testid="country-side-prev" aria-label="앞 나라" disabled={s.prev === null} onClick={() => s.go(s.prev)} className={NAV}>
            <span aria-hidden>‹</span>
          </button>
          <span data-testid="country-side-pos" className="min-w-16 text-center text-small font-semibold tabular-nums text-fg-2">
            {s.pos}
          </span>
          <button type="button" data-testid="country-side-next" aria-label="다음 나라" disabled={s.next === null} onClick={() => s.go(s.next)} className={NAV}>
            <span aria-hidden>›</span>
          </button>
        </div>
      </div>
      <div data-scroll-ok className="min-h-0 flex-1 overflow-y-auto px-5 pt-4 pb-6 [overscroll-behavior:contain] sm:px-6">
        <div key={entry.code} className={swap}>
          <h2 id="country-side-title" data-testid="country-side-title" className="text-[1.375rem] leading-snug font-bold tracking-display text-fg">
            {entry.title}
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[0.8125rem] text-fg-2">물가 (한국 = 100)</p>
              <p data-testid="country-side-value" className="mt-1 text-[2rem] leading-none font-bold tabular-nums text-fg">
                {entry.value}
              </p>
            </div>
            <div>
              <p className="text-[0.8125rem] text-fg-2">하루 예산 예시</p>
              <p data-testid="country-side-budget" className="mt-1 text-[1.375rem] leading-tight font-bold tabular-nums text-fg">
                {entry.budget}
              </p>
            </div>
          </div>
          <h3 className="mt-6 text-small font-bold text-fg">다음으로 볼 것</h3>
          <div className="mt-2 grid gap-3">
            {entry.cards.map((c) => (
              <article key={c.kicker} data-testid="country-side-next-card" className="rounded-[1rem] border border-line bg-card p-4 text-fg">
                <p className="text-[0.75rem] font-bold text-fg-2">{c.kicker}</p>
                <p className="mt-0.5 text-[0.9375rem] font-bold">{c.title}</p>
                <p className="mt-1 text-small text-fg-2">{c.say}</p>
                <Link href={c.href} data-track={c.track} className="tap-44 mt-2 inline-block text-small font-bold text-fg underline-offset-2 hover:underline">
                  {c.link} ›
                </Link>
              </article>
            ))}
          </div>
          <div className="mt-6">
            <OutlineLink href={entry.detailHref} testId="country-side-detail">
              {entry.detailText}
            </OutlineLink>
          </div>
        </div>
      </div>
    </SidePanel>
  );
}
