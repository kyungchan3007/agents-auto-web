// 나라 페이지 첫 면 왼쪽 (작업 0344 · 시안 1-new) — 제목 위 경로 · 큰 제목 · 오늘 기준 한 줄 답 상자 (통화가 없는 나라는 상자 없음)
// 서버가 그림 — 검색 · AI 가 읽는 첫 HTML 에 최종 문장이 들어감
import { EmphText } from "@hav/ui/text/emph";
import Link from "next/link";
import type { CountryView } from "./country-model";

export function CountryHeader({ v }: { v: CountryView }) {
  return (
    <div data-surface="dark" className="text-fg">
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
      {v.oneLine && (
        <div data-testid="country-oneline" className="mt-6 max-w-[40rem] rounded-[1rem] border border-line bg-card px-5 py-4">
          <p className="text-[0.8125rem] text-fg-2">{v.oneLine.label}</p>
          <p className="mt-1 text-[1.125rem] font-bold text-fg sm:text-[1.25rem]">{v.oneLine.text}</p>
          {v.oneLine.note && <p className="mt-1 text-small text-fg-2">{v.oneLine.note}</p>}
        </div>
      )}
    </div>
  );
}
