"use client";

// 통화 상세 "다른 나라 통화 보기" 버튼 + 오른쪽 사이드바(휴대폰은 아래 시트) (작업 0356 · 시안 10-C · 모션 A · 스크롤 1) — 그리기만
//   버튼: 오른쪽 "실제로 바꿀 때" 카드 아래 · 양끝 · 모서리 둥글기는 그 카드와 같게 · 글 + 국기 겹침(기본 앞 네 통화 · 고르면 그 하나) + ›
//   자바스크립트가 없으면(하이드레이션 전) 같은 모양의 링크 — 맨 아래 둘러보기(#currency-list)로 이동
//   사이드바: 제목 · 기준 날짜 · 안내 · 검색 칸 · 둘러보기 표와 같은 자료 · 같은 순서의 줄(줄 전체가 그 통화로 가는 링크 · 지금 통화는 칠함) · 목록은 overscroll contain
import { OUTLINE_BOX } from "@hav/ui/action/outline-link";
import { Input } from "@hav/ui/form/field";
import Link from "next/link";
import { createPortal } from "react-dom";
import { CurrencyFlag } from "@/shared/rate/currency-flag";
import { SEARCH_EMPTY } from "../search/search-view";
import { MORE_TITLE, SIDE_HINT, SIDE_TITLE } from "./more-view";
import { useCurrencyMore } from "./use-currency-more";

// 테두리 버튼 공통 모양 규칙(OUTLINE_BOX · 0355)에 위 "실제로 바꿀 때" 카드와 같은 모서리 둥글기
const BUTTON = `${OUTLINE_BOX} flex min-h-[4.25rem] w-full items-center justify-between gap-3 rounded-[1.5rem] px-5 py-3.5 text-left`;
const ROW_GRID = "grid grid-cols-[1.75rem_minmax(0,1fr)_auto_4.25rem] items-center gap-x-3";

export function CurrencyMore() {
  const { hydrated, open, mounted, flags, sub, date, query, setQuery, shown, btnRef, panelRef, backdropRef, listRef, headRef, closeRef, onOpen, onClose, onKeyDown, onRow } = useCurrencyMore();
  const body = (
    <>
      <span className="min-w-0">
        <b className="block text-[1.0625rem] font-extrabold text-pin-ink">{MORE_TITLE}</b>
        <span data-testid="currency-more-sub" className="mt-0.5 block text-small text-fg-2">
          {sub}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-2.5">
        <span className="flex pl-1.5">
          {flags.map((code) => (
            <span key={code} data-testid="currency-more-flag" data-currency={code} className="-ml-1.5 block rounded-[3px] ring-2 ring-card">
              <CurrencyFlag currency={code} className="h-[1.125rem] w-[1.625rem] rounded-[3px]" />
            </span>
          ))}
        </span>
        <span aria-hidden className="text-[1.375rem] font-extrabold text-pin-ink">
          ›
        </span>
      </span>
    </>
  );
  return (
    <>
      {hydrated ? (
        <button ref={btnRef} type="button" data-testid="currency-more" data-track="fx_other_open" aria-haspopup="dialog" aria-expanded={open} onClick={onOpen} className={BUTTON}>
          {body}
        </button>
      ) : (
        <a href="#currency-list" data-testid="currency-more" data-track="fx_other_open" className={BUTTON}>
          {body}
        </a>
      )}
      {mounted &&
        createPortal(
          <>
            <div ref={backdropRef} data-testid="currency-backdrop" onClick={onClose} className="fixed inset-0 z-[70] bg-[#0f1432]/45" />
            <aside
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="currency-side-title"
              data-testid="currency-sidebar"
              data-surface="light"
              onKeyDown={onKeyDown}
              tabIndex={-1}
              className="fixed z-[71] flex flex-col outline-none overflow-hidden bg-card text-fg max-sm:inset-x-0 max-sm:bottom-0 max-sm:h-[85dvh] max-sm:rounded-t-[1.5rem] sm:top-0 sm:right-0 sm:h-dvh sm:w-[440px]"
            >
              <div ref={headRef} className="shrink-0 px-5 pt-5 sm:px-6 sm:pt-6">
                <div className="flex items-center justify-between gap-3">
                  <h2 id="currency-side-title" className="text-[1.375rem] font-bold text-fg">
                    {SIDE_TITLE}
                  </h2>
                  <button ref={closeRef} type="button" data-testid="currency-sidebar-close" aria-label="닫기" onClick={onClose} className="tap-44 grid size-11 place-items-center rounded-full border-2 border-line text-fg hover:bg-surface-2">
                    <span aria-hidden>✕</span>
                  </button>
                </div>
                <p className="mt-1 text-small text-fg-2">
                  <span data-testid="currency-side-date">{date ?? "날짜 없음"}</span> 기준
                </p>
                <p data-testid="currency-side-hint" className="mt-1 text-small text-fg-2">
                  {SIDE_HINT}
                </p>
                <div className="mt-3">
                  <Input role="combobox" type="search" autoComplete="off" spellCheck={false} aria-label="통화 검색" aria-autocomplete="list" aria-expanded aria-controls="currency-side-list" placeholder="통화 · 나라 · 도시 검색" value={query} onChange={(e) => setQuery(e.target.value)} className="h-11" />
                </div>
                <div className={`${ROW_GRID} mt-3 border-b-2 border-fg px-2 pb-2 text-[0.8125rem] font-semibold text-fg-2`}>
                  <span />
                  <span>통화</span>
                  <span className="text-right">오늘 환율</span>
                  <span className="text-right">90일 최고보다</span>
                </div>
              </div>
              <ul ref={listRef} id="currency-side-list" data-testid="currency-side-list" data-scroll-ok className="min-h-0 flex-1 overflow-y-auto px-5 pb-4 [overscroll-behavior:contain] sm:px-6">
                {shown.map((r) => (
                  <li key={r.currency}>
                    <Link
                      href={`/currencies/${r.currency}`}
                      scroll={false}
                      data-testid="currency-side-row"
                      data-currency={r.currency}
                      data-track={r.current ? undefined : "fx_other_pick"}
                      data-track-currency={r.currency}
                      aria-current={r.current ? "page" : undefined}
                      onClick={(e) => void onRow(r.currency, e)}
                      className={`${ROW_GRID} rounded-[0.5rem] border-b border-line px-2 py-2.5 hover:bg-surface-2 aria-[current=page]:bg-surface-2`}
                    >
                      <span data-side-flag={r.currency} className="block">
                        <CurrencyFlag currency={r.currency} className="h-[1.1875rem] w-7 rounded-[3px]" />
                      </span>
                      <span data-testid="currency-name" className="min-w-0 truncate font-bold text-fg">
                        {r.name}
                      </span>
                      <span data-testid="currency-rate" className="text-right font-bold whitespace-nowrap text-fg tabular-nums">
                        {r.rate}
                      </span>
                      <span data-testid="currency-drop" className={`text-right text-small font-semibold whitespace-nowrap tabular-nums ${r.drop === null ? "text-fg-2" : "text-fg"}`}>
                        {r.text}
                      </span>
                    </Link>
                  </li>
                ))}
                {shown.length === 0 && <li className="px-2 py-3 text-small text-fg-2">{SEARCH_EMPTY}</li>}
              </ul>
            </aside>
          </>,
          document.body,
        )}
    </>
  );
}
