"use client";

// 고르면 환율 자리까지 부드럽게 올라간 뒤 그 통화로 전환(작업 0231 · 클라이언트 이동 · 정적 자료) — 고른 표시(aria-current)가 옮겨 감
// 왼쪽 목록 — 시안: "둘러보기" + 통화 줄(코드 · 이름 · 판정 핀) · 줄마다 가는 구분선 · 고른 통화는 흰 카드 (작업 0170)
// 목록은 레이아웃에 있어 통화를 바꿔도 남음 · 휴대폰은 위에서 옆으로 넘기는 줄 — 칸마다 테두리 카드 안에 이름 · 판정 알약을 함께 (작업 0212) · 검색 · 지역 · 정렬 · 즐겨찾기는 시안에 없어 화면에서 뺌 (계산 lib · 훅은 그대로)
import { currencyName } from "@hav/shared/currency";
import { CurrencyFlag } from "@hav/ui/data/currency-flag";
import { SignalPin } from "@hav/ui/data/signal-pin";
import Link from "next/link";
import { currencyListLabel } from "../lib/detail-view";
import type { ListItem } from "../lib/list";
import { useCurrencyList } from "../hooks/use-currency-list";
import { useCurrencyPick } from "../hooks/use-currency-pick";
import { useListFit } from "../hooks/use-list-fit";
import { commitPick } from "./currency-chips";

export type { ListItem };

/** variant: column(왼쪽 세로 목록 · 예전) · grid(맨 아래 가로 전체 카드 격자 · 새 디자인 작업 0219) */
export function CurrencyList({ items, variant = "column" }: { items: ListItem[]; variant?: "column" | "grid" }) {
  const { current, shown } = useCurrencyList(items);
  const listRef = useListFit(shown.length);
  const { pick } = useCurrencyPick(items.map((i) => i.currency), commitPick); // 고르면 환율 자리까지 올라간 뒤 전환 (작업 0231)

  return (
    <nav aria-label="통화 목록" className="min-w-0">
      <ul ref={variant === "grid" ? undefined : listRef} className={variant === "grid" ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-3" : "flex gap-2 overflow-x-auto pb-2 lg:max-h-[calc(100svh-12rem)] lg:flex-col lg:gap-0 lg:overflow-x-visible lg:overflow-y-auto lg:pb-0"}>
        {shown.map((i) => {
          const on = i.currency === current;
          return (
            <li key={i.currency} className={variant === "grid" ? "min-w-0" : "shrink-0 lg:border-b lg:border-fg"}>
              <Link
                href={`/currencies/${i.currency}`}
                aria-current={on ? "page" : undefined}
                aria-label={`${currencyName(i.currency)} ${i.currency}`}
                scroll={false}
                onClick={(e) => void pick(i.currency, e)}
                className={variant === "grid" ? `flex items-center justify-between gap-4 rounded-field border-2 bg-card px-4 py-3 transition-colors hover:bg-surface-2 ${on ? "border-pin-ink" : "border-line"}` : `flex flex-col items-start gap-2 rounded-field border-2 px-3 py-3 transition-colors lg:flex-row lg:items-center lg:justify-between lg:gap-4 ${on ? "border-cheap bg-card lg:border-transparent" : "border-line bg-card hover:bg-surface-2 lg:border-transparent lg:bg-transparent"}`}
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
