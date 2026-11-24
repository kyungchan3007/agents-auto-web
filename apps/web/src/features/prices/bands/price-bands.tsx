"use client";

// 물가 구간 3칸 — 새 디자인(작업 0220 · 시안 B): 카드 없이 굵은 위 선 · 구간 사이 세로 선 · 나라 줄마다 가는 선 (예전 작업 0170 · Figma 04 흰 카드 3개 · 작업 0212 세 카드 틀을 하나로) · 구분은 제목 색 + 작은 점 · 칸마다 나라 2곳 · 나라 이름 + "물가 48 (한국 100)" · 판정 핀은 같은 줄 오른쪽
// 나머지 나라는 "나라 더 보기" 로 펼침 · 핀은 사이트 신호 규칙(최근 90일 백분위) · 신호 · 환율이 없으면 글자 ("신호 없음" · "환율 없음") — 지역 칩 · 막대 · 국기는 시안에 없어 뺌
import { FadeUpGroup } from "@hav/ui/motion/fade-up";
import { SectionTitle } from "@hav/ui/text/heading";
import type { Signal } from "@hav/shared/signal";
import type { Band } from "@hav/shared/travel";
import { Flag } from "@hav/ui/data/flag";
import { TRAVEL_COUNTRIES } from "@hav/shared/travel";
import { SignalPin } from "@/shared/signal/signal-pin";
import { CountUp } from "@hav/ui/motion/count-up";
import Link from "next/link";
import { countryPath } from "../country/country-view";
import { usePriceBands } from "./use-price-bands";
import { type PriceBand, rateBadgeText } from "./bands";
import { relativePct, yearNote } from "../common/price-text";
import { allRows, hiddenCount, shownRows } from "./bands";

const BAND_TITLE: Record<Band, string> = { cheap: "한국보다 싼 곳", similar: "비슷한 곳", pricey: "한국보다 비싼 곳" };
// 세 카드는 같은 틀(흰 바탕 · 같은 테두리) — 구분은 제목 색 + 제목 앞 작은 점 (작업 0212)
const BAND_MARK: Record<Band, string> = { cheap: "bg-cheap", similar: "bg-fg-2", pricey: "bg-expensive-shape" };
const BAND_TEXT: Record<Band, string> = { cheap: "text-cheap", similar: "text-cheap", pricey: "text-expensive" };
const FOLDED = 2;

type Props = { bands: PriceBand[]; signalOf: Record<string, Signal | null>; percentileOf?: Record<string, number | null>; latestYear?: number; /** 걸러 보일 때는 접지 않고 모두 보임 (작업 0193) */ unfolded?: boolean };

type Row = PriceBand["rows"][number];

/** 나라 한 줄 — 국기 · 이름 · 물가 · 판정 핀 (묶음 목록 · 펼친 한 목록이 같이 씀) */
function CountryRow({ r, signalOf, percentileOf, latestYear }: { r: Row; signalOf: Props["signalOf"]; percentileOf: Record<string, number | null>; latestYear?: number }) {
  const signal = r.currency ? signalOf[r.currency] : null;
  return (
    <li className="flex break-inside-avoid items-center justify-between gap-3 border-b border-line py-3">
      <span className="flex min-w-0 items-center gap-3">
        <Flag country={TRAVEL_COUNTRIES[r.country]?.flag ?? null} label={`${r.name} 국기`} className="h-4 w-6 shrink-0" />
        <span className="min-w-0">
          <Link data-testid="price-band-link" href={countryPath(r.country)} className="tap-44 block text-[1.125rem] font-semibold text-fg hover:underline">
            {r.name}
          </Link>
          <span className="block text-small text-fg-2">
            물가 <CountUp value={relativePct(r.relative)} /> (한국 100){yearNote(r.year, latestYear)}
          </span>
        </span>
      </span>
      {r.currency && signal ? (
        <Link href={`/currencies/${r.currency}`} aria-label={`${r.name} 통화 상세`} className="tap-44 shrink-0 hover:[&>span]:underline">
          <SignalPin signal={signal} text={rateBadgeText(signal, percentileOf[r.currency] ?? null)} />
        </Link>
      ) : (
        r.currency && r.currency in signalOf ? <span className="shrink-0 text-small text-fg-2">신호 없음</span> : null
      )}
    </li>
  );
}

