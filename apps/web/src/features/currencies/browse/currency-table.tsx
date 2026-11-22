"use client";

// 통화 "둘러보기" 표 (작업 0260 · 시안 32번 B안) — 카드 22장 격자를 표로: 통화(국기 · 이름 굵게 · 코드 작게) · 오늘 환율 · 90일 최고보다(내린 폭 % · 넓은 화면은 앞에 막대)
//   줄 순서 = 많이 내린 순(rateRows) · 넓은 화면(lg)은 두 단(앞 절반 · 뒤 절반 · 단마다 머리 줄) · 휴대폰은 한 단 · 줄 전체가 그 통화 상세로 가는 링크 · 지금 보는 통화는 aria-current + 줄 표시
//   값은 /signal 이 준 오늘 값 · 90일 최고로만 계산(받지 못했으면 "—" · 지어내지 않음) · "최근 90일 중 하위 N%" 글은 쓰지 않음 · 낭독 이름에 이름 · 환율 · 내린 폭
import { currencyName } from "@hav/shared/currency";
import { CurrencyFlag } from "@hav/ui/data/currency-flag";
import Link from "next/link";
import { currencyListLabel } from "../detail/detail-view";
import type { ListItem } from "./list";
import { type RateRow, rateRows, splitColumns, barWidth } from "./rate-table";
import { useCurrencyList } from "./use-currency-list";
import { useCurrencyPick } from "./use-currency-pick";
import { commitPick } from "../chips/use-recent-currencies";

const BAR_PX = 96;
const GRID = "grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-4 lg:grid-cols-[minmax(0,1fr)_6.5rem_11.5rem]";

function Head({ hiddenOnPhone }: { hiddenOnPhone: boolean }) {
  return (
    <div data-testid="currency-head" className={`${GRID} border-b-2 border-fg pb-2 text-[0.8125rem] font-semibold text-fg-2 ${hiddenOnPhone ? "max-lg:hidden" : ""}`}>
      <span>통화</span>
      <span className="text-right">오늘 환율</span>
      <span className="text-right">90일 최고보다</span>
    </div>
  );
}

export function CurrencyTable({ items }: { items: ListItem[] }) {
  const { current } = useCurrencyList(items);
  const { pick } = useCurrencyPick(items.map((i) => i.currency), commitPick); // 고르면 환율 자리까지 올라간 뒤 전환 (작업 0231)
  const byCode = new Map(items.map((i) => [i.currency, i]));
  const rows = rateRows(items.map((i) => ({ currency: i.currency, latest: i.latest, max: i.max, signal: i.signal })));
  const [first, second] = splitColumns(rows);

  const line = (r: RateRow) => {
    const i = byCode.get(r.currency);
    if (!i) return null;
    const on = r.currency === current;
    const name = currencyListLabel(r.currency, i.unit ?? 1);
    const rate = i.rate ?? "—";
    const drop = typeof r.drop === "number" ? String(r.drop) : r.drop === "top" ? "top" : "none";
    return (
      <li key={r.currency} data-testid="currency-row" data-drop={drop} className="border-b border-line">
        <Link
          href={`/currencies/${r.currency}`}
          aria-current={on ? "page" : undefined}
          aria-label={`${name} ${r.currency} ${rate} · 90일 최고보다 ${r.text}`}
          scroll={false}
          onClick={(e) => void pick(r.currency, e)}
          className={`${GRID} py-[0.6875rem] transition-colors hover:bg-surface-2 aria-[current=page]:bg-surface-2 aria-[current=page]:shadow-[inset_3px_0_0_var(--hav-pin-ink)] aria-[current=page]:[&>span:first-child]:pl-3`}
        >
          <span className="flex min-w-0 items-center gap-3">
            <CurrencyFlag currency={r.currency} className="h-4 w-6 shrink-0" />
            <span className="min-w-0 truncate">
              <span data-testid="currency-name" className="font-bold text-fg">{name}</span>
              <span data-testid="currency-code" className="ml-2 hidden text-small text-fg-2 lg:inline">{r.currency}</span>
            </span>
          </span>
          <span data-testid="currency-rate" className="text-right font-bold whitespace-nowrap text-fg tabular-nums">{rate}</span>
          <span className="flex items-center justify-end gap-3">
            <span aria-hidden className="hidden h-1.5 lg:block" style={{ width: BAR_PX }}>
              <span data-testid="currency-bar" className="block h-full rounded-pill bg-pin-cheap" style={{ width: barWidth(r.bar, BAR_PX) }} />
            </span>
            <span data-testid="currency-drop" className={`w-[4.25rem] text-right text-small font-semibold whitespace-nowrap tabular-nums ${r.drop === null ? "text-fg-2" : "text-fg"}`}>{r.text}</span>
          </span>
        </Link>
      </li>
    );
  };

  return (
    <nav aria-label="통화 목록" className="min-w-0">
      <div className="grid gap-x-12 lg:grid-cols-2">
        {[first, second].map((col, k) => (
          <div key={k} data-testid="currency-col" className="min-w-0">
            <Head hiddenOnPhone={k === 1} />
            <ul>{col.map(line)}</ul>
          </div>
        ))}
      </div>
      {rows.length === 0 && <p className="px-3 py-2.5 text-sm text-fg-2">찾는 통화가 없습니다</p>}
    </nav>
  );
}
