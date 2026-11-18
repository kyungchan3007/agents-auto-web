// 한국 = 100 물가 자 — 싼 곳 · 비슷한 곳 · 비싼 곳을 자 하나에 먼저 찍고 아래 세 칸 표로 풀어 줌 (작업 0220 · 시안 B → 그래프 2D 시안 F)
// 점 = 지금 세 칸 표의 맨 위 나라들(실제 자료) · 위치 = 물가 숫자 비율(ruler.ts) · 그림 · 움직임(자 뻗음 → 나라 싼 순 → 한국 100 선)은 RulerChart(@hav/ui) · 숫자는 화면에 들어올 때 한 번 카운트업 · 나라가 없으면 그리지 않음
import { TRAVEL_COUNTRIES } from "@hav/shared/travel";
import { RulerChart } from "@hav/ui/data/ruler-chart";
import { Eyebrow, Title } from "@hav/ui/text/heading";
import type { PriceBand } from "../lib/bands";
import { rulerMaxTier, rulerPins, rulerScale, rulerTiers, rulerX } from "../lib/ruler";

/** 자 색 띠 — 싼 쪽 파랑 → 한국 근처 옅게 → 비싼 쪽 빨강 (한국 100 기준 · 시안 F) */
const STOPS = (lo: number, hi: number) => {
  const p = (v: number) => Math.min(100, Math.max(0, ((v - lo) / (hi - lo)) * 100));
  return [
    { pct: 0, color: "var(--hav-pin-cheap)" },
    { pct: p(60), color: "color-mix(in srgb, var(--hav-pin-cheap) 78%, var(--hav-card))" },
    { pct: p(88), color: "color-mix(in srgb, var(--hav-pin-cheap) 32%, var(--hav-card))" },
    { pct: p(100), color: "color-mix(in srgb, var(--hav-pin-line) 10%, var(--hav-card))" },
    { pct: p(108), color: "color-mix(in srgb, var(--hav-pin-expensive) 45%, var(--hav-card))" },
    { pct: 100, color: "var(--hav-pin-expensive)" },
  ];
};

export function PriceRuler({ bands }: { bands: PriceBand[] }) {
  const pins = rulerPins(bands);
  if (pins.length === 0) return null;
  const scale = rulerScale(pins.map((p) => p.value));
  const korea = rulerX(100, scale);
  // 휴대폰: 라벨이 겹치면 한 줄(tier) 더 떨어뜨리고 자 높이를 그만큼 키움 (작업 0220 lead 지시 · 넓은 화면은 그대로)
  const tiers = rulerTiers(pins);
  const maxTier = rulerMaxTier(tiers);
  const label = `물가 자(한국 = 100). ${[...pins.map((p) => ({ n: p.name, v: p.value })), { n: "한국", v: 100 }].sort((a, b) => a.v - b.v).map((p) => `${p.n} ${p.v}`).join(", ")}`;
  const ticks = Array.from({ length: Math.floor((scale.hi - Math.ceil(scale.lo / 10) * 10) / 10) + 1 }, (_, i) => Math.ceil(scale.lo / 10) * 10 + i * 10).map((v) => ({ v, pct: rulerX(v, scale), big: v % 20 === 0 }));
  return (
    <section aria-labelledby="ruler-title" className="mb-12">
      <Eyebrow>한국 = 100</Eyebrow>
      <Title as="h2" id="ruler-title" className="mt-3 text-fg">
        한국보다 싼 곳 · 비슷한 곳 · 비싼 곳
      </Title>
      <RulerChart
        aria={label}
        korea={korea}
        maxTier={maxTier}
        lo={scale.lo}
        hi={scale.hi}
        stops={STOPS(scale.lo, scale.hi)}
        ticks={ticks}
        pins={pins.map((p) => ({ id: p.country, name: p.name, flag: TRAVEL_COUNTRIES[p.country]?.flag ?? null, value: p.value, x: p.x, side: p.side, tier: tiers[p.country] ?? 0 }))}
      />
    </section>
  );
}
