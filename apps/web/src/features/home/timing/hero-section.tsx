// 첫 화면 hero (작업 0380 · 시안 '기본 · 울트라마린 탑승권') — 왼쪽: 큰 제목 "N월에 떠나세요."(월만 노랑) · 한 줄 + 꼬리표 · 입력창 · 칩 / 오른쪽: 탑승권 세 장 · 노선 · 비행기 · 꼬리표
//   자료는 지금 그대로(travelTiming · travelTimingCopy · heroParts) — 지수가 없으면 큰 제목 대신 "아직 받지 못했습니다" (달을 지어내지 않음) · 탑승권 값은 홈이 받는 환율 · 신호에서만(없으면 빈 칸)
//   반응형: 1200 이상 글 왼쪽 · 탑승권 오른쪽 · 900~1199 나란히 · 899 이하 탑승권이 글 아래 가운데 (hero.css) · 노란 원(해 · 달) 없음
import type { RateRow, SignalRow } from "../common/destinations";
import { HeroAsk } from "../hero/hero-ask";
import { HeroDeckProvider } from "../hero/hero-deck";
import { heroPassView } from "../hero/hero-pass";
import type { HeroData } from "../hero/use-hero-deck";
import { HeroPasses } from "../hero/hero-passes";
import "../hero/hero.css";
import { HERO_GUIDE } from "./hero-guide";
import { type TravelTiming, heroParts, travelTimingCopy } from "./travel-timing";

export function HeroSection({ timing, rates = [], signals = [], windowDays = 90, levels = null, pageCodes = [] }: { timing: TravelTiming; rates?: RateRow[]; signals?: SignalRow[]; windowDays?: number; levels?: HeroData["levels"]; pageCodes?: readonly string[] }) {
  const copy = travelTimingCopy(timing);
  const parts = heroParts(timing);
  const view = heroPassView(rates, signals, windowDays, parts?.month ?? "");
  return (
    <section data-testid="home-hero" data-surface="dark" aria-labelledby="timing-title" className="hp-hero bg-surface text-fg">
      <HeroDeckProvider data={{ rates, signals, levels, windowDays, month: parts?.month ?? "", pageCodes }}>
        <div className="hp-inner">
          <div className="hp-copy">
            {parts ? (
              <>
                <h1 id="timing-title" className="hp-h1 hp-rise" data-i="0">
                  <span data-testid="hero-month" className="text-sun">
                    {parts.month}
                  </span>
                  {parts.rest}
                </h1>
                <p className="hp-one hp-rise" data-i="1">
                  <span data-testid="hero-lede">{copy.message}</span>
                  <span data-testid="hero-tag" className="hp-src">
                    {HERO_GUIDE.tag}
                  </span>
                </p>
              </>
            ) : (
              <h1 id="timing-title" className="hp-h1 hp-h1-none">
                {copy.message}
              </h1>
            )}
            <HeroAsk />
          </div>
          <HeroPasses tags={view.tags} monthLabel={view.monthLabel} />
        </div>
      </HeroDeckProvider>
    </section>
  );
}
