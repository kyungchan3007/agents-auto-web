"use client";

// 여행지 고르기 — 버튼 + 아래에서 올라오는 시트 (작업 0201) · 휴대폰은 인트로가 없어 여기서 고름 · 홈 안내판 아래 · 여행 물가 "다른 나라 보기" 가 같이 씀
// 시트는 늘 밝은 면(data-surface="light") — 어두운 머리(여행 물가 파랑 면) 안에서 열려도 흰 면 · 남색 글자 + 그림자로 뒤 화면과 나눔 (작업 0248 · 3번)
// 화면 약속: data-testid="pick-trip-open"(버튼 · testId 로 바꿈) · role=dialog(이름 "어디로 떠나세요?") · combobox "여행지 검색" · "pick-chip"(자주 가는 곳)
import { usePickTrip, useSheetMounted } from "./use-pick-trip";
import { Input } from "@hav/ui/form/field";

// variant: outline(기본 · 테두리 알약) · solid(파랑 면 알약 · 흰 글자 — 새 홈 탑승권 카드 · 작업 0217)
const BUTTON = {
  outline: "border-2 border-cheap px-5 text-body font-semibold text-cheap hover:bg-surface-2",
  solid: "bg-pin-cheap px-6 text-body font-bold text-foam hover:bg-pin-ink",
} as const;

const CLOSE_MS = 300;

export function PickTrip({ label, changeLabel, testId = "pick-trip-open", className = "", variant = "outline" }: { label: string; /** 이미 골랐을 때 버튼 글 (없으면 label 그대로) */ changeLabel?: string; testId?: string; className?: string; variant?: keyof typeof BUTTON }) {
  const s = usePickTrip();
  // 닫는 움직임(작업 0252): 닫혀도 움직임 시간(CLOSE_MS) 동안 시트를 남겼다가 지움 · 움직임 줄이기는 바로 지움 · 그동안 inert 로 초점 · 누르기를 막음
  const mounted = useSheetMounted(s.open, CLOSE_MS);
  const state = s.open ? "open" : "closed";
  return (
    <>
      <button
        type="button"
        data-testid={testId}
        aria-haspopup="dialog"
        onClick={s.show}
        className={`min-h-11 rounded-pill ${BUTTON[variant]} ${className}`}
      >
        {s.picked ? (changeLabel ?? label) : label}
      </button>
      {(s.open || mounted) && (
        <div data-state={state} inert={!s.open} className="group fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center">
          <div aria-hidden onClick={s.close} className="absolute inset-0 bg-pin-ink/60 transition-opacity duration-300 ease-out starting:opacity-0 group-data-[state=closed]:opacity-0 motion-reduce:transition-none" />
          <div
            role="dialog"
            data-surface="light"
            aria-modal="true"
            aria-labelledby={s.ids.title}
            onKeyDown={s.onDialogKey}
            className="relative max-h-[85svh] w-full overflow-y-auto rounded-t-[1.5rem] bg-card px-5 pt-6 pb-8 text-fg shadow-[0_24px_48px_-20px_rgba(14,22,72,0.55)] transition-[transform,opacity] duration-300 ease-out starting:translate-y-full group-data-[state=closed]:translate-y-full motion-reduce:transition-none sm:max-w-lg sm:rounded-[1.5rem] sm:duration-200 sm:starting:translate-y-0 sm:starting:scale-[0.96] sm:starting:opacity-0 sm:group-data-[state=closed]:translate-y-0 sm:group-data-[state=closed]:scale-[0.96] sm:group-data-[state=closed]:opacity-0"
          >
            <div className="flex items-start justify-between gap-4">
              <h2 id={s.ids.title} className="text-[1.375rem] leading-tight font-bold text-cheap">
                어디로 떠나세요?
              </h2>
              <button type="button" onClick={s.close} aria-label="닫기" className="-mt-1 -mr-2 grid size-11 place-items-center rounded-pill text-[1.375rem] text-fg-2 hover:bg-surface-2">
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
                <ul id={s.ids.list} role="listbox" aria-label="여행지 제안" className="mt-2 max-h-64 overflow-y-auto rounded-[0.625rem] border-2 border-fg bg-card">
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
                  <button type="button" data-testid="pick-chip" onClick={() => s.choose(hit)} className="min-h-11 rounded-pill border-2 border-cheap px-4 text-body text-cheap hover:bg-surface-2">
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
