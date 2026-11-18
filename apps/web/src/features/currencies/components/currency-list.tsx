"use client";

// 왼쪽 목록 — 시안: "둘러보기" + 통화 줄(코드 · 이름 · 판정 핀) · 줄마다 가는 구분선 · 고른 통화는 흰 카드 (작업 0170)
// 목록은 레이아웃에 있어 통화를 바꿔도 남음 · 휴대폰은 위에서 옆으로 넘기는 줄 — 칸마다 테두리 카드 안에 이름 · 판정 알약을 함께 (작업 0212) · 검색 · 지역 · 정렬 · 즐겨찾기는 시안에 없어 화면에서 뺌 (계산 lib · 훅은 그대로)
import { currencyName } from "@hav/shared/currency";
import { CurrencyFlag } from "@hav/ui/data/currency-flag";
import { SignalPin } from "@hav/ui/data/signal-pin";
import Link from "next/link";
import { currencyListLabel } from "../lib/detail-view";
import type { ListItem } from "../lib/list";
import { useCurrencyList } from "../hooks/use-currency-list";
import { useListFit } from "../hooks/use-list-fit";

export type { ListItem };

export function CurrencyList({ items }: { items: ListItem[] }) {
  const { current, shown } = useCurrencyList(items);
  const listRef = useListFit(shown.length);

  return (
    <nav aria-label="통화 목록" className="min-w-0">
      <ul ref={listRef} className="flex gap-2 overflow-x-auto pb-2 lg:max-h-[calc(100svh-12rem)] lg:flex-col lg:gap-0 lg:overflow-x-visible lg:overflow-y-auto lg:pb-0">
        {shown.map((i) => {
          const on = i.currency === current;
          return (
            <li key={i.currency} className="shrink-0 lg:border-b lg:border-fg">
              <Link
                href={`/currencies/${i.currency}`}
                aria-current={on ? "page" : undefined}
                aria-label={`${currencyName(i.currency)} ${i.currency}`}
                scroll={false}
                className={`flex flex-col items-start gap-2 rounded-field border-2 px-3 py-3 transition-colors lg:flex-row lg:items-center lg:justify-between lg:gap-4 ${on ? "border-cheap bg-card lg:border-transparent" : "border-line bg-card hover:bg-surface-2 lg:border-transparent lg:bg-transparent"}`}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <CurrencyFlag currency={i.currency} className="h-4 w-6 shrink-0" />
                  <span className="min-w-0">
                  <span className={`block text-body font-semibold ${on ? "text-fg" : "text-cheap"}`}>{i.currency}</span>
                  <span className="block truncate text-small text-fg-2">{currencyListLabel(i.currency, i.unit ?? 1)}</span>
                  </span>
                </span>
                {i.signal && <SignalPin signal={i.signal} percentile={i.percentile ?? null} />}
              </Link>
            </li>
          );
        })}
        {shown.length === 0 && <li className="px-3 py-2.5 text-sm text-fg-2">찾는 통화가 없습니다</li>}
      </ul>
    </nav>
  );
}
