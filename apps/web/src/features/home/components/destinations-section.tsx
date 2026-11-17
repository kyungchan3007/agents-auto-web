// 3 도착지별 환전 타이밍 — 도착지 줄(0168) 네 줄 · 줄 전체가 그 통화 상세로 (작업 0169)
// 눈금 · 판정은 사이트 신호 규칙 그대로 (최근 90일 안의 위치 · SIG-01~05) · 핀 글은 "쌈 · 보통 · 비쌈" 글자만 · 신호가 없으면 "신호 없음"
import { Flag } from "@hav/ui/data/flag";
import { DestinationRow } from "@hav/ui/data/destination-row";
import { SectionTitle } from "@hav/ui/text/heading";
import Link from "next/link";
import type { DestinationRowData } from "../lib/destinations";
import { MORE_CURRENCIES_HREF, moreCurrenciesText } from "../lib/more-currencies";

export function DestinationsSection({ rows, windowDays, moreCount }: { rows: DestinationRowData[]; windowDays: number; moreCount: number | null }) {
  return (
    <section id="destinations" aria-labelledby="destinations-title" className="bg-surface px-4 pt-6 pb-16 text-fg sm:px-8 sm:pt-8 sm:pb-20">
      <div className="mx-auto max-w-page">
        <SectionTitle id="destinations-title" className="text-title">도착지별 환전 타이밍</SectionTitle>
        <p className="mt-3 max-w-3xl text-small text-fg-2">
          가운데 선이 최근 {windowDays}일 중간입니다. 왼쪽일수록 지금 환전이 유리합니다. 예측이 아니며 투자 · 금융 조언이 아닙니다.
        </p>
        <div className="mt-8 border-b-2 border-line">
          {rows.map((row) => {
            const body = (
              <DestinationRow
                city={
                  <span className="flex items-center gap-3">
                    {row.flag && <Flag country={row.flag} label={row.flagLabel} className="h-5 w-[30px] shrink-0" />}
                    <span className="min-w-0">{row.city}</span>
                  </span>
                }
                currency={
                  <>
                    {row.currencyLabel}
                    {row.note && <span> · {row.note}</span>}
                  </>
                }
                rate={row.rateText}
                signal={row.signal}
                percentile={row.percentile}
                position={row.position}
              />
            );
            return row.href ? (
              <Link key={row.id} href={row.href} className="block hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                {body}
              </Link>
            ) : (
              <div key={row.id}>{body}</div>
            );
          })}
        </div>
        <Link href={MORE_CURRENCIES_HREF} data-testid="more-currencies" className="mt-5 inline-block text-body text-cheap hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
          {moreCurrenciesText(moreCount)}
        </Link>
      </div>
    </section>
  );
}
