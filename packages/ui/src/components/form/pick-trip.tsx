"use client";

// 여행지 고르기 — 버튼 + 아래에서 올라오는 시트 (작업 0201) · 휴대폰은 인트로가 없어 여기서 고름 · 홈 안내판 아래 · 여행 물가 "다른 나라 보기" 가 같이 씀
// 화면 약속: data-testid="pick-trip-open"(버튼 · testId 로 바꿈) · role=dialog(이름 "어디로 떠나세요?") · combobox "여행지 검색" · "pick-chip"(자주 가는 곳)
import { usePickTrip } from "../../hooks/use-pick-trip";
import { Input } from "./field";

export function PickTrip({ label, changeLabel, testId = "pick-trip-open", className = "" }: { label: string; /** 이미 골랐을 때 버튼 글 (없으면 label 그대로) */ changeLabel?: string; testId?: string; className?: string }) {
  const s = usePickTrip();
  return (
    <>
      <button
        type="button"
        data-testid={testId}
        aria-haspopup="dialog"
        onClick={s.show}
        className={`min-h-11 rounded-pill border-2 border-cheap px-5 text-body font-semibold text-cheap hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cheap ${className}`}
      >
        {s.picked ? (changeLabel ?? label) : label}
      </button>
      {s.open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center">
          <div aria-hidden onClick={s.close} className="absolute inset-0 bg-pin-ink/60" />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={s.ids.title}
            onKeyDown={s.onDialogKey}
            className="relative max-h-[85svh] w-full overflow-y-auto rounded-t-card bg-card px-5 pt-6 pb-8 text-fg transition-transform duration-300 starting:translate-y-full motion-reduce:transition-none sm:max-w-lg sm:rounded-card"
          >
            <div className="flex items-start justify-between gap-4">
              <h2 id={s.ids.title} className="text-[1.375rem] leading-tight font-bold text-cheap">
                어디로 떠나세요?
              </h2>
              <button type="button" onClick={s.close} aria-label="닫기" className="-mt-1 -mr-2 grid size-11 place-items-center rounded-pill text-[1.5rem] text-fg-2 hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-cheap">
                ×
              </button>
            </div>
            <div className="relative mt-4">
              <Input
                id={s.ids.input}
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
              />
              {s.expanded && (
                <ul id={s.ids.list} role="listbox" aria-label="여행지 제안" className="mt-2 max-h-64 overflow-y-auto rounded-field border-2 border-fg bg-card">
                  {s.hits.map((hit, i) => (
                    <li
                      key={`${hit.country}-${hit.city}`}
                      id={s.ids.option(i)}
                      role="option"
                      aria-selected={i === s.active}
                      onClick={() => s.choose(hit)}
                      onMouseMove={() => i !== s.active && s.setActive(i)}
                      className={`cursor-pointer border-b border-line px-4 py-3 text-body last:border-b-0 ${i === s.active ? "bg-surface-2" : ""}`}
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
            <p className="mt-5 text-small text-fg-2">자주 가는 곳</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {s.popular.map((hit) => (
                <li key={`${hit.country}-${hit.city}`}>
                  <button type="button" data-testid="pick-chip" onClick={() => s.choose(hit)} className="min-h-11 rounded-pill border-2 border-cheap px-4 text-body text-cheap hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cheap">
                    {hit.city}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
