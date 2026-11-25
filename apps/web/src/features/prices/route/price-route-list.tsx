"use client";

// 여행 물가 "나라별 물가 노선" 휴대폰용 세로 노선 (작업 0283 · 시안 64 A안 + 접기) — 휴대폰 폭(760 이하)에서만 보임 · 넓은 화면은 price-route.tsx 의 가로 노선
//   물가 낮은 나라 → 한국 → 높은 나라(지금 순서 그대로)를 한 줄씩 · 줄을 누르면 그 줄 아래에 하루 예산이 펼쳐지고 다시 누르면 접힘(하나만) · 처음엔 첫 정거장 펼침
//   줄 = 세로 선 위 점 · 국기 · 이름 · 물가 값 · 화살표 / 줄 아래 가는 막대(값 ÷ 120 · 한국 100 자리에 세로 선) / 비행기는 고른 줄의 세로 선 위로(transform)
//   서버 첫 그림 · 자바스크립트 꺼짐: 일곱 줄 이름 · 값이 그대로 보임(첫 줄 펼침) · 값은 자료에서(받지 못한 값은 그리지 않음) · 환율 신호가 없는 나라는 신호 칸을 그리지 않음
import { Flag } from "@hav/ui/data/flag";
import type { Signal } from "@hav/shared/signal";
import { TRAVEL_COUNTRIES } from "@hav/shared/travel";
import type { CSSProperties } from "react";
import { useRouteList } from "./use-route-list";
import { rateBadgeText } from "../bands/bands";
import { OutlineLink } from "@hav/ui/action/outline-link";
import { countryPath } from "../country/country-view";
import { type UiStop, detailText } from "./route-ui";
import { useSideContext } from "../side/use-side-context";
import { barPct, budgetWon, cheaperText, digitCells, gapPct, signalChipTone, wonDigits, yearNote } from "../common/price-text";

type Extra = { currency: string | null; year: number | null };
type Props = { stops: UiStop[]; /** 처음 펼쳐질 줄 번호 */ start?: number; /** 내 여행지 ✕ */ onRemove?: () => void; extras: Record<string, Extra>; signalOf: Record<string, Signal | null>; percentileOf: Record<string, number | null>; latestYear?: number };

/** 값 색 — 한국보다 낮으면 파랑 · 높으면 빨강 · 한국은 남색 */
const colorOf = (v: number) => (v === 100 ? "var(--hav-pin-ink)" : v < 100 ? "var(--hav-pin-cheap)" : "var(--hav-pin-expensive)");
/** 세로 선 색 — 한국 위아래는 한국 값 100 이 낮지 않으므로 빨강 쪽(체험판과 같음) */
const railOf = (v: number) => (v < 100 ? "var(--hav-pin-cheap)" : "var(--hav-pin-expensive)");
/** 막대 길이 기준 — 값 ÷ 120 */
const BAR_MAX = 120;

