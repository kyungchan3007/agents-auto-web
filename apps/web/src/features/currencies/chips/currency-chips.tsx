"use client";

// 국기 칩 줄 — 고른 통화 칩 (작업 0231 · 사용자 요구: 고른 통화는 맨 앞에 붙고 5개까지 + 더보기) · 처음(저장 없음)은 지금 운영 그대로: 자주 보는 통화(홈 도착지 네 통화 + 지금 통화) (작업 0219 · 시안 A)
// 고르면 환율 자리까지 올라간 뒤 맨 앞에 붙고 나머지는 한 칸씩 밀림(6번째로 밀린 칩은 오른쪽으로 빠지며 사라짐) · "더보기 +N" 은 칩 줄 아래 떠 있는 상자(고른 통화 모두 · 한 쪽 5개 · 쪽 넘김)
// 지금 통화는 짙은 알약 + aria-current · 목록 계산은 lib/recent-chips · 저장은 브라우저(use-recent-currencies) · 보기만 해서는 저장하지 않음 · 움직임 줄이기는 prefers-reduced-motion 이면 움직임 없이 바로 (훅이 확인)
import { CurrencyFlag } from "@/shared/rate/currency-flag";
import { currencyName } from "@hav/shared/currency";
import Link from "next/link";
import { useChipRow } from "./use-chip-row";
import { useCurrencyPick } from "../browse/use-currency-pick";
import { commitPick } from "./use-recent-currencies";
import { moreLabel } from "./recent-chips";
import { ChipMoreBox } from "./more-box/chip-more-box";

const CHIP = "tap-44 flex focus-visible:outline-offset-[-4px] items-center gap-2 rounded-pill border-2 px-3.5 py-1.5 text-small font-bold transition-colors";

export function CurrencyChips({ codes }: { codes: string[] }) {
  const { current, row, shown, more, leaving, flip, open, setOpen, ready } = useChipRow(codes);
  const { pick } = useCurrencyPick(codes, commitPick);
  if (row.length === 0) return null;
  const chip = (code: string, leave: boolean) => {
    const on = code === current;
    return (
      <li key={code} ref={flip(code)} data-leaving={leave ? "true" : undefined} className={`shrink-0 ${leave ? "pointer-events-none" : ""}`}>
        <Link
          href={`/currencies/${code}`}
          data-testid="chip"
          data-code={code}
          data-leaving={leave ? "true" : undefined}
          aria-current={on ? "page" : undefined}
          aria-label={`${currencyName(code)} ${code}`}
          scroll={false}
          onClick={(e) => {
            setOpen(false);
            void pick(code, e, e.currentTarget);
          }}
          className={`${CHIP} ${on ? "border-pin-ink bg-pin-ink text-foam [--hav-ring:var(--hav-ring-on-dark)]" : "border-line bg-card text-fg hover:bg-surface-2"}`}
        >
          <CurrencyFlag currency={code} className="h-4 w-6 shrink-0" />
          {code}
        </Link>
      </li>
    );
  };
  return (
    <nav data-testid="currency-chips" data-ready={ready ? "" : undefined} aria-label="자주 보는 통화" className="relative min-w-0">
      <ul className="flex gap-2 overflow-x-auto pb-1 max-sm:-mt-1 max-sm:pt-1">
        {shown.map((code) => chip(code, false))}
        {leaving.map((code) => chip(code, true))}
        {more > 0 && (
          <li className="shrink-0">
            <button
              type="button"
              data-testid="chip-more"
              aria-expanded={open}
              aria-controls="chip-box"
              onClick={() => setOpen((v) => !v)}
              className={`${CHIP} cursor-pointer border-line bg-card whitespace-nowrap text-fg hover:bg-surface-2`}
            >
              {moreLabel(more)}
            </button>
          </li>
        )}
      </ul>
      {open && more > 0 && (
        <ChipMoreBox
          id="chip-box"
          list={row}
          current={current}
          onClose={() => setOpen(false)}
          onPick={(code, el) => {
            setOpen(false);
            void pick(code, undefined, el);
          }}
        />
      )}
    </nav>
  );
}
