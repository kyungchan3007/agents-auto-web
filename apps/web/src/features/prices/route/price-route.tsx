"use client";

// 여행 물가 "나라별 물가 노선" — 정적 물가 자 자리에 들어가는 구역 (작업 0230 · 모션 3번 → 작업 0266: 스크롤 고정을 풀고 나라 단추로 고르기) · 바로 아래로 세 칸 목록 · 나라 더 보기 · 뺀 나라 줄이 그대로 이어짐
//   움직이는 모습: 제목 오른쪽(휴대폰은 제목 아래 가로 한 줄)의 나라 단추를 누르면 말(동그라미)이 그 나라 값 위치로 가고 아래 정거장 카드(이름 · 물가 숫자 · 한국과 비교 · 하루 예산 · 환율 신호)가 그 나라로 바뀜 · 스크롤로는 바뀌지 않음
//   정거장 = 지금 정적 자의 핀(구간마다 맨 위 두 나라) + 한국 · 값은 아래 목록의 "물가 N (한국 100)" 과 같음(추가 API 없음 · 지어내지 않음)
//   서버 첫 그림 · 자바스크립트 꺼짐 = 첫 정거장(가장 싼 나라) 카드와 자 · 핀 · 한국 100 꼬리표 · 움직임 줄이기 = 같은 화면에서 움직임 없이 바로 바뀜(모든 카드를 펼친 정적 목록은 없앰)
import { Flag } from "@hav/ui/data/flag";
import Link from "next/link";
import { countryPath } from "../country/country-view";
import type { Signal } from "@hav/shared/signal";
import { TRAVEL_COUNTRIES } from "@hav/shared/travel";
import { SectionTitle } from "@hav/ui/text/heading";
import type { CSSProperties } from "react";
import { useCountTween, usePlaneFlip, usePriceRoute, useRouteTiles } from "./use-price-route";
import { type PriceBand, rateBadgeText } from "../bands/bands";
import { type RouteBand, type RouteStop, routeCardText, routeStops } from "./price-route-view";
import { PriceRouteList } from "./price-route-list";
import { rulerScale, rulerX } from "./ruler";
import { budgetWon, gapPct, signalChipTone, wonDigits, yearOnly } from "../common/price-text";
import { awayStops, cardNumbers, routeExtras, rulerTicks, trackBg, trailWidth } from "./price-route-view";

const COLOR: Record<RouteBand, string> = {
  cheap: "var(--hav-pin-cheap)",
  mid: "color-mix(in srgb, var(--hav-pin-cheap) 72%, var(--hav-card))",
  base: "var(--hav-pin-ink)",
  exp: "var(--hav-pin-expensive)",
};

type Props = { bands: PriceBand[]; signalOf: Record<string, Signal | null>; percentileOf: Record<string, number | null>; latestYear?: number };
type Extra = { currency: string | null; year: number | null };

