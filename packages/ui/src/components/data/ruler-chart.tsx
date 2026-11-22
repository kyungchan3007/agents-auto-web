"use client";

// 여행 물가 자(한국 = 100) — 그라데이션 자 막대 · 눈금 · 나라 핀(국기 원 · 큰 숫자 · 이름) · 한국 100 노랑 꼬리표 + 진한 세로선 (작업 0220 · 시안 F)
//   움직임(화면에 들어오면 한 번 · useChartTimeline): 자 뻗음 → 눈금 글 → 나라 싼 순서대로(올라오며 숫자 카운트업) → 한국 100 선 → 꼬리표 톡 · 움직임 줄이기 · 서버 첫 그림 = 최종 모양
//   자리(%)와 값은 쓰는 쪽이 받은 실제 값으로 계산해 넘김 · 이 부품은 그리기만 · 휴대폰은 줄(tier)로 겹침을 풀고 자 높이를 키움
//   DOM 약속(e2e): [data-testid=ruler][data-state] 안에 ruler-bar · ruler-pin[data-value] > ruler-pin-value[data-final] · ruler-korea-line · ruler-korea-tag — 각각 data-reveal(0~1)
import type { CSSProperties, ReactNode } from "react";
import { useChartTimeline } from "../../hooks/use-chart-timeline";
import { ease, fmtNum, progressAt } from "../../lib/line-chart";
import { Flag } from "./flag";

export type RulerPinData = { id: string; name: string; flag: string | null; value: number; x: number; side: "up" | "down"; tier: number };
export type RulerStop = { pct: number; color: string };
export type RulerTick = { pct: number; v: number; big: boolean };

const rv = (n: number) => (n >= 1 ? "1" : n <= 0 ? "0" : n.toFixed(3));
const span = (ms: number, at: number, dur: number, e: keyof typeof ease = "out") => ease[e](progressAt({ at, dur }, ms));

/** 값 → 핀 색 — 한국보다 많이 쌈(60 아래) 파랑 · 비슷(60~100) 남색 회색 · 비쌈(100 위) 빨강 */
const toneOf = (v: number) => (v < 60 ? "var(--hav-pin-cheap)" : v <= 100 ? "var(--hav-pin-line)" : "var(--hav-pin-expensive)");

