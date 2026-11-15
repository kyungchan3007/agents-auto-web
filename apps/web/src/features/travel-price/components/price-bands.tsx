"use client";

// 물가 구간 3칸 — 시안(작업 0170 · Figma 04): 흰 카드 3개(싼 곳 울트라마린 테두리 · 비슷한 곳 테두리 없음 · 비싼 곳 주홍 테두리) · 칸마다 나라 2곳 · 나라 이름 + "물가 48 (한국 100)" · 판정 핀은 같은 줄 오른쪽
// 나머지 나라는 "나라 더 보기" 로 펼침 · 핀은 사이트 신호 규칙(최근 90일 백분위) · 신호 · 환율이 없으면 글자 ("신호 없음" · "환율 없음") — 지역 칩 · 막대 · 국기는 시안에 없어 뺌
import type { Signal } from "@hav/shared/signal";
import type { Band } from "@hav/shared/travel";
import { SignalPin } from "@hav/ui/data/signal-pin";
import Link from "next/link";
import { usePriceBands } from "../hooks/use-price-bands";
import type { PriceBand } from "../lib/bands";

const BAND_TITLE: Record<Band, string> = { cheap: "한국보다 싼 곳", similar: "비슷한 곳", pricey: "한국보다 비싼 곳" };
const BAND_CARD: Record<Band, string> = { cheap: "border-2 border-cheap", similar: "", pricey: "border-2 border-expensive-shape" };
const BAND_TEXT: Record<Band, string> = { cheap: "text-cheap", similar: "text-cheap", pricey: "text-expensive" };
const FOLDED = 2;

type Props = { bands: PriceBand[]; signalOf: Record<string, Signal | null>; percentileOf?: Record<string, number | null>; latestYear?: number };

export function PriceBands({ bands, signalOf, percentileOf = {}, latestYear }: Props) {
  const { open, toggle } = usePriceBands();
  const more = bands.reduce((n, b) => n + Math.max(0, b.rows.length - FOLDED), 0);
  return (
    <div data-testid="price-bands">
      <div className="grid items-start gap-4 lg:grid-cols-3">
        {bands.map((b) => (
          <section key={b.id} aria-labelledby={`band-${b.id}`} className={`min-w-0 rounded-card bg-card px-6 py-5 ${BAND_CARD[b.id]}`}>
            <h2 id={`band-${b.id}`} className={`font-display text-[1.625rem] leading-tight font-normal ${BAND_TEXT[b.id]}`}>
              {BAND_TITLE[b.id]}
            </h2>
            <ul className="mt-3 space-y-3">
              {(open ? b.rows : b.rows.slice(0, FOLDED)).map((r) => {
                const signal = r.currency ? signalOf[r.currency] : null;
                return (
                  <li key={r.country} className="flex items-center justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block text-[1.125rem] font-semibold text-fg">{r.name}</span>
                      <span className="block text-small text-fg-2">
                        물가 {Math.round(r.relative * 100)} (한국 100){r.year !== latestYear ? ` · ${r.year}년 자료` : ""}
                      </span>
                    </span>
                    {r.currency && signal ? (
                      <Link href={`/currencies/${r.currency}`} aria-label={`${r.name} 통화 상세`} className="shrink-0">
                        <SignalPin signal={signal} percentile={percentileOf[r.currency] ?? null} />
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
        <button type="button" onClick={() => toggle} aria-expanded={open} className="mt-4 text-body text-cheap hover:underline">
          {open ? "나라 접기" : `나라 더 보기 (${more}곳) ›`}
        </button>
      )}
    </div>
  );
}