function Round({ country, name, size }: { country: string; name: string; size: string }) {
  return (
    <span className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-surface-2 ring-1 ring-line ${size}`}>
      <Flag country={TRAVEL_COUNTRIES[country]?.flag ?? (country === "KR" ? "KR" : null)} label={`${name} 국기`} className="h-full w-[150%] max-w-none shrink-0 rounded-none" />
    </span>
  );
}

function Chevron() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-4 shrink-0 text-fg-2 transition-transform duration-[250ms] ease-[cubic-bezier(.3,.9,.3,1)] group-aria-expanded:rotate-180 motion-reduce:transition-none" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function Detail({ stop, on, extra, latestYear, signalOf, percentileOf }: { stop: UiStop; on: boolean; extra: Extra; latestYear?: number; signalOf: Props["signalOf"]; percentileOf: Props["percentileOf"] }) {
  const side = useSideContext(); // 자세히 보기 — 나라 사이드바 · 시트로 열림 (작업 0361)
  const v = stop.value;
  const s = extra.currency ? signalOf[extra.currency] : null;
  const note = yearNote(extra.year, latestYear);
  const tone = s ? signalChipTone(s) : signalChipTone("cheap");
  return (
    <div className="mt-1 mb-4 rounded-[0.875rem] bg-surface-2 p-5 [animation:route-rise_.3s_cubic-bezier(.3,.9,.3,1)] motion-reduce:animate-none">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="m-0 text-[0.8125rem] whitespace-nowrap text-fg-2">물가 (한국 = 100)</p>
          <div role="img" aria-label={`물가 ${v} (한국 100)`} className="mt-2 inline-flex gap-1">
            {digitCells(v).map((c, k) => (
                <span key={k} aria-hidden className="relative isolate grid h-11 w-8 place-items-center rounded-[0.25rem] bg-flap-cell text-[1.375rem] leading-none font-bold text-sun after:absolute after:inset-x-0 after:top-1/2 after:-z-10 after:h-px after:bg-on-band">
                  {c}
                </span>
              ))}
          </div>
        </div>
        <p data-testid="route-row-pct" className="m-0 text-right text-[0.9375rem] font-semibold">
          {v === 100 ? (
            "기준이 되는 나라입니다"
          ) : (
            <>
              한국보다 <b className="text-[1.75rem] leading-none font-bold tabular-nums text-(--c)">{gapPct(v)}%</b> {cheaperText(v)}
            </>
          )}
        </p>
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-3 border-t border-line pt-4">
        <p className="m-0 text-[0.8125rem] text-fg-2">하루 예산 예시</p>
        <p data-testid="route-row-budget" className="m-0 text-[1.75rem] leading-none font-bold tabular-nums text-(--c)">
          약 {wonDigits(budgetWon(v))}
          <small className="ml-0.5 text-[0.9375rem]">원</small>
        </p>
      </div>
      <p className="mt-2 mb-0 text-[0.8125rem] text-fg-2">
        한국에서 하루 100,000원 쓰는 만큼{note}
      </p>
      {on && stop.country !== "KR" && (
        <div className="mt-4">
          <OutlineLink href={countryPath(stop.country)} testId="route-card-detail" onClick={(e) => side?.onLink(stop.country, e)}>
            {detailText(stop.name)}
          </OutlineLink>
        </div>
      )}
      {s && stop.country !== "KR" && (
        <span className={`mt-3 inline-flex items-center rounded-[0.375rem] px-2.5 py-1 text-[0.8125rem] font-semibold ${tone}`}>{rateBadgeText(s, percentileOf[extra.currency ?? ""] ?? null)}</span>
      )}
    </div>
  );
}

export function PriceRouteList({ stops, start = 0, onRemove, extras, signalOf, percentileOf, latestYear }: Props) {
  const { list, open, plane, planeY, toggle } = useRouteList(start);
  const noExtra: Extra = { currency: null, year: null };
  return (
    <div data-testid="route-list" className="relative">
      <ol ref={list} className="relative m-0 list-none p-0">
        {stops.map((s, i) => {
          const on = open === i;
          const color = colorOf(s.value);
          const up = i === 0 ? "transparent" : railOf(stops[i - 1].value);
          const down = i === stops.length - 1 ? "transparent" : railOf(s.value);
          return (
            <li key={s.country} data-testid="route-row-item" data-country={s.country} data-mine={s.mine ? "true" : undefined} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-3" style={{ "--c": color } as CSSProperties}>
              <div aria-hidden className="relative">
                <i className="absolute top-0 left-3.5 h-7 w-1" style={{ background: up }} />
                <i className="absolute top-7 bottom-0 left-3.5 w-1" style={{ background: down }} />
                <span className="absolute top-[1.3125rem] left-[0.5625rem] box-border size-3.5 rounded-full border-[3px] bg-card" style={{ borderColor: color }} />
              </div>
              <div className={`min-w-0 border-b ${i === stops.length - 1 || on ? "border-transparent" : "border-line"}`}>
                <button
                  type="button"
                  data-testid="route-row"
                  data-country={s.country}
                  data-name={s.name}
                  data-value={s.value}
                  aria-expanded={on}
                  aria-controls={`route-more-${s.country}`}
                  onClick={() => toggle(i)}
                  className="group flex min-h-14 w-full cursor-pointer items-center gap-3 border-0 bg-transparent p-0 text-left text-fg [-webkit-tap-highlight-color:transparent]"
                >
                  <Round country={s.country} name={s.name} size="size-7" />
                  <span className={`min-w-0 flex-1 text-[1.125rem] ${on ? "font-bold" : "font-semibold"}`}>
                    {s.name}
                    {s.country === "KR" && <span className="ml-2 rounded-[0.375rem] bg-sun px-2 py-0.5 align-[2px] text-[0.75rem] font-bold">기준</span>}
                  </span>
                  <span className="text-[1.375rem] font-bold tabular-nums text-(--c)">{s.value}</span>
                  <Chevron />
                </button>
                {s.mine && (
                  <div className="mb-2 flex items-center gap-2 pl-10">
                    <b data-testid="route-mine-tag" className="rounded-[0.375rem] bg-sun px-2 py-0.5 text-[0.75rem] font-bold text-fg">
                      내 여행지
                    </b>
                    <button type="button" data-testid="route-mine-remove" aria-label="이 노선에서 빼기" onClick={onRemove} className="tap-44 inline-flex min-h-8 cursor-pointer items-center gap-1 rounded-pill border border-line px-2.5 text-[0.75rem] text-fg-2 hover:bg-surface-2">
                      <span aria-hidden>✕</span> 빼기
                    </button>
                  </div>
                )}
                <div aria-hidden className="relative mb-3 h-1 rounded-[0.125rem] bg-surface-2">
                  <b className={`absolute inset-y-0 left-0 rounded-[0.125rem] bg-(--c) transition-opacity duration-[250ms] motion-reduce:transition-none ${on ? "opacity-100" : "opacity-45"}`} style={{ width: barPct(s.value, BAR_MAX) }} />
                  <u className="absolute -top-[3px] -bottom-[3px] w-0.5 bg-fg no-underline" style={{ left: barPct(100, BAR_MAX) }} />
                </div>
                <div id={`route-more-${s.country}`} hidden={!on}>
                  <Detail stop={s} on={on} extra={extras[s.country] ?? noExtra} latestYear={latestYear} signalOf={signalOf} percentileOf={percentileOf} />
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <span
        data-testid="route-row-plane"
        data-plane={plane}
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 z-[2] grid size-8 place-items-center rounded-full bg-fg shadow-[0_0_0_3px_var(--hav-sun)] transition-transform duration-[450ms] ease-[cubic-bezier(.3,.9,.3,1)] motion-reduce:transition-none"
        style={{ transform: `translateY(${planeY}px)` }}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" className="text-card" fill="currentColor">
          <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" transform="rotate(90 12 12)" />
        </svg>
      </span>
      <p className="mt-3 mb-0 ml-11 text-[0.75rem] text-fg-2">가는 막대의 세로 선이 한국(100)입니다</p>
    </div>
  );
}
