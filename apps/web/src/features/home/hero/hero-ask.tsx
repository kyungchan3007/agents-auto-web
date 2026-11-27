"use client";

// hero 왼쪽 입력창 · 칩 · 고른 곳 숫자 칸 (작업 0380 · 0393) — 그리기만 (상태는 use-hero-ask) · 기존 여행지 고르기와 같은 상태라 여기서 고르면 아래 탑승권 카드도 같은 나라로 바뀜
import { Flag } from "@hav/ui/data/flag";
import { TRAVEL_COUNTRIES } from "@hav/shared/travel";
import { HERO_GUIDE } from "../timing/hero-guide";
import { HeroPickFacts } from "./hero-pick-facts";
import { useHeroAsk } from "./use-hero-ask";

export function HeroAsk() {
  const { mountInput, ...a } = useHeroAsk();
  return (
    <div className="hp-ask-wrap">
      <div className="hp-ask-box hp-rise" data-i="2">
        <form
          className="hp-ask"
          data-surface="light"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            a.submit();
          }}
        >
          <input
            ref={mountInput}
            data-testid="hero-search"
            role="combobox"
            type="search"
            autoComplete="off"
            spellCheck={false}
            aria-label={HERO_GUIDE.placeholder}
            aria-autocomplete="list"
            aria-expanded={a.expanded}
            aria-controls={a.expanded ? a.ids.list : undefined}
            aria-activedescendant={a.activeId}
            placeholder={HERO_GUIDE.placeholder}
            value={a.query}
            onChange={a.onChange}
            onKeyDown={a.onKey}
          />
          <button type="submit" data-testid="hero-go">
            {HERO_GUIDE.button}
          </button>
        </form>
        {a.expanded && (
          <ul id={a.ids.list} role="listbox" aria-label="도시 · 나라 제안" className="hp-list">
            {a.hits.map(({ hit, code }, i) => (
              <li
                key={`${hit.country}-${hit.city}`}
                id={a.ids.option(i)}
                role="option"
                aria-selected={i === a.active}
                onClick={() => a.pick(hit)}
                onMouseDown={(e) => e.preventDefault()}
                onMouseMove={() => i !== a.active && a.setActive(i)}
                data-active={String(i === a.active)}
              >
                <span>{hit.label}</span>
                <span data-testid="hero-suggest-code" className="hp-code-sug">
                  {code}
                </span>
              </li>
            ))}
          </ul>
        )}
        {a.empty && (
          <p role="status" className="hp-empty">
            찾는 여행지가 없습니다
          </p>
        )}
      </div>
      <p data-testid="hero-sub" className="hp-hint hp-rise" data-i="2">{HERO_GUIDE.hint}</p>
      <ul aria-label="자주 찾는 곳" className="hp-chips hp-rise" data-i="3">
        {a.chips.map((hit) => (
          <li key={`${hit.country}-${hit.city}`}>
            <button type="button" data-testid="hero-chip" aria-pressed={a.isPicked(hit)} onClick={() => a.pick(hit)}>
              <Flag country={TRAVEL_COUNTRIES[hit.country]?.flag ?? null} label={`${TRAVEL_COUNTRIES[hit.country]?.name ?? hit.city} 국기`} className="h-3.5 w-5 shrink-0" />
              {hit.city}
            </button>
          </li>
        ))}
      </ul>
      <HeroPickFacts />
    </div>
  );
}
