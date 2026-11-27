"use client";

// 칩 아래 숫자 칸 (작업 0393 · 글래스) — 그리기만 · 값은 deck.facts(맨 앞 탑승권 도시를 따라가고 · 고르면 고른 곳) · 받지 못한 값은 "-" · 칸 높이는 늘 같음
import { useHeroDeckValue } from "./use-hero-deck-context";

const NONE = "-";

export function HeroPickFacts() {
  const { facts, link, mine } = useHeroDeckValue();
  if (!facts) return null;
  return (
    <section data-testid="hero-facts" className="hp-facts" aria-live="polite" aria-label="고른 곳 숫자">
      <div className="hp-facts-hd">
        <span data-testid="hero-facts-title" className="hp-facts-title">
          {facts.title}
        </span>
        <small>오늘 기준</small>
        {mine && (
          <span data-testid="hero-facts-mine" className="hp-facts-tag">
            고른 곳
          </span>
        )}
      </div>
      <div className="hp-facts-st">
        <div>
          <small>오늘 환율</small>
          <b data-testid="hero-fact-rate">
            {facts.rateText ?? NONE}
            {facts.rateText && facts.perText && (
              <>
                {" "}
                <i>/ {facts.perText}</i>
              </>
            )}
          </b>
        </div>
        <div>
          <small>1만원이면</small>
          <b data-testid="hero-fact-tenk">
            {facts.tenKValue ?? NONE}
            {facts.tenKValue && facts.tenKUnit && <i>{facts.tenKUnit}</i>}
          </b>
        </div>
        <div>
          <small>물가</small>
          <b data-testid="hero-fact-price" className="hp-facts-y">
            {facts.priceText ?? NONE}
          </b>
        </div>
      </div>
      <div className="hp-facts-rng">
        <div className="hp-facts-t">
          <span>90일 중간 {facts.medianText ?? NONE}</span>
          <span>오늘 {facts.rateText ?? NONE}</span>
        </div>
        <div data-testid="hero-fact-bar" role="img" aria-label={facts.position === null ? "90일 위치를 받지 못했습니다" : `오늘 환율은 최근 90일 중 ${facts.position}%의 날보다 쌉니다`} className="hp-facts-bar">
          {facts.position !== null && <i style={{ left: `${facts.position}%` }} />}
        </div>
      </div>
      <div className="hp-facts-ft">
        <span data-testid="hero-fact-position">{facts.positionText ?? NONE}</span>
        <div>
          {link && (
            <a data-testid="hero-fact-link" href={link.href}>
              {link.name} 물가 · 환율 자세히 보기 ›
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
