"use client";

// 흐르는 환율 띠 (작업 0399) — 그리기만 · 항목 · 글은 ticker.ts · 움직임 상태는 use-rate-ticker
//   variant="hero": 홈 hero 캐러셀 맨 아래(바탕은 지금 장) · variant="fixed": 홈 밖 화면 바닥 고정(어두운 유리)
//   같은 줄을 두 번 이어 붙여 끊김 없이 왼쪽으로(복사본은 화면 읽기에서 숨김 · 초점도 받지 않음) · 항목을 누르면 그 통화 상세
import { Flag } from "@hav/ui/data/flag";
import Link from "next/link";
import type { CSSProperties } from "react";
import "./ticker.css";
import { type TickerItem, tickerSeconds } from "./ticker";
import { useRateTicker } from "./use-rate-ticker";

function Items({ items, copy }: { items: TickerItem[]; copy?: boolean }) {
  return (
    <ul className="rt-row" aria-hidden={copy || undefined}>
      {items.map((it) => (
        <li key={it.code}>
          <Link href={it.href} prefetch={false} data-testid={copy ? undefined : "rate-ticker-item"} tabIndex={copy ? -1 : undefined} className="rt-item">
            <span aria-hidden className="rt-flag">
              <Flag country={it.flag} label={it.name} className="h-4 w-6" />
            </span>
            <span className="rt-name">{it.name}</span>
            <b className="rt-amount">{it.amount}</b>
            {it.signal && it.signalText && (
              <span className="rt-sig" data-signal={it.signal}>
                <i aria-hidden />
                {it.signalText}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function RateTicker({ items, date, variant }: { items: TickerItem[]; /** 라벨의 날짜 "11.27" — 없으면 날짜 없이 */ date: string | null; variant: "hero" | "fixed" }) {
  const { run, held, bind } = useRateTicker();
  if (items.length === 0) return null;
  return (
    <section data-testid="rate-ticker" data-variant={variant} data-run={run ? "true" : "false"} data-held={held ? "true" : "false"} data-surface="dark" aria-label="오늘 환율" className="rt" {...bind}>
      <p className="rt-label">
        <i aria-hidden />
        <span>오늘 환율</span>
        {date && <small>· {date} 기준</small>}
      </p>
      <div className="rt-view">
        <div className="rt-track" style={{ "--rt-dur": `${tickerSeconds(items.length)}s` } as CSSProperties}>
          <Items items={items} />
          {run && <Items items={items} copy />}
        </div>
      </div>
    </section>
  );
}
