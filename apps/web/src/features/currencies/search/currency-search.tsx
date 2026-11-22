"use client";

// 통화 검색 · 자동완성 — 목록 위 콤보박스 (작업 0192) · 코드 · 통화 이름 · 나라 · 도시로 찾고 고르면 그 통화 상세로
// 결과 없음 안내는 검색 칸 바로 아래에 겹쳐 띄움(absolute) — 아래 내용이 밀리지 않음 (작업 0248 · 12번)
// 화면 약속: data-testid="currency-search" · role=combobox / listbox / option · 제안은 최대 8줄
import { Input } from "@hav/ui/form/field";
import { useCurrencySearch } from "./use-currency-search";
import { emptyText, hitText } from "./search-view";

export function CurrencySearch({ codes }: { codes: string[] }) {
  const s = useCurrencySearch(codes);
  return (
    <div
      data-testid="currency-search"
      className="relative"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) s.close();
      }}
    >
      <Input
        role="combobox"
        type="search"
        autoComplete="off"
        spellCheck={false}
        aria-label="통화 검색"
        aria-autocomplete="list"
        aria-expanded={s.expanded}
        aria-controls={s.expanded ? s.listId : undefined}
        aria-activedescendant={s.activeId}
        placeholder="통화 · 나라 · 도시 검색"
        value={s.query}
        onChange={s.onChange}
        onKeyDown={s.onKeyDown}
        onFocus={s.onFocus}
      />
      {s.expanded && (
        <ul
          id={s.listId}
          role="listbox"
          aria-label="통화 제안"
          // 누를 때 입력칸이 포커스를 잃어 목록이 닫히지 않게 (마우스 · 터치 모두)
          onMouseDown={(e) => e.preventDefault()}
          className="absolute inset-x-0 top-full z-20 mt-1 max-h-80 overflow-y-auto rounded-[0.625rem] border-2 border-fg bg-card"
        >
          {s.hits.map((hit, i) => (
            <li
              key={hit.code}
              id={s.optionId(i)}
              role="option"
              aria-selected={i === s.active}
              onClick={() => s.choose(hit.code)}
              onMouseMove={() => i !== s.active && s.setActive(i)}
              className={`cursor-pointer border-b border-line px-4 py-3 text-body text-fg last:border-b-0 ${i === s.active ? "bg-surface-2" : ""}`}
            >
              {hitText(hit)}
            </li>
          ))}
        </ul>
      )}
      {s.empty && (
        <p role="status" className="absolute top-full left-0 mt-1.5 text-small whitespace-nowrap text-fg-2">
          {emptyText(codes.length)}
        </p>
      )}
    </div>
  );
}
