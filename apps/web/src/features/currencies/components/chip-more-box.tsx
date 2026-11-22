"use client";

// 더보기 상자 — 칩 줄 아래에 떠 있는(absolute) 상자 · 고른 통화 모두 · 한 쪽 5개 · 넘으면 ‹ 1 / 2 › 옆으로 미끄러지며 넘김 (작업 0231)
//   옆 검색칸 · 아래 내용을 밀지 않음 · 고르면 닫히고 전환 · Esc · 바깥 누르기로 닫힘 · 움직임 줄이기는 움직임 없이 바로
import { currencyName } from "@hav/shared/currency";
import { CurrencyFlag } from "@hav/ui/data/currency-flag";
import { useBoxDismiss, useBoxPage } from "../hooks/use-chip-box";
import { boxPage } from "../lib/recent-chips";

type Props = { id: string; list: string[]; current: string; onPick: (code: string, el: Element) => void; onClose: () => void };

export function ChipMoreBox({ id, list, current, onPick, onClose }: Props) {
  const { page, dir, go } = useBoxPage();
  const box = useBoxDismiss(onClose);
  const view = boxPage(list, page);
  return (
    <div
      ref={box}
      id={id}
      data-testid="chip-box"
      role="region"
      aria-label="고른 통화 모두"
      className={`absolute top-[calc(100%+4px)] left-0 z-30 w-[min(37.5rem,100%)] rounded-[0.875rem] border-2 border-line bg-card px-4 pt-3.5 pb-3 shadow-ticket [@media(prefers-reduced-motion:no-preference)]:animate-[chip-box-in_.36s_cubic-bezier(.3,.9,.3,1)]`}
    >
      <div className="mb-2.5 flex items-center justify-between text-small text-fg">
        <b>고른 통화 {list.length}개</b>
        <button type="button" aria-label="닫기" onClick={onClose} className="grid size-7 cursor-pointer place-items-center rounded-full text-[1.125rem] text-fg-2 hover:bg-surface-2">
          ×
        </button>
      </div>
      <div key={view.page} className={`flex min-h-10 flex-wrap gap-2 [@media(prefers-reduced-motion:no-preference)]:animate-[chip-slide_.3s_ease-out]`} style={{ "--dx": `${dir * 24}px` } as React.CSSProperties}>
        {view.items.map((code) => (
          <button
            key={code}
            type="button"
            data-testid="chip-box-item"
            data-code={code}
            aria-label={`${currencyName(code)} ${code}`}
            onClick={(e) => onPick(code, e.currentTarget)}
            className={`flex cursor-pointer items-center gap-2 rounded-pill border-2 px-3.5 py-1.5 text-small font-bold transition-colors ${code === current ? "border-pin-ink bg-pin-ink text-foam" : "border-line bg-card text-fg hover:bg-surface-2"}`}
          >
            <CurrencyFlag currency={code} className="h-4 w-6 shrink-0" />
            {code}
          </button>
        ))}
      </div>
      {view.pages > 1 && (
        <div className="mt-3 flex items-center justify-center gap-3 text-[0.8125rem] font-bold text-fg">
          <button type="button" data-testid="chip-box-prev" aria-label="앞 쪽" disabled={view.page === 0} onClick={() => go(view.page - 1, -1)} className="grid size-[1.875rem] cursor-pointer place-items-center rounded-full border-2 border-line text-[1rem] leading-none transition-colors enabled:hover:border-cheap enabled:hover:bg-surface-2 disabled:cursor-default disabled:opacity-35">
            ‹
          </button>
          <span data-testid="chip-box-page">{view.label}</span>
          <button type="button" data-testid="chip-box-next" aria-label="다음 쪽" disabled={view.page >= view.pages - 1} onClick={() => go(view.page + 1, 1)} className="grid size-[1.875rem] cursor-pointer place-items-center rounded-full border-2 border-line text-[1rem] leading-none transition-colors enabled:hover:border-cheap enabled:hover:bg-surface-2 disabled:cursor-default disabled:opacity-35">
            ›
          </button>
        </div>
      )}
    </div>
  );
}
