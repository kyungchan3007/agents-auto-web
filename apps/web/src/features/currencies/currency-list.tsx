"use client";

// 왼쪽 목록 — 찾기 · 지역 · `+ 통화` (누르면 그 통화 주소로 · 목록과 찾은 글자는 페이지를 옮겨도 그대로: 레이아웃에 있음)
// 휴대폰은 위에 가로로 넘기는 줄 · ☆ 를 누르면 즐겨찾기 — 맨 위로 · "즐겨찾기" 묶음 (이 브라우저에만 저장 · 작업 0089)
import { currencyName } from "@hav/shared/currency";
import { SIGNAL_TEXT, signalLabel } from "@hav/ui/signal-badge";
import { Input } from "@hav/ui/field";
import Link from "next/link";
import { CurrencyFlag } from "@hav/ui/currency-flag";
import type { ListItem } from "./list";
import { SORTS, pctText } from "./sort";
import { useCurrencyList } from "./use-currency-list";
import { FilterChip } from "@hav/ui/filter-chip";

export type { ListItem };

export function CurrencyList({ items }: { items: ListItem[] }) {
  const { current, query, setQuery, picked, setRegion, favs, toggleFav, sort, setSort, hasChange, chips, shown } = useCurrencyList(items);

  return (
    <nav aria-label="통화 목록" className="min-w-0">
      <Input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="통화 · 나라 찾기" aria-label="통화 찾기" className="h-11 text-sm" />
      {/* 지역 · 정렬 단추는 줄을 넘겨 다 보이게 — 옆으로 넘기게 두니 320px 에서 "오세아니아" 가 잘렸음 (작업 0111) */}
      <div className="mt-3 flex flex-wrap gap-1.5 text-xs" role="group" aria-label="지역">
        {chips.map((r) => (
          <FilterChip key={r.id} active={picked === r.id} onClick={() => setRegion(r.id)}>
            {r.label}
          </FilterChip>
        ))}
      </div>
      {hasChange && (
        <div className="mt-2 flex flex-wrap gap-1.5 text-xs" role="group" aria-label="정렬">
          {SORTS.map((s) => (
            <FilterChip key={s.id} variant="outline" active={sort === s.id} onClick={() => setSort(s.id)}>
              {s.label}
            </FilterChip>
          ))}
        </div>
      )}
      {/* 스크롤 영역 안쪽 여백 — 칸 테두리가 영역 끝에 붙어 잘려 보였음 (작업 0067) · 휴대폰은 오른쪽 끝을 흐리게 = 옆으로 넘길 수 있음 (작업 0111) */}
      <ul className="mt-3 flex gap-2 overflow-x-auto p-0.5 pb-2 [mask-image:linear-gradient(to_right,black_85%,transparent)] lg:[mask-image:none] lg:max-h-[calc(100svh-14rem)] lg:flex-col lg:overflow-x-visible lg:overflow-y-auto">
        {shown.map((i) => {
          const on = i.currency === current;
          const fav = favs.includes(i.currency);
          return (
            <li key={i.currency} className="flex shrink-0 items-stretch gap-1">
              <Link
                href={`/currencies/${i.currency}`}
                aria-current={on ? "page" : undefined}
                scroll={false}
                className={`flex min-w-0 flex-1 items-center gap-2 rounded-field border px-3 py-2.5 text-sm transition-colors ${on ? "border-accent bg-surface-2 text-fg" : "border-line text-fg-2 hover:border-fg-2 hover:text-fg"}`}
              >
                <span aria-hidden className="text-accent">
                  +
                </span>
                <CurrencyFlag currency={i.currency} className="h-3.5 w-5" />
                <span className="min-w-0 truncate font-semibold">{currencyName(i.currency)}</span>
                <span className="shrink-0 text-xs">{i.currency}</span>
                <span className="ml-auto flex shrink-0 items-baseline gap-2 pl-3 text-xs whitespace-nowrap">
                  {sort !== "region" && i.change != null && (
                    <span className={`font-semibold ${Math.abs(i.change) < 0.05 ? "text-fg" : i.change < 0 ? "text-cheap" : "text-expensive"}`} title="지난 1개월 변화 (원화 기준)">
                      {pctText(i.change)}
                    </span>
                  )}
                  {i.signal && <span className={`font-semibold ${SIGNAL_TEXT[i.signal]}`}>{signalLabel(i.signal)}</span>}
                </span>
              </Link>
              <button
                type="button"
                onClick={() => toggleFav(i.currency)}
                aria-pressed={fav}
                aria-label={`${currencyName(i.currency)} 즐겨찾기${fav ? " 빼기" : ""}`}
                title={fav ? "즐겨찾기 빼기" : "즐겨찾기 — 목록 맨 위로"}
                className={`grid w-9 shrink-0 place-items-center rounded-field text-base transition-colors ${fav ? "text-accent" : "text-fg-2/60 hover:text-fg"}`}
              >
                <span aria-hidden>{fav ? "★" : "☆"}</span>
              </button>
            </li>
          );
        })}
        {shown.length === 0 && <li className="px-3 py-2.5 text-sm text-fg-2">찾는 통화가 없습니다</li>}
      </ul>
    </nav>
  );
}
