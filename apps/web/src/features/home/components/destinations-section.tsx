// 3 도착지별 환전 타이밍 — 도착지 줄(0168) 네 줄 · 줄 전체가 그 통화 상세로 (작업 0169)
// 눈금 · 판정은 사이트 신호 규칙 그대로 (최근 90일 안의 위치 · SIG-01~05) · 핀 글은 "쌈 · 보통 · 비쌈" 글자만 · 신호가 없으면 "신호 없음"
import { DestinationRow } from "@hav/ui/data/destination-row";
import { Title } from "@hav/ui/text/heading";
import Link from "next/link";
import type { DestinationRowData } from "../lib/destinations";

export function DestinationsSection({ rows, windowDays }: { rows: DestinationRowData[]; windowDays: number }) {
  return (
    <section id="destinations" aria-labelledby="destinations-title" className="bg-surface px-4 pt-14 pb-20 text-fg sm:px-8 sm:pt-20 sm:pb-28">
      <div className="mx-auto max-w-6xl">
        <Title id="destinations-title">도착지별 환전 타이밍</Title>
        <p className="mt-4 max-w-3xl text-small text-fg-2">
          눈금은 최근 {windowDays}일 안의 위치입니다. 왼쪽일수록 그 기간 중 낮아 지금 환전이 유리하고, 가운데 선은 중간입니다. 앞으로를 예측하지 않으며 투자 · 금융 조언이 아닙니다.
        </p>
        <div className="mt-10 border-b-2 border-line">
          {rows.map((row) => {
            const body = (
              <DestinationRow
                city={row.city}
                currency={
                  <>
                    {row.currencyLabel}
                    {row.rateText && <span className="sm:hidden"> · {row.rateText}</span>}
                    {row.note && <span> · {row.note}</span>}
                  </>
                }
                rate={row.rateText}
                signal={row.signal}
                pct={row.pct}
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
      </div>
    </section>
  );
}
