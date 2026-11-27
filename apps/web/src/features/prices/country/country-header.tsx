"use client";

// 나라 페이지 첫 면 왼쪽 (작업 0344 · 시안 1-new) — 제목 위 경로 · 큰 제목 · 오늘 숫자 요약 칸 (한 줄 답 상자는 작업 0397 에서 지움)
// 큰 제목의 강조(EmphText · 카운트업)가 브라우저 부품이라 'use client' — 서버 첫 그림에도 문장이 그대로 들어감(prices-header.tsx 와 같음)
import { EmphText } from "@hav/ui/text/emph";
import Link from "next/link";
import { FactsCard } from "@/shared/facts/facts-card";
import type { Facts } from "@/shared/facts/facts";
import type { CountryView } from "./country-model";

export function CountryHeader({ v, facts }: { v: CountryView; facts: Facts }) {
  return (
    <div data-surface="dark" className="text-fg lg:flex lg:flex-1 lg:flex-col">
      <nav data-testid="country-crumb" aria-label="경로" className="mb-3 text-small text-fg-2">
        <Link href="/prices" className="underline-offset-2 hover:underline">
          여행 물가
        </Link>
        <span aria-hidden> › </span>
        <span aria-current="page">{v.name}</span>
      </nav>
      <h1 className="font-display text-[clamp(2.25rem,6.2vw,4.5rem)] leading-[1.08] font-extrabold tracking-display text-fg tabular-nums lg:max-w-[7.4em]">
        <EmphText text={v.title} bg="sea" underline countUp />
      </h1>
      <p className="mt-6 max-w-[36em] text-body text-fg-2 sm:text-[1.125rem]">세계은행 {v.year}년 나라별 물가 수준(한국 = 100)과 오늘 그 나라 통화 신호를 함께 봅니다.</p>
      <div aria-hidden className="lg:flex-1" />
      <FactsCard id="country" facts={facts} label={`${v.name} 오늘 숫자`} className="mt-6 lg:max-w-[32.5rem]" />
    </div>
  );
}
