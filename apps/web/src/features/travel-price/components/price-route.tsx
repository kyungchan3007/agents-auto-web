"use client";

// 여행 물가 "스크롤로 떠나는 물가 노선" — 정적 물가 자 자리에 들어가는 새 구역 (작업 0230 · 모션 3번) · 바로 아래로 세 칸 목록 · 나라 더 보기 · 뺀 나라 줄이 그대로 이어짐
//   움직이는 모습: 화면이 메뉴 띠 바로 아래에 붙은 채(sticky · 세로 가운데 아님) 스크롤을 내리면 말(동그라미)이 싼 나라에서 한국을 지나 비싼 나라로 · 올리면 거꾸로 · 정거장마다 카드(이름 · 물가 숫자 · 한국과 비교 · 하루 예산 · 환율 신호)
//   정거장 = 지금 정적 자의 핀(구간마다 맨 위 두 나라) + 한국 · 값은 아래 목록의 "물가 N (한국 100)" 과 같음(추가 API 없음 · 지어내지 않음)
//   서버 첫 그림 · 움직임 줄이기 · 자바스크립트 꺼짐 = 정적 노선(고정 없이 자 · 핀 · 정거장 카드가 모두 보임) · 긴 스크롤 모양은 globals.css 의 scripting + no-preference 조건에서만
import { Flag } from "@hav/ui/data/flag";
import type { Signal } from "@hav/shared/signal";
import { TRAVEL_COUNTRIES } from "@hav/shared/travel";
import { Eyebrow, SectionTitle } from "@hav/ui/text/heading";
import type { CSSProperties } from "react";
import { useCountTween, usePriceRoute, useRouteTiles } from "../hooks/use-price-route";
import { type PriceBand, rateBadgeText } from "../lib/bands";
import { type RouteBand, type RouteStop, routeCardText, routeHop, routeStops, routeValue } from "../lib/price-route";
import { rulerScale, rulerX } from "../lib/ruler";

const COLOR: Record<RouteBand, string> = {
  cheap: "var(--hav-pin-cheap)",
  mid: "color-mix(in srgb, var(--hav-pin-cheap) 72%, var(--hav-card))",
  base: "var(--hav-pin-ink)",
  exp: "var(--hav-pin-expensive)",
};
/** 자 색 띠 — 싼 쪽 파랑 → 한국 근처 옅게 → 비싼 쪽 빨강 (정적 자와 같은 색) */
const trackBg = (lo: number, hi: number) => {
  const p = (v: number) => Math.min(100, Math.max(0, ((v - lo) / (hi - lo)) * 100));
  return `linear-gradient(90deg, var(--hav-pin-cheap) 0%, color-mix(in srgb, var(--hav-pin-cheap) 78%, var(--hav-card)) ${p(60)}%, color-mix(in srgb, var(--hav-pin-cheap) 32%, var(--hav-card)) ${p(88)}%, color-mix(in srgb, var(--hav-pin-line) 10%, var(--hav-card)) ${p(100)}%, color-mix(in srgb, var(--hav-pin-expensive) 45%, var(--hav-card)) ${p(108)}%, var(--hav-pin-expensive) 100%)`;
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
  if (stop.country === "KR") return <span className="inline-flex items-center rounded-pill bg-sun px-3.5 py-[0.4375rem] text-[0.8125rem] font-bold whitespace-nowrap text-fg">한국 100 기준</span>;
  const s = extra.currency ? signalOf[extra.currency] : null;
  if (!s) return <span className="inline-flex px-0 py-[0.4375rem] text-[0.8125rem] text-fg-2">환율 없음</span>;
  const tone = s === "normal" ? "bg-card text-fg ring-[1.5px] ring-fg ring-inset" : s === "expensive" ? "bg-pin-expensive text-on-accent" : "bg-pin-cheap text-on-accent";
  return (
    <>
      <span className={`inline-flex items-center rounded-pill px-3.5 py-[0.4375rem] text-[0.8125rem] font-bold whitespace-nowrap ${tone}`}>{rateBadgeText(s, percentileOf[extra.currency ?? ""] ?? null)}</span>
      {small && <small className="mt-1 block text-[0.71875rem] text-fg-2 max-[760px]:hidden">오늘 그 나라 통화 신호</small>}
    </>
  );
}

