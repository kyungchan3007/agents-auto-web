// 1 첫 화면 — 오늘 달러 환율 · 지구본 · 🌏 호 색 = 그 나라 통화 신호
import { SOURCE_NAME, headline, percentileText, rateText } from "@hav/shared/currency";
import { CountUp } from "@hav/ui/count-up";
import { Reveal } from "@hav/ui/reveal";
import { Section } from "@hav/ui/section";
import { SignalBadge } from "@hav/ui/signal-badge";
import { CurrencyFlag as Flag } from "@/shared/currency-flag";
import { DateText } from "@/shared/date-text";
import { FreshnessNote } from "@/shared/freshness-note";
import { GlobeLazy } from "@/shared/three-lazy";
import { HERO, type HomeView } from "./home-data";
import { NoData } from "./no-data";
import { DESTINATIONS, EARTH_TEXTURE, SEOUL } from "./places";

export function HeroSection({ view }: { view: HomeView }) {
  const { hero, heroSignal, problem, windowDays, bySignal } = view;
  return (
    <Section id="today">
      <div className="grid items-center gap-6 lg:grid-cols-[1.05fr_1fr]">
      {hero ? (
        <Reveal>
          {/* 작은 제목은 큰 제목 바로 위에 붙임 — 섹션 위에 두면 지구본 높이만큼 떨어져 보였음 */}
          <p className="flex items-center gap-2 text-eyebrow font-semibold text-fg-2">
            <Flag currency={HERO} />
            오늘의 환율 · <DateText date={hero.date} /> 기준 · {SOURCE_NAME[hero.source]}
          </p>
          <FreshnessNote date={hero.date} className="mt-2" />
          <h1 className="mt-4 text-title font-semibold tracking-tight text-fg">{headline(HERO, heroSignal?.signal ?? null)}</h1>
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
        <NoData reason={problem ?? "달러 환율이 아직 수집되지 않았습니다"} />
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
