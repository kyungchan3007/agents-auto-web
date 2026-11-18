// 한국 = 100 물가 자 — 싼 곳 · 비슷한 곳 · 비싼 곳을 자 하나에 먼저 찍고 아래 세 칸 표로 풀어 줌 (작업 0220 · 시안 B)
// 점 = 지금 세 칸 표의 맨 위 나라들(실제 자료) · 위치 = 물가 숫자 비율(ruler.ts) · 숫자는 화면에 들어올 때 한 번 카운트업 · 한국 100 눈금 · 나라가 없으면 그리지 않음
import { CountUp } from "@hav/ui/motion/count-up";
import type { CSSProperties } from "react";
import { Eyebrow, Title } from "@hav/ui/text/heading";
import type { PriceBand } from "../lib/bands";
import { rulerMaxTier, rulerPins, rulerScale, rulerSegments, rulerTiers, rulerX } from "../lib/ruler";

export function PriceRuler({ bands }: { bands: PriceBand[] }) {
  const pins = rulerPins(bands);
  if (pins.length === 0) return null;
  const scale = rulerScale(pins.map((p) => p.value));
  const seg = rulerSegments(scale);
  const korea = rulerX(100, scale);
  // 휴대폰: 라벨이 겹치면 한 줄(tier) 더 떨어뜨리고 자 높이를 그만큼 키움 · 한국 100 글자는 자 맨 위로 (작업 0220 lead 지시 · 넓은 화면은 그대로)
  const tiers = rulerTiers(pins);
  const maxTier = rulerMaxTier(tiers);
  const phoneHeight = 14 + maxTier * 4.4;
  const label = `물가 자(한국 = 100). ${[...pins.map((p) => ({ n: p.name, v: p.value })), { n: "한국", v: 100 }].sort((a, b) => a.v - b.v).map((p) => `${p.n} ${p.v}`).join(", ")}`;
  return (
    <section aria-labelledby="ruler-title" className="mb-12">
      <Eyebrow>한국 = 100</Eyebrow>
      <Title as="h2" id="ruler-title" className="mt-3 text-fg">
        한국보다 싼 곳 · 비슷한 곳 · 비싼 곳
      </Title>
      <div data-testid="ruler" data-lo={scale.lo} data-hi={scale.hi} role="img" aria-label={label} className="relative mx-4 mt-6 h-[var(--ruler-h)] sm:mx-6 sm:h-60" style={{ "--ruler-h": `${phoneHeight}rem` } as CSSProperties}>
        <div data-testid="ruler-axis" aria-hidden className="absolute inset-x-0 top-1/2 h-3 -translate-y-1/2 overflow-hidden rounded-pill">
          <div className="absolute inset-y-0 left-0 bg-pin-cheap" style={{ width: `${seg.cheapEnd}%` }} />
          <div className="absolute inset-y-0 bg-pin-cheap/25" style={{ left: `${seg.cheapEnd}%`, width: `${seg.priceyStart - seg.cheapEnd}%` }} />
          <div className="absolute inset-y-0 right-0 bg-pin-expensive" style={{ width: `${100 - seg.priceyStart}%` }} />
        </div>
        {pins.map((p) => {
          const tier = tiers[p.country] ?? 0;
          // 이름 · 숫자 묶음은 흰 바탕을 깔아 다른 점의 선이 글자 뒤로 가려지게 (휴대폰 tier 줄이 이웃 글자 뒤를 지날 때)
          const text = (
            <span data-testid="ruler-pin-text" className="relative z-10 flex flex-col items-center bg-surface px-0.5">
              <span className="text-small leading-tight font-bold whitespace-nowrap text-fg sm:text-base">{p.name}</span>
              <span className="text-[1.125rem] leading-tight font-extrabold text-fg tabular-nums sm:text-[1.5rem]">
                <CountUp value={p.value} />
              </span>
            </span>
          );
          // 선 높이: 보통 20px · 휴대폰에서 tier 가 있으면 줄 간격(66px)만큼 더 길게
          const line = <span className="h-5 w-px bg-fg-2 max-sm:h-[var(--line-h)]" style={{ "--line-h": `${1.25 + tier * 4.125}rem` } as CSSProperties} />;
          return (
            <div
              key={p.country}
              data-testid="ruler-pin"
              data-value={p.value}
              data-x={p.x}
              data-side={p.side}
              aria-hidden
              className={`absolute flex -translate-x-1/2 flex-col items-center text-center ${p.side === "up" ? "bottom-1/2 mb-1.5" : "top-1/2 mt-1.5"}`}
              style={{ left: `${p.x}%` }}
            >
              {/* 위: 이름 · 숫자 → 선이 자로 내려감 / 아래: 선이 자에서 내려와 → 이름 · 숫자 */}
              {p.side === "up" ? (
                <>
                  {text}
                  {line}
                </>
              ) : (
                <>
                  {line}
                  {text}
                </>
              )}
            </div>
          );
        })}
        <div data-testid="ruler-korea" aria-hidden className="absolute top-1/2 -translate-x-1/2" style={{ left: `${korea}%` }}>
          <span className="absolute top-0 left-0 h-12 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-fg" />
          <span data-testid="ruler-korea-label" className="absolute top-8 left-0 -translate-x-1/2 text-small font-bold whitespace-nowrap text-fg max-sm:top-[calc(var(--ruler-h)/-2)]">한국 100</span>
        </div>
      </div>
    </section>
  );
}