export function PriceBands({ bands, signalOf, percentileOf = {}, latestYear, unfolded = false }: Props) {
  const { open: opened, toggle } = usePriceBands();
  const open = opened || unfolded;
  const merged = opened && !unfolded; // 펼친 상태(처음 화면의 접힌 세 칸은 그대로) = 세 묶음을 물가 낮은 순 한 목록으로 합쳐 세 단으로 흘림 (작업 0248 · 4번)
  const more = unfolded ? 0 : hiddenCount(bands, FOLDED);
  return (
    <FadeUpGroup id="price-bands" data-testid="price-bands" className="scroll-mt-24">
      {merged ? (
        <ul data-testid="price-merged" className="border-t-[3px] border-fg pt-2 lg:columns-3 lg:gap-x-12 lg:[column-rule:1px_solid_var(--hav-line)]">
          {allRows(bands).map((r) => (
            <CountryRow key={r.country} r={r} signalOf={signalOf} percentileOf={percentileOf} latestYear={latestYear} />
          ))}
        </ul>
      ) : (
      <div className="grid items-start border-t-[3px] border-fg lg:grid-cols-3 lg:divide-x lg:divide-line">
        {bands.map((b, bi) => (
          <section key={b.id} data-fu={bi} aria-labelledby={`band-${b.id}`} className="min-w-0 border-b border-line py-5 lg:border-b-0 lg:px-6 lg:first:pl-0 lg:last:pr-0">
            <SectionTitle id={`band-${b.id}`} className={`flex items-center gap-3 text-[1.75rem] leading-tight ${BAND_TEXT[b.id]}`}>
              <span data-testid="band-mark" aria-hidden className={`size-3 shrink-0 rounded-pill ${BAND_MARK[b.id]}`} />
              {BAND_TITLE[b.id]}
            </SectionTitle>
            <ul className="mt-3 [&>li:last-child]:border-b-0">
              {shownRows(b.rows, open, FOLDED).map((r) => (
                <CountryRow key={r.country} r={r} signalOf={signalOf} percentileOf={percentileOf} latestYear={latestYear} />
              ))}
            </ul>
          </section>
        ))}
      </div>
      )}
      {more > 0 && (
        // 펼친 뒤 "나라 접기" 는 한 목록 끝 왼쪽에 둠 — 떠 있지 않아 목록 글자를 덮지 않음 (작업 0248 · 4번 · 예전 sticky 띠는 걷어 냄)
        <div
          data-testid="fold-bar"
          className="z-10 mt-6 flex justify-start"
        >
          {open ? (
            // 펼친 뒤 "나라 접기" 알약 모양은 그대로 (#232 · #240) · 자리만 목록 끝 왼쪽
            <button
              type="button"
              onClick={toggle}
              aria-expanded
              className="min-h-11 rounded-pill border-2 border-cheap bg-card px-6 text-body font-semibold text-cheap hover:bg-surface-2"
            >
              나라 접기
            </button>
          ) : (
            // 닫혀 있을 때는 시안처럼 밑줄 글자 링크 (작업 0220 사용자 지적 · 버튼 상자 · 배경 없음)
            <button
              type="button"
              onClick={toggle}
              aria-expanded={false}
              className="tap-44 border-b-2 border-cheap pb-0.5 text-body font-bold text-cheap hover:text-fg"
            >
              {`나라 더 보기 (${more}곳) ›`}
            </button>
          )}
        </div>
      )}
    </FadeUpGroup>
  );
}