/** 국기 — 동그라미(말 · 핀) 또는 작은 직사각형 */
function RouteFlag({ country, name, className }: { country: string; name: string; className: string }) {
  return (
    <span className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-surface-2 ring-2 ring-card ${className}`}>
      <Flag country={TRAVEL_COUNTRIES[country]?.flag ?? (country === "KR" ? "KR" : null)} label={`${name} 국기`} className="h-full w-[150%] max-w-none shrink-0 rounded-none" />
    </span>
  );
}

function SignalCell({ stop, extra, signalOf, percentileOf, small }: { stop: RouteStop; extra: Extra; signalOf: Props["signalOf"]; percentileOf: Props["percentileOf"]; small: boolean }) {
  if (stop.country === "KR") return <span className="inline-flex items-center rounded-[6px] bg-sun px-3.5 py-[0.4375rem] text-[0.8125rem] font-bold whitespace-nowrap text-fg">한국 100 기준</span>;
  const s = extra.currency ? signalOf[extra.currency] : null;
  if (!s) return null;
  const tone = signalChipTone(s);
  return (
    <>
      <span className={`inline-flex items-center rounded-[6px] px-3.5 py-[0.4375rem] text-[0.8125rem] font-bold whitespace-nowrap ${tone}`}>{rateBadgeText(s, percentileOf[extra.currency ?? ""] ?? null)}</span>
      {small && <small className="mt-1 block text-[0.75rem] text-fg-2 max-[760px]:hidden">오늘 그 나라 통화 신호</small>}
    </>
  );
}

/** 정거장 카드 아랫줄 — 움직이는 카드는 넓은 화면에서 세 칸 가로 · 휴대폰(760 이하)은 하루 예산을 아랫줄로 */
const ROW = "grid grid-cols-[calc(var(--route-tile-w)*3+0.5rem)_1fr_1.25fr] border-t-2 border-dashed border-line pt-(--route-row-pt) max-[760px]:grid-cols-2 max-[760px]:gap-y-(--route-row-gap) [&>div]:border-l [&>div]:border-line [&>div]:px-8 [&>div:first-child]:border-l-0 [&>div:first-child]:pl-0 max-[760px]:[&>div]:pr-0 max-[760px]:[&>div]:pl-4 max-[760px]:[&>div:first-child]:pl-0 max-[760px]:[&>div:nth-child(3)]:col-span-2 max-[760px]:[&>div:nth-child(3)]:border-t max-[760px]:[&>div:nth-child(3)]:border-l-0 max-[760px]:[&>div:nth-child(3)]:pt-(--route-row-gap) max-[760px]:[&>div:nth-child(3)]:pl-0";
/** 카드 한 장 — 정거장 하나의 모습 (움직이는 카드 · 정적 카드가 같은 틀) */
function Card({ stop, n, extra, latestYear, signalOf, percentileOf, live, swap = 0 }: { swap?: number; stop: RouteStop; n: number; extra: Extra; latestYear?: number; signalOf: Props["signalOf"]; percentileOf: Props["percentileOf"]; live: boolean }) {
  const t = routeCardText(stop, stop.index, n);
  const pctN = useCountTween(gapPct(stop.value));
  const budN = useCountTween(budgetWon(stop.value));
  const tiles = useRouteTiles(t.tiles);
  const shownTiles = live ? tiles : t.tiles.map((ch) => ({ ch, out: false }));
  const { pct: pctNum, bud } = cardNumbers(stop.value, live, pctN, budN);
  const year = yearOnly(extra.year, latestYear);
  return (
    <>
      <div className="flex flex-wrap items-center gap-x-[1.125rem] gap-y-2 max-[760px]:gap-x-3.5">
        <span className="relative size-(--route-flag) flex-none">
          <span key={swap} className={`absolute inset-0 grid ${live && swap > 0 ? "animate-[route-pop_.45s_cubic-bezier(.3,1.5,.5,1)]" : ""} place-items-center overflow-hidden rounded-full bg-surface-2 ring-[3px] ring-card ring-offset-[1px] ring-offset-line`}>
            <Flag country={TRAVEL_COUNTRIES[stop.country]?.flag ?? (stop.country === "KR" ? "KR" : null)} label={`${stop.name} 국기`} className="h-full w-[150%] max-w-none shrink-0 rounded-none" />
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <p data-testid="route-card-meta" className="text-[0.8125rem] text-fg-2 max-[760px]:text-[0.75rem]">
            {t.meta}
            {year && <> · {year}</>}
          </p>
          <p className="h-(--route-name-h) overflow-hidden text-(length:--route-name) leading-[1.2] font-bold tracking-display">
            <span key={swap} data-testid="route-card-name" className={`block ${live && swap > 0 ? "animate-[route-up_.42s_cubic-bezier(.2,.9,.3,1)]" : ""}`}>
              {stop.country === "KR" ? stop.name : (
                <Link data-testid="route-card-link" href={countryPath(stop.country)} className="hover:underline">
                  {stop.name}
                </Link>
              )}
            </span>
          </p>
        </div>
        {(stop.country === "KR" || (extra.currency && signalOf[extra.currency])) && (
          <div data-testid="route-card-signal" className="flex-none text-right max-[760px]:basis-full max-[760px]:pl-[4.375rem] max-[760px]:text-left">
            <SignalCell stop={stop} extra={extra} signalOf={signalOf} percentileOf={percentileOf} small />
          </div>
        )}
      </div>
      <div className={`mt-(--route-row-mt) ${ROW}`}>
        <div>
          <p className="mb-1.5 text-[0.8125rem] text-fg-2">물가 (한국 = 100)</p>
          <div className="flex items-center gap-1">
            <div data-testid="route-card-value" role="img" aria-label={`물가 ${stop.value} (한국 100)`} className="flex items-center gap-1">
              {shownTiles.map((x, k) => (
                <span key={k} aria-hidden="true" className="relative isolate grid h-(--route-tile-h) w-(--route-tile-w) place-items-center rounded-[5px] bg-flap-cell text-(length:--route-tile) leading-none font-bold text-sun [perspective:200px] after:absolute after:inset-x-0 after:top-1/2 after:-z-10 after:h-px after:bg-on-band ">
                  <span className={`block origin-center transition-transform duration-[140ms] ease-in ${x.out ? "[transform:rotateX(90deg)]" : ""} ${x.ch === " " ? "opacity-0" : ""}`}>{x.ch === " " ? "0" : x.ch}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-[0.8125rem] text-fg-2">한국과 비교</p>
          <p data-testid="route-card-pct" className="text-(length:--route-big) leading-[1.1] font-bold tracking-display whitespace-nowrap text-(--c) tabular-nums max-[760px]:whitespace-normal">
            {stop.value === 100 ? (
              <>
                기준<small className="ml-1 text-[1.125rem] tracking-normal max-[760px]:block max-[760px]:text-[0.8125rem]">100,000원 그대로</small>
              </>
            ) : (
              <>
                {pctNum}
                <small className="ml-1 text-[1.125rem] tracking-normal max-[760px]:text-[0.9375rem]">{stop.value < 100 ? "% 저렴합니다" : "% 비쌉니다"}</small>
              </>
            )}
          </p>
        </div>
        <div>
          <p className="mb-1.5 text-[0.8125rem] text-fg-2">하루 예산 예시</p>
          <p data-testid="route-card-budget" className="text-(length:--route-big) leading-[1.1] font-bold tracking-display whitespace-nowrap text-(--c) tabular-nums max-[760px]:whitespace-normal">
            약 {wonDigits(bud)}
            <small className="ml-1 text-[1.125rem] tracking-normal max-[760px]:text-[0.9375rem]">원</small>
          </p>
          <p className="mt-1.5 text-[0.8125rem] text-fg-2 max-[760px]:text-[0.75rem]">한국에서 하루 100,000원 쓰는 만큼 · 물가 비율로 계산</p>
        </div>
      </div>
    </>
  );
}

// mx-px: 감싼 영역이 넘치는 1px 을 잘라 카드 바깥 둘레 선(ring)이 양쪽에서 잘리던 것을 안으로 들여 온전히 보이게 — 왼쪽 굵은 색 띠는 그대로 (작업 0248 · 20번)
const CARD = "relative mx-px overflow-hidden rounded-3xl bg-card px-8 pt-(--route-card-pt) pb-(--route-card-pb) ring-1 ring-line before:absolute before:inset-y-0 before:left-0 before:w-1.5 before:bg-(--c) max-[760px]:rounded-[1.5rem] max-[760px]:px-[1.125rem] max-[760px]:before:w-[5px]";

export function PriceRoute({ bands, signalOf, percentileOf, latestYear }: Props) {
  const stops = routeStops(bands);
  if (stops.length < 2) return null; // 나라가 없으면 노선 없음 (지어내지 않음)
  const extras: Record<string, Extra> = routeExtras(bands);
  return <Route stops={stops} extras={extras} signalOf={signalOf} percentileOf={percentileOf} latestYear={latestYear} />;
}

function Route({ stops, extras, signalOf, percentileOf, latestYear }: { stops: RouteStop[]; extras: Record<string, Extra>; signalOf: Props["signalOf"]; percentileOf: Props["percentileOf"]; latestYear?: number }) {
  const n = stops.length;
  const { armed, active, target, moving, planeValue, dir, swap, sameValue, ruler, vp, goto } = usePriceRoute(stops.map((st) => st.value));
  const scale = rulerScale(stops.map((st) => st.value));
  const x = (v: number) => rulerX(v, scale);
  const noExtra: Extra = { currency: null, year: null };
  const planeX = x(planeValue);
  // 이웃 정거장 값이 같은 이동(스페인 111 ↔ 아랍에미리트 111)은 비행기가 가만히 — 뛰지 않고 · 고리가 다시 퍼지지 않고 · 좌우로 뒤집히지 않음 (작업 0251 ㄴ) · 바뀌는 것은 나라 쪽뿐
  const flipped = usePlaneFlip(dir, sameValue);
  const cur = stops[active] ?? stops[0];
  const nextName = moving ? (stops[target]?.name ?? "") : "";
  const { ticks, labels } = rulerTicks(scale);
  const x0 = x(stops[0].value);
  const x1 = x(stops[n - 1].value);
  return (
    <section data-testid="route-section" aria-label="나라별 물가 노선" className="relative mb-[4.5rem] sm:mb-24">
      <div data-testid="route-stage" className="w-full">
        <div className="mb-(--route-head-mb) flex items-end justify-between gap-6 max-[760px]:flex-col max-[760px]:items-stretch max-[760px]:gap-3">
          <div>
            <SectionTitle data-testid="route-title" className="text-(length:--route-title) leading-[1.125] text-fg">
              나라별 물가 노선
            </SectionTitle>
            <p className="mt-1.5 text-small text-fg-2 max-[760px]:hidden">나라 이름을 누르면 그 나라로 갑니다 · 싼 나라에서 한국을 지나 비싼 나라 순서입니다</p>
            <p className="mt-1.5 hidden text-[0.9375rem] text-fg-2 max-[760px]:block">물가가 낮은 나라부터 차례로 놓았습니다. 나라를 누르면 하루 예산이 펼쳐지고, 다시 누르면 접힙니다</p>
          </div>
          <ol data-testid="route-stops" className="m-0 flex max-[760px]:hidden min-w-0 list-none flex-wrap justify-end gap-1 p-0 max-[760px]:flex-nowrap max-[760px]:justify-start max-[760px]:overflow-x-auto sm:max-[760px]:pb-1 max-sm:-my-2 max-sm:pt-2 max-sm:pb-3">
            {stops.map((s) => (
              <li key={s.country} className="max-[760px]:shrink-0">
                <button
                  type="button"
                  data-testid="route-stop"
                  data-country={s.country}
                  data-value={s.value}
                  data-active={s.index === active ? "true" : "false"}
                  onClick={() => goto(s.index)}
                  className={`tap-44 max-[760px]:focus-visible:outline-offset-[-4px] flex cursor-pointer items-center gap-1.5 rounded-pill border py-[0.3125rem] pr-2.5 pl-1.5 text-[0.8125rem] whitespace-nowrap transition-colors duration-[250ms] ${s.index === active ? "border-fg bg-fg font-bold text-card max-[760px]:[--hav-ring:var(--hav-ring-on-dark)]" : s.index < active ? "border-fg/40 text-fg hover:border-cheap hover:bg-surface-2" : "border-line text-fg-2 hover:border-cheap hover:bg-surface-2"}`}
                >
                  <RouteFlag country={s.country} name={s.name} className="size-4 ring-0" />
                  {s.name}
                </button>
              </li>
            ))}
          </ol>
        </div>
        <div className="hidden max-[760px]:block">
          <PriceRouteList stops={stops} extras={extras} signalOf={signalOf} percentileOf={percentileOf} latestYear={latestYear} />
        </div>
        <div className="max-[760px]:hidden">
        <div ref={vp} className={`relative -mx-2 mt-1 px-2 max-[760px]:mx-[-1rem] max-[760px]:px-0 max-[760px]:overflow-hidden`}>
          <div
            ref={ruler}
            data-testid="route-ruler"
            data-plane-x={planeX}
            className="relative h-(--rh) [--rh:var(--route-rh)] [--tt:var(--route-tt)] max-[760px]:w-[960px]"
          >
            <div className="absolute inset-x-0 top-(--tt) h-[22px] rounded-[0.625rem]" style={{ background: trackBg(scale.lo, scale.hi) }} />
            <div className="absolute inset-x-0 top-[calc(var(--tt)+22px)]">
              {ticks.map((v) => (
                <i key={v} aria-hidden className="absolute top-[-5px] block h-1 w-[1.5px] -translate-x-1/2 bg-card/75" style={{ left: `${x(v)}%` }} />
              ))}
              {labels.map((v) => (
                <b key={v} aria-hidden className="absolute top-2 -translate-x-1/2 text-[0.75rem] font-normal text-fg-2" style={{ left: `${x(v)}%` }}>
                  {v}
                </b>
              ))}
            </div>
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[calc(var(--tt)+30px)] flex justify-between text-[0.75rem] font-bold">
              <span className="text-pin-cheap">← 물가 낮음</span>
              <span className="text-pin-expensive">물가 높음 →</span>
            </div>
            <>
                <div aria-hidden className="absolute top-[calc(var(--tt)+10px)] h-0.5 bg-[repeating-linear-gradient(90deg,color-mix(in_srgb,var(--hav-card)_95%,transparent)_0_6px,transparent_6px_12px)]" style={{ left: `${x0}%`, width: `${x1 - x0}%` }} />
                <div aria-hidden className="absolute top-[calc(var(--tt)+8.5px)] h-[5px] rounded-[0.25rem] bg-card ring-[1.5px] ring-fg/35" style={{ left: `${x0}%`, width: trailWidth(x0, planeX) }} />
            </>
            <div aria-hidden className="absolute top-[30px] h-[calc(var(--tt)+22px-30px)] w-0.5 -translate-x-px bg-fg" style={{ left: `${x(100)}%` }} />
            <div
              data-testid="route-kr-tag"
              className={`absolute top-0 flex -translate-x-1/2 items-center gap-1.5 rounded-[6px] bg-sun py-1 pr-3 pl-[5px] text-[0.8125rem] font-bold whitespace-nowrap text-fg transition-transform duration-[350ms] ${cur.country === "KR" ? "scale-[1.14]" : ""}`}
              style={{ left: `${x(100)}%` }}
            >
              <RouteFlag country="KR" name="한국" className="size-5 ring-0" />
              한국 100 기준
            </div>
            {stops.map((s) => (
              <span
                key={`d${s.country}`}
                aria-hidden
                className={`absolute top-[calc(var(--tt)+11px)] -mt-[5.5px] -ml-[5.5px] size-[11px] rounded-full border-[2.5px] bg-card transition-transform duration-300 ${s.index === active ? "scale-[1.35]" : ""}`}
                style={{ left: `${x(s.value)}%`, borderColor: COLOR[s.band] }}
              />
            ))}
            {awayStops(stops).map((s) => {
                const on = s.index === active;
                const past = s.index < active;
                const up = s.side === "up";
                const col = COLOR[s.band];
                const nm = <span className="text-[0.8125rem] leading-tight font-bold text-fg">{s.name}</span>;
                const val = <span className="text-[1.375rem] leading-[1.15] font-bold tracking-[0.02em] tabular-nums">{s.value}</span>;
                const fl = <RouteFlag country={s.country} name={s.name} className="my-[3px] size-[1.875rem] ring-[2px]" />;
                const stem = <span className="block h-[22px] w-[1.5px] bg-current opacity-45" />;
                return (
                  <div
                    key={s.country}
                    data-testid="route-pin"
                    data-country={s.country}
                    data-value={s.value}
                    data-side={s.side}
                    className={`absolute flex -translate-x-1/2 flex-col items-center transition-[opacity,transform] duration-[350ms] ${up ? "bottom-[calc(var(--rh)-var(--tt)+2px)]" : "top-[calc(var(--tt)+24px)]"} ${on ? (up ? "-translate-y-1.5 scale-[1.12] opacity-100" : "translate-y-1.5 scale-[1.12] opacity-100") : past ? "opacity-70" : "opacity-45"}`}
                    style={{ left: `${x(s.value)}%`, color: col }}
                  >
                    {up ? (
                      <>
                        {nm}
                        {val}
                        {fl}
                        {stem}
                      </>
                    ) : (
                      <>
                        {stem}
                        {fl}
                        {val}
                        {nm}
                      </>
                    )}
                  </div>
                );
              })}
            <>
                <div aria-hidden className="pointer-events-none absolute top-[calc(var(--tt)-34px)] z-[4] max-[760px]:hidden" style={{ left: `${planeX}%` }}>
                  <span className={`block -translate-x-1/2 rounded-pill bg-fg px-2.5 py-[3px] text-[0.75rem] font-bold whitespace-nowrap text-card transition-opacity duration-200 ${moving ? "opacity-100" : "opacity-0"}`}>{moving ? `${dir === "forward" ? "→" : "←"} ${nextName}` : ""}</span>
                </div>
                <div
                  data-testid="route-plane"
                  data-dir={dir}
                  aria-hidden="true"
                  key={swap}
                  className={`absolute top-[calc(var(--tt)+11px)] z-[3] -mt-[19px] -ml-[19px] grid size-[38px] place-items-center rounded-full bg-fg shadow-[0_0_0_3px_var(--hav-sun),0_8px_18px_-6px_color-mix(in_srgb,var(--hav-pin-ink)_70%,transparent)] after:absolute after:-inset-2.5 after:rounded-full after:border-2 after:border-sun after:opacity-0 ${swap > 0 && !sameValue ? "after:animate-[route-ping_.8s_ease-out]" : ""}`}
                  style={{ left: `${planeX}%` }}
                >
                  <svg viewBox="0 0 24 24" className={`size-5 text-card transition-transform duration-300 ${flipped ? "-scale-x-100" : ""}`}>
                    <path fill="currentColor" d="M21.5 11.2 14 7.8V3.5a2 2 0 1 0-4 0v4.3l-7.5 3.4v2.1l7.5-1.6v4.6l-2.2 1.6V20l4.2-1.1 4.2 1.1v-1.9L14 16.3v-4.6l7.5 1.6z" transform="rotate(90 12 12)" />
                  </svg>
                </div>
            </>
          </div>
        </div>
        <article
          data-testid="route-card"
          data-moving={moving ? "true" : "false"}
          aria-live="polite"
          className={`${CARD} mt-2.5 max-[760px]:mt-0`}
          style={{ "--c": COLOR[cur.band] } as CSSProperties}
        >
          <div className={moving ? "opacity-55 transition-opacity duration-200" : "transition-opacity duration-[250ms]"}>
            <Card stop={cur} n={n} extra={extras[cur.country] ?? noExtra} latestYear={latestYear} signalOf={signalOf} percentileOf={percentileOf} live={armed} swap={swap} />
          </div>
          <p data-testid="route-next" className={`absolute right-7 bottom-3.5 text-[0.75rem] text-fg-2 transition-opacity duration-200 max-[760px]:hidden ${moving ? "opacity-100" : "opacity-0"}`}>
            {moving ? `다음 정거장 → ${nextName}` : ""}
          </p>
        </article>
        </div>
      </div>
    </section>
  );
}
