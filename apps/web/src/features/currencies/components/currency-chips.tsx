"use client";

// 국기 칩 줄 — 자주 보는 통화(홈 도착지 네 통화 + 지금 통화)로 바로 가는 칩 (작업 0219 · 시안 A) · 지금 통화는 짙은 알약 + aria-current · 목록 계산은 lib/redesign.chipCodes
import { CurrencyFlag } from "@hav/ui/data/currency-flag";
import { currencyName } from "@hav/shared/currency";
import Link from "next/link";
import { useCurrentCode } from "../hooks/use-currency-list";
import { chipCodes } from "../lib/redesign";

export function CurrencyChips({ codes }: { codes: string[] }) {
  const current = useCurrentCode();
  const chips = chipCodes(current, codes);
  if (chips.length === 0) return null;
  return (
    <nav data-testid="currency-chips" aria-label="자주 보는 통화" className="min-w-0">
      <ul className="flex gap-2 overflow-x-auto pb-1">
        {chips.map((code) => {
          const on = code === current;
          return (
            <li key={code} className="shrink-0">
              <Link
                href={`/currencies/${code}`}
                aria-current={on ? "page" : undefined}
                aria-label={`${currencyName(code)} ${code}`}
                scroll={false}
                className={`flex items-center gap-2 rounded-pill border-2 px-3.5 py-1.5 text-small font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cheap ${on ? "border-pin-ink bg-pin-ink text-foam" : "border-line bg-card text-fg hover:bg-surface-2"}`}
              >
                <CurrencyFlag currency={code} className="h-4 w-6 shrink-0" />
                {code}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