/** 카드 한 장 — 정거장 하나의 모습 (움직이는 카드 · 정적 카드가 같은 틀) */
function Card({ stop, n, extra, latestYear, signalOf, percentileOf, live }: { stop: RouteStop; n: number; extra: Extra; latestYear?: number; signalOf: Props["signalOf"]; percentileOf: Props["percentileOf"]; live: boolean }) {
  const t = routeCardText(stop, stop.index, n);
  const pctN = useCountTween(Math.abs(100 - stop.value));
  const budN = useCountTween(stop.value * 1000);
  const tiles = useRouteTiles(t.tiles);
  const shownTiles = live ? tiles : t.tiles.map((ch) => ({ ch, out: false }));
  const pctNum = live ? Math.round(pctN) : Math.abs(100 - stop.value);
  const bud = live ? Math.round(budN / 1000) * 1000 : stop.value * 1000;
  const year = extra.year !== null && extra.year !== latestYear ? `${extra.year}년 자료` : "";
  return (
    <>
      <div className="flex flex-wrap items-center gap-x-[1.125rem] gap-y-2 max-[760px]:gap-x-3.5">
        <span className="relative size-[4.75rem] flex-none max-[760px]:size-14" data-swap={live ? stop.index : undefined}>
          <span className="absolute inset-0 grid place-items-center overflow-hidden rounded-full bg-surface-2 ring-[3px] ring-card ring-offset-[1px] ring-offset-line">
            <Flag country={TRAVEL_COUNTRIES[stop.country]?.flag ?? (stop.country === "KR" ? "KR" : null)} label={`${stop.name} 국기`} className="h-full w-[150%] max-w-none shrink-0 rounded-none" />
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <p data-testid="route-card-meta" className="text-[0.8125rem] text-fg-2 max-[760px]:text-[0.75rem]">
            {t.meta}
          </p>
          <p className="h-[2.5625rem] overflow-hidden text-[2.125rem] leading-[1.2] font-extrabold tracking-display max-[760px]:h-8 max-[760px]:text-[1.625rem]">
            <span data-testid="route-card-name" className="block">
              {stop.name}
            </span>
          </p>
        </div>
        <div data-testid="route-card-signal" className="flex-none text-right max-[760px]:basis-full max-[760px]:pl-[4.375rem] max-[760px]:text-left">
          <SignalCell stop={stop} extra={extra} signalOf={signalOf} percentileOf={percentileOf} small />
        </div>
      </div>
      <div className="mt-5 grid grid-cols-[auto_1fr_1.25fr] border-t-2 border-dashed border-line pt-[1.125rem] max-[760px]:mt-3.5 max-[760px]:grid-cols-2 max-[760px]:gap-y-4 max-[760px]:pt-3.5 [&>div]:border-l [&>div]:border-line [&>div]:px-8 [&>div:first-child]:border-l-0 [&>div:first-child]:pl-0 max-[760px]:[&>div]:pr-0 max-[760px]:[&>div]:pl-4 max-[760px]:[&>div:first-child]:pl-0 max-[760px]:[&>div:nth-child(3)]:col-span-2 max-[760px]:[&>div:nth-child(3)]:border-t max-[760px]:[&>div:nth-child(3)]:border-l-0 max-[760px]:[&>div:nth-child(3)]:pt-3.5 max-[760px]:[&>div:nth-child(3)]:pl-0">
        <div>
          <p className="mb-1.5 text-[0.78125rem] text-fg-2">물가 (한국 = 100)</p>
          <div className="flex items-center gap-1">
            <div data-testid="route-card-value" className="flex items-center gap-1">
              {shownTiles.map((x, k) => (
                <span key={k} className="relative grid h-[3.625rem] w-11 place-items-center rounded-[5px] bg-flap-cell text-[2.125rem] leading-none font-extrabold text-sun [perspective:200px] after:absolute after:inset-x-0 after:top-1/2 after:h-px after:bg-on-band max-[760px]:h-12 max-[760px]:w-9 max-[760px]:text-[1.75rem]">
                  <span className={`block origin-center transition-transform duration-[140ms] ease-in ${x.out ? "[transform:rotateX(90deg)]" : ""} ${x.ch === " " ? "opacity-0" : ""}`}>{x.ch === " " ? "0" : x.ch}</span>
                </span>
              ))}
            </div>
            {year && <em className="ml-2.5 text-[0.875rem] leading-snug text-fg-2 not-italic">{year}</em>}
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-[0.78125rem] text-fg-2">한국과 비교</p>
          <p data-testid="route-card-pct" className="text-[2.625rem] leading-[1.1] font-extrabold tracking-display whitespace-nowrap text-(--c) tabular-nums max-[760px]:text-[1.75rem] max-[760px]:whitespace-normal">
            {stop.value === 100 ? (
              <>
                기준<small className="ml-1 text-[1.125rem] tracking-normal max-[760px]:block max-[760px]:text-[0.8125rem]">100,000원 그대로</small>
              </>
            ) : (
              <>
                {pctNum}
                <small className="ml-1 text-[1.125rem] tracking-normal max-[760px]:text-[0.875rem]">{stop.value < 100 ? "% 쌉니다" : "% 비쌉니다"}</small>
              </>
            )}
          </p>
        </div>
        <div>
          <p className="mb-1.5 text-[0.78125rem] text-fg-2">하루 예산 예시</p>
          <p data-testid="route-card-budget" className="text-[2.625rem] leading-[1.1] font-extrabold tracking-display whitespace-nowrap text-(--c) tabular-nums max-[760px]:text-[1.75rem] max-[760px]:whitespace-normal">
            약 {bud.toLocaleString("ko-KR")}
            <small className="ml-1 text-[1.125rem] tracking-normal max-[760px]:text-[0.875rem]">원</small>
          </p>
          <p className="mt-1.5 text-[0.78125rem] text-fg-2 max-[760px]:text-[0.71875rem] max-[760px]:max-[700px]:hidden">한국에서 하루 100,000원 쓰는 만큼 · 물가 비율로 계산</p>
        </div>
      </div>
    </>
  );
}

