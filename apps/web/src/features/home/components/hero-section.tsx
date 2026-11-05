// 1 첫 화면 — 오늘 달러 환율 · 지구본 · 🌏 호 색 = 그 나라 통화 신호
import { SOURCE_NAME, headline, percentileText, rateText } from "@hav/shared/currency";
import { CountUp } from "@hav/ui/motion/count-up";
import { Reveal } from "@hav/ui/motion/reveal";
import { Section } from "@hav/ui/layout/section";
import { SignalBadge } from "@hav/ui/data/signal-badge";
import { CurrencyFlag as Flag } from "@hav/ui/data/currency-flag";
import { DateText } from "@hav/ui/text/date-text";
import { FreshnessNote } from "@hav/ui/feedback/freshness-note";
import { GlobeLazy } from "@hav/ui/three/scene/lazy";
import { HERO, type HomeView } from "../lib/home-data";
import { DESTINATIONS, EARTH_TEXTURE, SEOUL } from "../lib/places";
import { Eyebrow, Title } from "@hav/ui/text/heading";
import { EmptyState } from "@hav/ui/feedback/empty-state";

export function HeroSection({ view }: { view: HomeView }) {
  const { hero, heroSignal, problem, windowDays, bySignal } = view;
  return (
    <Section id="today">
      <div className="grid items-center gap-6 lg:grid-cols-[1.05fr_1fr]">
      {hero ? (
        <Reveal>
          {/* 작은 제목은 큰 제목 바로 위에 붙임 — 섹션 위에 두면 지구본 높이만큼 떨어져 보였음 */}
          <Eyebrow className="flex items-center gap-2">
            <Flag currency={HERO} />
            오늘의 환율 · <DateText date={hero.date} /> 기준 · {SOURCE_NAME[hero.source]}
          </Eyebrow>
          <FreshnessNote date={hero.date} className="mt-2" />
          <Title as="h1" className="mt-4 text-fg">{headline(HERO, heroSignal?.signal ?? null)}</Title>
          <p className="mt-6 text-hero font-bold tracking-tighter whitespace-nowrap">
            <CountUp text={rateText(hero).value} className="text-aurora" />
            <span className="ml-3 text-title font-semibold text-fg">{rateText(hero).unit}</span>
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {heroSignal?.signal && <SignalBadge signal={heroSignal.signal} />}
            <span className="text-sm text-fg-2">{percentileText(heroSignal?.signal ?? null, heroSignal?.percentile ?? null, windowDays)} · 예측 아님</span>
          </div>
        </Reveal>
      ) : (
        <EmptyState>{problem ?? "달러 환율이 아직 수집되지 않았습니다"}</EmptyState>
      )}
        {/* 🌏 호 색 = 그 나라 통화 신호 · 3D 가 안 되면 이 칸만 빔 (글자는 그대로) */}
        <GlobeLazy
          className="h-[320px] w-full sm:h-[420px] lg:h-[520px]"
          origin={SEOUL}
          texture={EARTH_TEXTURE}
          arcs={DESTINATIONS.map((d) => ({ to: d, tone: bySignal.get(d.currency ?? "")?.signal ?? null }))}
        />
      </div>
    </Section>
  );
}