export function RulerChart({ pins, stops, ticks, korea, maxTier, lo, hi, aria, children }: { pins: RulerPinData[]; stops: RulerStop[]; ticks: RulerTick[]; korea: number; maxTier: number; /** 자 눈금 범위(값) */ lo: number; hi: number; aria: string; children?: ReactNode }) {
  const order = [...pins].sort((a, b) => a.value - b.value);
  const startOf = (id: string) => 650 + order.findIndex((p) => p.id === id) * 150;
  // 한국 100 선은 마지막 핀이 다 나타난 뒤 · 꼬리표는 선이 거의 올라온 뒤 (lead 지시 "자 뻗음 → 나라 싼 순 → 한국 100 선")
  const pinsEnd = Math.max(1200, 650 + Math.max(0, order.length - 1) * 150 + 560);
  const kLineAt = pinsEnd;
  const kTagAt = kLineAt + 400;
  const total = Math.max(kTagAt + 480, pinsEnd + 60 + 800) + 40;
  const { ref, ms, state } = useChartTimeline<HTMLDivElement>(total);
  const bar = span(ms, 150, 1000, "io");
  const tickA = span(ms, 700, 700);
  const kLine = span(ms, kLineAt, 500, "io");
  const kTag = span(ms, kTagAt, 480, "back");
  const gradient = `linear-gradient(90deg, ${stops.map((s) => `${s.color} ${s.pct.toFixed(1)}%`).join(", ")})`;
  return (
    <div
      ref={ref}
      data-testid="ruler"
      data-state={state}
      data-lo={lo}
      data-hi={hi}
      role="img"
      aria-label={aria}
      className="relative mx-4 mt-6 h-[var(--ruler-h)] sm:mx-6 sm:h-80"
      style={{ "--ruler-h": `${16.75 + maxTier * 4.4}rem` } as CSSProperties}
    >
      {/* 자 막대 — 왼쪽에서 오른쪽으로 뻗음 · 아래 그림자는 같이 자람 */}
      <div aria-hidden className="absolute top-1/2 left-0 h-[18px] -translate-y-1/2 rounded-pill shadow-ticket sm:h-6" style={{ width: `${bar * 100}%` }} />
      <div data-testid="ruler-bar" data-reveal={rv(bar)} aria-hidden className="absolute inset-x-0 top-1/2 h-[18px] -translate-y-1/2 rounded-pill sm:h-6" style={{ background: gradient, clipPath: `inset(0 ${(1 - bar) * 100}% 0 0)` }}>
        {/* 눈금 — 10 마다 짧게 · 20 마다 길게 (자 안 아래쪽) */}
        {ticks.map((t) => (
          <span key={t.v} className="absolute bottom-0.5 w-0.5 -translate-x-1/2 rounded-pill bg-card/85" style={{ left: `${t.pct}%`, height: t.big ? 8 : 5 }} />
        ))}
      </div>
      <div aria-hidden className="absolute inset-x-0 top-1/2 mt-3.5 sm:mt-[1.125rem]" style={{ opacity: tickA }}>
        {ticks
          .filter((t) => t.big && t.v !== 100 && t.pct > 6 && t.pct < 94)
          .map((t) => (
            <span key={t.v} className="absolute -translate-x-1/2 text-[0.6875rem] font-normal text-fg-2 sm:text-small" style={{ left: `${t.pct}%` }}>
              {t.v}
            </span>
          ))}
        <span className="absolute left-0 hidden text-small font-semibold text-pin-cheap sm:block">← 쌈</span>
        <span className="absolute right-0 hidden text-small font-semibold text-pin-expensive sm:block">비쌈 →</span>
      </div>

      {pins.map((p) => {
        const at = startOf(p.id);
        const e = span(ms, at, 560, "back");
        const r = progressAt({ at, dur: 560 }, ms);
        const count = span(ms, at + 60, 800);
        const col = toneOf(p.value);
        const up = p.side === "up";
        const text = (
          <span data-testid="ruler-pin-text" className="relative z-10 flex flex-col items-center bg-transparent px-0.5">
            {up && (
              <span className="text-[0.75rem] leading-tight font-bold whitespace-nowrap text-fg sm:text-[0.8125rem]">{p.name}</span>
            )}
            <span data-testid="ruler-pin-value" data-final={String(p.value)} data-reveal={rv(count)} className="font-display text-[1.125rem] leading-none font-extrabold whitespace-nowrap tabular-nums sm:text-[1.5rem]" style={{ color: col }}>
              {fmtNum(p.value * count, 0)}
            </span>
            {!up && <span className="mt-0.5 text-[0.75rem] leading-tight font-bold whitespace-nowrap text-fg sm:text-[0.8125rem]">{p.name}</span>}
          </span>
        );
        const flag = (
          <span className="relative z-10 grid size-[22px] place-items-center overflow-hidden rounded-full bg-card shadow-chip ring-[2.5px] ring-card sm:size-7">
            {p.flag ? <Flag country={p.flag} label={`${p.name} 국기`} className="h-full w-[150%] max-w-none shrink-0 rounded-none" /> : null}
          </span>
        );
        const stem = (
          <span className="relative z-0 h-5 w-px bg-current opacity-75 max-sm:h-[var(--line-h)]" style={{ color: col, "--line-h": `${1.25 + p.tier * 4.125}rem` } as CSSProperties} />
        );
        const dot = <span className="relative z-10 size-2.5 shrink-0 rounded-full border-2 bg-card" style={{ borderColor: col }} />;
        return (
          <div
            key={p.id}
            data-testid="ruler-pin"
            data-value={p.value}
            data-x={p.x}
            data-side={p.side}
            data-reveal={rv(e)}
            aria-hidden
            className={`absolute flex -translate-x-1/2 flex-col items-center gap-1 text-center ${up ? "bottom-1/2 mb-[0.1875rem]" : "top-1/2 mt-[0.1875rem]"}`}
            style={{ left: `${p.x}%`, opacity: Math.min(1, r * 2.2), transform: `translate(-50%, ${(1 - e) * 22 * (up ? 1 : -1)}px)` }}
          >
            {/* 위: 이름 · 숫자 · 국기 · 줄 · 점(자 위) / 아래: 점(자 아래) · 줄 · 국기 · 숫자 · 이름 */}
            {up ? (
              <>
                {text}
                {flag}
                {stem}
                {dot}
              </>
            ) : (
              <>
                {dot}
                {stem}
                {flag}
                {text}
              </>
            )}
          </div>
        );
      })}

      {/* 한국 100 — 진한 세로선 + 노랑 꼬리표(국기) */}
      <div className="absolute top-8 w-0.5 -translate-x-1/2 origin-bottom rounded-pill bg-fg max-sm:top-7" style={{ left: `${korea}%`, height: "calc(50% - 14px)", transform: `translateX(-50%) scaleY(${kLine})` }} data-testid="ruler-korea-line" data-reveal={rv(kLine)} aria-hidden />
      <div
        data-testid="ruler-korea-tag"
        data-reveal={rv(kTag)}
        aria-hidden
        className="absolute top-1 inline-flex items-center gap-1.5 rounded-pill bg-sun py-1 pr-3 pl-1 text-small font-bold whitespace-nowrap text-fg shadow-chip"
        style={{ left: `${korea}%`, transform: `translateX(-50%) scale(${Math.max(0.0001, kTag)})`, opacity: kTag > 0 ? 1 : 0, transformOrigin: "50% 100%" }}
      >
        <span className="grid size-5 place-items-center overflow-hidden rounded-full bg-card sm:size-6">
          <Flag country="KR" label="한국 국기" className="h-full w-[150%] max-w-none shrink-0 rounded-none" />
        </span>
        <span data-testid="ruler-korea-label">
          한국 100<span className="hidden sm:inline"> 기준</span>
        </span>
      </div>
      {children}
    </div>
  );
}
