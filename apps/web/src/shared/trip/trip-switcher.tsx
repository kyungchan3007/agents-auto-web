"use client";

// 카드 안 여행지 바꾸기 — 자주 가는 곳 칩 한 줄(국기 + 이름 · 지금 고른 곳은 눌림 표시) + 같은 줄 검색 칸 (작업 0217 사용자 지적)
// 시트 · "내 여행지 고르기" 버튼 없음 — 누르면 바로 바뀜 · 목록에 없는 나라는 검색 칸으로 · 휴대폰은 칩이 줄바꿈(가로 스크롤 없음)
// 화면 약속: data-testid="trip-switcher"(전체) · "pick-chip"(칩 · aria-pressed) · combobox "여행지 검색" · listbox "여행지 제안" · option
import { TRAVEL_COUNTRIES } from "@hav/shared/travel";
import { useTripSwitcher } from "./use-trip-switcher";
import { Flag } from "@hav/ui/data/flag";
import { Input } from "@hav/ui/form/field";

export function TripSwitcher({ className = "" }: { className?: string }) {
  const s = useTripSwitcher();
  return (
    <div data-testid="trip-switcher" className={className}>
      <ul aria-label="자주 가는 곳" className="flex flex-wrap gap-2">
        {s.popular.map((hit) => {
          const on = s.isPicked(hit);
          const country = TRAVEL_COUNTRIES[hit.country];
          return (
            <li key={`${hit.country}-${hit.city}`}>
              <button
                type="button"
                data-testid="pick-chip"
                aria-pressed={on}
                onClick={() => s.choose(hit)}
                className={`tap-44 flex min-h-9 items-center gap-2 rounded-pill border-2 px-3 text-small font-bold transition-colors ${on ? "border-pin-cheap bg-pin-cheap text-foam" : "border-line bg-card text-fg hover:bg-surface-2"}`}
              >
                <Flag country={country?.flag ?? null} label={`${country?.name ?? hit.city} 국기`} className="h-3.5 w-5 shrink-0" />
                {hit.city}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="relative mt-3">
        <Input
          role="combobox"
          type="search"
          autoComplete="off"
          spellCheck={false}
          aria-label="여행지 검색"
          aria-autocomplete="list"
          aria-expanded={s.expanded}
          aria-controls={s.expanded ? s.ids.list : undefined}
          aria-activedescendant={s.activeId}
          placeholder="도시 · 나라 이름 (예: 도쿄)"
          value={s.query}
          onChange={s.onChange}
          onKeyDown={s.onInputKey}
          className="h-11"
        />
        {s.expanded && (
          <ul id={s.ids.list} role="listbox" aria-label="여행지 제안" className="absolute inset-x-0 bottom-full z-20 mb-1 max-h-64 overflow-y-auto rounded-[0.625rem] border-2 border-fg bg-card sm:top-full sm:bottom-auto sm:mt-1 sm:mb-0">
            {s.hits.map((hit, i) => (
              <li
                key={`${hit.country}-${hit.city}`}
                id={s.ids.option(i)}
                role="option"
                aria-selected={i === s.active}
                onClick={() => s.choose(hit)}
                onMouseDown={(e) => e.preventDefault()}
                onMouseMove={() => i !== s.active && s.setActive(i)}
                className={`cursor-pointer border-b border-line px-4 py-3 text-body text-fg last:border-b-0 ${i === s.active ? "bg-surface-2" : ""}`}
              >
                {hit.label}
              </li>
            ))}
          </ul>
        )}
        {s.empty && (
          <p role="status" className="mt-2 text-small text-fg-2">
            찾는 여행지가 없습니다 · 도시나 나라 이름으로 찾아 보세요
          </p>
        )}
      </div>
    </div>
  );
}
