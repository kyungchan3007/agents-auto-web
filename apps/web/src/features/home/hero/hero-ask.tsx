"use client";

// hero 왼쪽 입력창 · 칩 (작업 0380) — 그리기만 (상태는 use-hero-ask) · 기존 여행지 고르기와 같은 상태라 여기서 고르면 아래 탑승권 카드도 같은 나라로 바뀜
import { Flag } from "@hav/ui/data/flag";
import { TRAVEL_COUNTRIES } from "@hav/shared/travel";
import { HERO_GUIDE } from "../timing/hero-guide";
import { useHeroAsk } from "./use-hero-ask";

export function HeroAsk() {
  const a = useHeroAsk();
  return (
    <div className="hp-ask-wrap">
      <div className="hp-ask-box hp-rise" data-i="2">
        <form
          className="hp-ask"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            a.submit();
          }}
        >
          <input
            data-testid="hero-search"
            role="combobox"
            type="search"
            autoComplete="off"
            spellCheck={false}
            aria-label="여행지 검색"
            aria-autocomplete="list"
            aria-expanded={a.expanded}
            aria-controls={a.expanded ? a.ids.list : undefined}
            aria-activedescendant={a.activeId}
            placeholder={HERO_GUIDE.placeholder}
            value={a.query}
            onChange={a.onChange}
            onKeyDown={a.onKey}
          />
          <button type="submit" data-testid="hero-search-go">
            {HERO_GUIDE.button}
          </button>
        </form>
        {a.expanded && (
          <ul id={a.ids.list} role="listbox" aria-label="여행지 제안" className="hp-list">
            {a.hits.map((hit, i) => (
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
                {hit.label}
              </li>
            ))}
          </ul>
        )}
        {a.empty && (
          <p role="status" className="hp-empty">
            찾는 여행지가 없습니다 · 도시나 나라 이름으로 찾아 보세요
          </p>
        )}
      </div>
      <p className="hp-hint hp-rise" data-i="2">{HERO_GUIDE.hint}</p>
      <ul aria-label="자주 가는 곳" className="hp-chips hp-rise" data-i="3">
        {a.chips.map((hit) => (
          <li key={`${hit.country}-${hit.city}`}>
            <button type="button" data-testid="hero-chip" aria-pressed={a.isPicked(hit)} onClick={() => a.pick(hit)}>
              <Flag country={TRAVEL_COUNTRIES[hit.country]?.flag ?? null} label={`${TRAVEL_COUNTRIES[hit.country]?.name ?? hit.city} 국기`} className="h-3.5 w-5 shrink-0" />
              {hit.city}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