const CARD = "relative overflow-hidden rounded-3xl bg-card px-8 pt-6 pb-[1.625rem] ring-1 ring-line before:absolute before:inset-y-0 before:left-0 before:w-1.5 before:bg-(--c) max-[760px]:rounded-[1.25rem] max-[760px]:px-[1.125rem] max-[760px]:pt-[1.125rem] max-[760px]:pb-5 max-[760px]:before:w-[5px]";

export function PriceRoute({ bands, signalOf, percentileOf, latestYear }: Props) {
  const stops = routeStops(bands);
  if (stops.length < 2) return null; // 나라가 없으면 노선 없음 (지어내지 않음)
  const extras: Record<string, Extra> = Object.fromEntries(bands.flatMap((b) => b.rows).map((r) => [r.country, { currency: r.currency ?? null, year: r.year ?? null }]));
  return <Route stops={stops} extras={extras} signalOf={signalOf} percentileOf={percentileOf} latestYear={latestYear} />;
}

function Route({ stops, extras, signalOf, percentileOf, latestYear }: { stops: RouteStop[]; extras: Record<string, Extra>; signalOf: Props["signalOf"]; percentileOf: Props["percentileOf"]; latestYear?: number }) {
  const n = stops.length;
  const { armed, fr, active, dir, swap, moving, sec, stage, ruler, vp, goto } = usePriceRoute(n);
  const scale = rulerScale(stops.map((s) => s.value));
  const x = (v: number) => rulerX(v, scale);
  const noExtra: Extra = { currency: null, year: null };
  const planeValue = armed ? routeValue(stops, fr) : stops[0].value;
  const planeX = x(planeValue);
  const hop = armed ? routeHop(stops, fr) : 0;
  const cur = stops[active] ?? stops[0];
  const nextName = moving ? (stops[active === fr.i ? fr.i + 1 : fr.i]?.name ?? "") : "";
  const ticks: number[] = [];
  for (let v = Math.ceil((scale.lo + 5) / 5) * 5; v <= scale.hi - 5; v += 5) ticks.push(v);
  const labels = ticks.filter((v) => v % 20 === 0 && v < 100);
  const x0 = x(stops[0].value);
  const x1 = x(stops[n - 1].value);
  return (
    <section ref={sec} data-testid="route-section" aria-label="스크롤로 떠나는 물가 노선" className="relative" style={{ "--route-n": n } as CSSProperties}>
      <div ref={stage} data-testid="route-stage" className="w-full">
        <div className="mb-[1.375rem] flex items-end justify-between gap-6 max-[760px]:mb-2">
          <div>
            <Eyebrow>한국 = 100</Eyebrow>
            <SectionTitle data-testid="route-title" className="mt-3 text-title text-fg">
              스크롤로 떠나는 물가 노선
            </SectionTitle>
            <p className="mt-1.5 text-small text-fg-2 max-[760px]:hidden">내릴수록 싼 나라에서 한국을 지나 비싼 나라로 갑니다 · 올리면 거꾸로 돌아옵니다</p>
          </div>
          {armed && (
            <ol data-testid="route-stops" className="m-0 flex list-none flex-wrap justify-end gap-1 p-0 max-[760px]:hidden">
              {stops.map((s) => (
                <li key={s.country}>
                  <button
                    type="button"
                    data-testid="route-stop"
                    data-country={s.country}
                    data-value={s.value}
                    data-active={s.index === active ? "true" : "false"}
                    onClick={() => goto(s.index)}
                    className={`flex cursor-pointer items-center gap-1.5 rounded-pill border py-[0.3125rem] pr-2.5 pl-1.5 text-[0.78125rem] transition-colors duration-[250ms] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${s.index === active ? "border-fg bg-fg font-bold text-card" : s.index < active ? "border-fg/40 text-fg" : "border-line text-fg-2"}`}
                  >
                    <RouteFlag country={s.country} name={s.name} className="size-4 ring-0" />
                    {s.name}
                  </button>
                </li>
              ))}
            </ol>
          )}
        </div>
        <div ref={vp} className={`relative -mx-2 mt-1 px-2 max-[760px]:mx-[-1rem] max-[760px]:px-0 ${armed ? "max-[760px]:overflow-hidden" : "max-[760px]:overflow-x-auto"}`}>
          <div
            ref={ruler}
            data-testid="route-ruler"
            data-plane-x={planeX}
            className="relative h-(--rh) [--rh:18.75rem] [--tt:9.375rem] max-[760px]:w-[960px] max-[760px]:[--rh:18.25rem] max-[760px]:[--tt:9.625rem]"
          >
            <div className="absolute inset-x-0 top-(--tt) h-[22px] rounded-[11px]" style={{ background: trackBg(scale.lo, scale.hi) }} />
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
              <span className="text-pin-cheap">← 쌈</span>
              <span className="text-pin-expensive">비쌈 →</span>
            </div>
            {armed && (
              <>
                <div aria-hidden className="absolute top-[calc(var(--tt)+10px)] h-0.5 bg-[repeating-linear-gradient(90deg,color-mix(in_srgb,var(--hav-card)_95%,transparent)_0_6px,transparent_6px_12px)]" style={{ left: `${x0}%`, width: `${x1 - x0}%` }} />
                <div aria-hidden className="absolute top-[calc(var(--tt)+8.5px)] h-[5px] rounded-[3px] bg-card ring-[1.5px] ring-fg/35" style={{ left: `${x0}%`, width: `${Math.max(0, planeX - x0)}%` }} />
              </>
            )}
            <div aria-hidden className="absolute top-[30px] h-[calc(var(--tt)+22px-30px)] w-0.5 -translate-x-px bg-fg" style={{ left: `${x(100)}%` }} />
            <div
              data-testid="route-kr-tag"
              className={`absolute top-0 flex -translate-x-1/2 items-center gap-1.5 rounded-pill bg-sun py-1 pr-3 pl-[5px] text-[0.78125rem] font-bold whitespace-nowrap text-fg transition-transform duration-[350ms] ${armed && cur.country === "KR" ? "scale-[1.14]" : ""}`}
              style={{ left: `${x(100)}%` }}
            >
              <RouteFlag country="KR" name="한국" className="size-5 ring-0" />
              한국 100 기준
            </div>
            {stops.map((s) => (
              <span
                key={`d${s.country}`}
                aria-hidden
                className={`absolute top-[calc(var(--tt)+11px)] -mt-[5.5px] -ml-[5.5px] size-[11px] rounded-full border-[2.5px] bg-card transition-transform duration-300 ${armed && s.index === active ? "scale-[1.35]" : ""}`}
                style={{ left: `${x(s.value)}%`, borderColor: COLOR[s.band] }}
              />
            ))}
            {stops
              .filter((s) => s.side !== "kr")
              .map((s) => {
                const on = armed && s.index === active;
                const past = armed && s.index < active;
                const up = s.side === "up";
                const col = COLOR[s.band];
                const nm = <span className="text-[0.78125rem] leading-tight font-bold text-fg">{s.name}</span>;
                const val = <span className="text-2xl leading-[1.15] font-extrabold tracking-[0.02em] tabular-nums">{s.value}</span>;
                const fl = <RouteFlag country={s.country} name={s.name} className="my-[3px] size-[1.875rem] ring-[2px]" />;
                const stem = <span className="block h-[22px] w-[1.5px] bg-current opacity-45" />;
                return (
                  <div
                    key={s.country}
                    data-testid="route-pin"
                    data-country={s.country}
                    data-value={s.value}
                    data-side={s.side}
                    className={`absolute flex -translate-x-1/2 flex-col items-center transition-[opacity,transform] duration-[350ms] ${up ? "bottom-[calc(var(--rh)-var(--tt)+2px)]" : "top-[calc(var(--tt)+24px)]"} ${on ? (up ? "-translate-y-1.5 scale-[1.12] opacity-100" : "translate-y-1.5 scale-[1.12] opacity-100") : armed ? (past ? "opacity-70" : "opacity-45") : ""}`}
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
            {armed && (
              <>
                <div aria-hidden className="pointer-events-none absolute top-[calc(var(--tt)-34px)] z-[4] max-[760px]:hidden" style={{ left: `${planeX}%`, transform: `translateY(${hop}px)` }}>
                  <span className={`block -translate-x-1/2 rounded-pill bg-fg px-2.5 py-[3px] text-[0.75rem] font-bold whitespace-nowrap text-card transition-opacity duration-200 ${moving ? "opacity-100" : "opacity-0"}`}>{moving ? `${active === fr.i ? "→" : "←"} ${nextName}` : ""}</span>
                </div>
                <div
                  data-testid="route-plane"
                  data-dir={dir}
                  aria-hidden="true"
                  key={swap}
                  className={`absolute top-[calc(var(--tt)+11px)] z-[3] -mt-[19px] -ml-[19px] grid size-[38px] place-items-center rounded-full bg-fg shadow-[0_0_0_3px_var(--hav-sun),0_8px_18px_-6px_color-mix(in_srgb,var(--hav-pin-ink)_70%,transparent)] after:absolute after:-inset-2.5 after:rounded-full after:border-2 after:border-sun after:opacity-0 ${swap > 0 ? "after:animate-[route-ping_.8s_ease-out]" : ""}`}
                  style={{ left: `${planeX}%`, transform: `translateY(${hop}px)` }}
                >
                  <svg viewBox="0 0 24 24" className={`size-5 text-card transition-transform duration-300 ${dir === "back" ? "-scale-x-100" : ""}`}>
                    <path fill="currentColor" d="M21.5 11.2 14 7.8V3.5a2 2 0 1 0-4 0v4.3l-7.5 3.4v2.1l7.5-1.6v4.6l-2.2 1.6V20l4.2-1.1 4.2 1.1v-1.9L14 16.3v-4.6l7.5 1.6z" transform="rotate(90 12 12)" />
                  </svg>
                </div>
              </>
            )}
          </div>
        </div>
        {armed ? (
          <article
            data-testid="route-card"
            data-moving={moving ? "true" : "false"}
            aria-live="polite"
            className={`${CARD} mt-2.5 max-[760px]:mt-0`}
            style={{ "--c": COLOR[cur.band] } as CSSProperties}
          >
            <div className={moving ? "opacity-55 transition-opacity duration-200" : "transition-opacity duration-[250ms]"}>
              <Card stop={cur} n={n} extra={extras[cur.country] ?? noExtra} latestYear={latestYear} signalOf={signalOf} percentileOf={percentileOf} live />
            </div>
            <p data-testid="route-next" className={`absolute right-7 bottom-3.5 text-[0.75rem] text-fg-2 transition-opacity duration-200 max-[760px]:hidden ${moving ? "opacity-100" : "opacity-0"}`}>
              {moving ? `다음 정거장 → ${nextName}` : ""}
            </p>
          </article>
        ) : (
          <div data-testid="route-static" className="mt-2.5 grid gap-4 min-[761px]:grid-cols-2">
            {stops.map((s) => (
              <article key={s.country} data-testid="route-card" className={CARD} style={{ "--c": COLOR[s.band] } as CSSProperties}>
                <Card stop={s} n={n} extra={extras[s.country] ?? noExtra} latestYear={latestYear} signalOf={signalOf} percentileOf={percentileOf} live={false} />
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
