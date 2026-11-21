// 3 도착지별 환전 타이밍 — 흰 판 하나(DestinationTable) · 설명 · "다른 통화 N개 모두 보기 ›" (작업 0169 → 0217 시안 A 목록)
// 눈금 · 판정은 사이트 신호 규칙 그대로 (최근 90일 안의 위치 · SIG-01~05) · 신호가 없으면 "신호 없음"
import { FadeUpGroup } from "@hav/ui/motion/fade-up";
import { Eyebrow, SectionTitle } from "@hav/ui/text/heading";
import Link from "next/link";
import type { DestinationRowData } from "../lib/destinations";
import { MORE_CURRENCIES_HREF, moreCurrenciesText } from "../lib/more-currencies";
import { DestinationTable } from "./destination-table";

export function DestinationsSection({ rows, windowDays, moreCount }: { rows: DestinationRowData[]; windowDays: number; moreCount: number | null }) {
  return (
    <section id="today" aria-labelledby="destinations-title" className="scroll-mt-(--hav-nav-h) bg-surface px-4 pt-[4.5rem] pb-[4.5rem] text-fg sm:px-8 sm:pt-24 sm:pb-24">
      <FadeUpGroup className="mx-auto max-w-page">
        <Eyebrow data-fu={0}>오늘 환율</Eyebrow>
        <SectionTitle id="destinations-title" className="mt-3 text-title text-fg" data-fu={1}>도착지별 환전 타이밍</SectionTitle>
        <p data-fu={2} className="mt-3 max-w-3xl text-small text-fg-2">
          가운데 선이 최근 {windowDays}일 중간입니다. 왼쪽일수록 지금 환전이 유리합니다. 예측이 아니며 투자 · 금융 조언이 아닙니다.
        </p>
        <DestinationTable rows={rows} windowDays={windowDays} />
        <Link data-fu={4} href={MORE_CURRENCIES_HREF} data-testid="more-currencies" className="tap-44 mt-6 inline-block border-b-2 border-cheap pb-0.5 text-body font-bold text-cheap hover:text-fg">
          {moreCurrenciesText(moreCount)}
        </Link>
      </FadeUpGroup>
    </section>
  );
}
