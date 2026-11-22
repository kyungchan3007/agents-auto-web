"use client";

// 찾기 창 (⌘K · Ctrl+K · 작업 0303 · 0312 에 admin-shell.tsx 에서 나눔) — 상태는 use-palette · 낱자 · 초성으로 찾음
import { pieces } from "../../search/match";
import { IconSearch } from "../icons/icons";
import type { usePalette } from "./use-palette";

export function Palette({ p }: { p: ReturnType<typeof usePalette> }) {
  const { q, found, cur, input, hide, choose, type, onInputKey, setSel } = p;
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: 바깥을 누르면 닫는 배경 (키보드는 Esc)
    <div className="adm-pal" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && hide()}>
      <div className="adm-pbox" role="dialog" aria-modal="true" aria-label="찾기">
        <label className="adm-pin">
          <IconSearch />
          <input
            ref={input}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls="adm-pl"
            aria-autocomplete="list"
            aria-activedescendant={found.length ? `adm-po-${cur}` : undefined}
            placeholder="화면 · 판 · 질문 · 규칙 찾기"
            autoComplete="off"
            value={q}
            onChange={(e) => type(e.target.value)}
            onKeyDown={onInputKey}
          />
        </label>
        <ul id="adm-pl" className="adm-pl" role="listbox" aria-label="찾은 것">
          {found.length === 0 && (
            <li className="none" role="presentation">
              찾는 것이 없습니다. 초성(예: ㄱㅅ)으로도 찾을 수 있습니다
            </li>
          )}
          {found.map(({ it, m }, i) => (
            <li
              key={`${it.group}-${it.label}-${i}`}
              id={`adm-po-${i}`}
              role="option"
              aria-selected={i === cur}
              onMouseMove={() => i !== cur && setSel(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(i);
              }}
            >
              <span className="w">
                {pieces(it.label, m.hits).map(([t, on], k) =>
                  // biome-ignore lint/suspicious/noArrayIndexKey: 조각 순서가 곧 키
                  on ? <mark key={k}>{t}</mark> : <span key={k}>{t}</span>,
                )}
              </span>
              <span className="h">{q ? it.group : it.hint}</span>
            </li>
          ))}
        </ul>
        <div className="adm-phint">
          <kbd>↑</kbd>
          <kbd>↓</kbd>
          <span>고르기</span>
          <kbd>Enter</kbd>
          <span>이동</span>
          <kbd>Esc</kbd>
          <span>닫기</span>
          <span style={{ marginLeft: "auto" }}>초성으로도 찾습니다</span>
        </div>
      </div>
    </div>
  );
}
