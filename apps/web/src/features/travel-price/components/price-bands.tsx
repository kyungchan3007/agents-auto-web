"use client";

// 물가 구간 3칸 — 새 디자인(작업 0220 · 시안 B): 카드 없이 굵은 위 선 · 구간 사이 세로 선 · 나라 줄마다 가는 선 (예전 작업 0170 · Figma 04 흰 카드 3개 · 작업 0212 세 카드 틀을 하나로) · 구분은 제목 색 + 작은 점 · 칸마다 나라 2곳 · 나라 이름 + "물가 48 (한국 100)" · 판정 핀은 같은 줄 오른쪽
// 나머지 나라는 "나라 더 보기" 로 펼침 · 핀은 사이트 신호 규칙(최근 90일 백분위) · 신호 · 환율이 없으면 글자 ("신호 없음" · "환율 없음") — 지역 칩 · 막대 · 국기는 시안에 없어 뺌
import { SectionTitle } from "@hav/ui/text/heading";
import type { Signal } from "@hav/shared/signal";
import type { Band } from "@hav/shared/travel";
import { Flag } from "@hav/ui/data/flag";
import { TRAVEL_COUNTRIES } from "@hav/shared/travel";
import { SignalPin } from "@hav/ui/data/signal-pin";
import { CountUp } from "@hav/ui/motion/count-up";
import Link from "next/link";
import { usePriceBands } from "../hooks/use-price-bands";
import { type PriceBand, rateBadgeText } from "../lib/bands";

const BAND_TITLE: Record<Band, string> = { cheap: "한국보다 싼 곳", similar: "비슷한 곳", pricey: "한국보다 비싼 곳" };
// 세 카드는 같은 틀(흰 바탕 · 같은 테두리) — 구분은 제목 색 + 제목 앞 작은 점 (작업 0212)
const BAND_MARK: Record<Band, string> = { cheap: "bg-cheap", similar: "bg-fg-2", pricey: "bg-expensive-shape" };
const BAND_TEXT: Record<Band, string> = { cheap: "text-cheap", similar: "text-cheap", pricey: "text-expensive" };
const FOLDED = 2;

type Props = { bands: PriceBand[]; signalOf: Record<string, Signal | null>; percentileOf?: Record<string, number | null>; latestYear?: number; /** 걸러 보일 때는 접지 않고 모두 보임 (작업 0193) */ unfolded?: boolean };

export function PriceBands({ bands, signalOf, percentileOf = {}, latestYear, unfolded = false }: Props) {
  const { open: opened, toggle } = usePriceBands();
  const open = opened || unfolded;
  const more = unfolded ? 0 : bands.reduce((n, b) => n + Math.max(0, b.rows.length - FOLDED), 0);
  return (
    <div id="price-bands" data-testid="price-bands" className="scroll-mt-24">
      <div className="grid items-start border-t-[3px] border-fg lg:grid-cols-3 lg:divide-x lg:divide-line">
        {bands.map((b) => (
          <section key={b.id} aria-labelledby={`band-${b.id}`} className="min-w-0 border-b border-line py-5 lg:border-b-0 lg:px-6 lg:first:pl-0 lg:last:pr-0">
            <SectionTitle id={`band-${b.id}`} className={`flex items-center gap-3 text-[1.625rem] leading-tight ${BAND_TEXT[b.id]}`}>
              <span data-testid="band-mark" aria-hidden className={`size-3 shrink-0 rounded-pill ${BAND_MARK[b.id]}`} />
              {BAND_TITLE[b.id]}
            </SectionTitle>
            <ul className="mt-3">
              {(open ? b.rows : b.rows.slice(0, FOLDED)).map((r) => {
                const signal = r.currency ? signalOf[r.currency] : null;
                return (
                  <li key={r.country} className="flex items-center justify-between gap-3 border-b border-line py-3 last:border-b-0">
                    <span className="flex min-w-0 items-center gap-3">
                      <Flag country={TRAVEL_COUNTRIES[r.country]?.flag ?? null} label={`${r.name} 국기`} className="h-4 w-6 shrink-0" />
                      <span className="min-w-0">
                      <span className="block text-[1.125rem] font-semibold text-fg">{r.name}</span>
                      <span className="block text-small text-fg-2">
                        물가 <CountUp value={Math.round(r.relative * 100)} /> (한국 100){r.year !== latestYear ? ` · ${r.year}년 자료` : ""}
                      </span>
                      </span>
                    </span>
                    {r.currency && signal ? (
                      <Link href={`/currencies/${r.currency}`} aria-label={`${r.name} 통화 상세`} className="shrink-0">
                        <SignalPin signal={signal} text={rateBadgeText(signal, percentileOf[r.currency] ?? null)} />
                      </Link>
                    ) : (
                      <span className="shrink-0 text-small text-fg-2">{r.currency && r.currency in signalOf ? "신호 없음" : "환율 없음"}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
      {more > 0 && (
        // 펼친 상태에서는 화면 아래에 붙어 따라옴 (sticky) — 긴 목록 중간에서도 접기를 바로 누름 (작업 0198 · #231)
        //   뒤에 하늘 종이 색 띠를 깔아, 지나가는 나라 줄 글자가 버튼과 겹쳐 보이지 않고 띠 아래로 흐려지며 들어감 (작업 0203)
        <div
          data-testid="fold-bar"
          className={`z-10 flex justify-center ${open ? "sticky bottom-0 -mx-4 mt-0 bg-gradient-to-t from-surface from-60% to-surface/0 px-4 pt-8 pb-4 sm:-mx-8 sm:px-8" : "mt-4"}`}
        >
          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            className="min-h-11 rounded-pill border-2 border-cheap bg-card px-6 text-body font-semibold text-cheap hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cheap"
          >
            {open ? "나라 접기" : `나라 더 보기 (${more}곳) ›`}
          </button>
        </div>
      )}
    </div>
  );
}
