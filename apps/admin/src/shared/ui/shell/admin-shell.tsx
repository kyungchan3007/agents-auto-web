"use client";

// 어드민 틀 (작업 0303 · 시안 Version 6) — 왼쪽 메뉴(찾기 · 화면들 · 사이트로 가기) · 휴대폰은 위쪽 탭 · 화면 목록과 사이트 주소는 쓰는 쪽이 넘김
//   고정폭 글꼴은 --font-adm-mono (앱 layout 이 next/font 로 넣음 · 없으면 시스템 고정폭)
//   찾기 창(⌘K · Ctrl+K): 세 화면 + 지금 화면의 [data-cmd] 요소(판 · 질문 · 규칙 · 궁금한 것)를 낱자 · 초성으로 찾음
//   단축키: 1 · 2 · 3 화면 · / 걸러 보기 칸([data-key-slash]) · R 다시 받기([data-key-r]) — 글을 입력하는 중에는 쓰지 않음
//   주소 끝 #판id 로 들어오면 그 판으로 스크롤 · 판은 들어올 때 차례로 올라옴(CSS · 움직임 줄이기면 없음)
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { flashPanel } from "../events/admin-events";
import { match, pieces } from "../../search/match";
import { IconGeo, IconHow, IconLog, IconMegaphone, IconOut, IconSearch } from "../icons/icons";
import "../admin.css";

/** 어드민 화면 하나 — key 는 단축키(숫자 한 글자) · icon 은 아래 ICONS 이름 */
export type AdminNavPage = { id: string; href: string; label: string; short: string; key: string; icon: keyof typeof ICONS };

const ICONS = { log: IconLog, geo: IconGeo, how: IconHow, marketing: IconMegaphone } satisfies Record<string, () => ReactNode>;

type Item = { group: string; label: string; hint: string; run: () => void };

function collect(pages: AdminNavPage[], page: string, site: { href: string; label: string }): Item[] {
  const go = (href: string) => () => {
    location.href = href;
  };
  const screens = pages.map((p) => ({ group: "화면", label: p.label, hint: p.key, run: p.id === page ? () => scrollTo({ top: 0, behavior: "smooth" }) : go(p.href) }));
  const here = pages.find((p) => p.id === page)?.label ?? "";
  const dom = [...document.querySelectorAll<HTMLElement>("[data-cmd]")].map((el) => ({
    group: el.dataset.cmd ?? "",
    label: el.dataset.cmdLabel ?? el.textContent?.trim() ?? "",
    hint: here,
    run: () => {
      const ev = new CustomEvent("adm-pick", { cancelable: true, bubbles: true });
      if (el.dispatchEvent(ev)) flashPanel(el);
    },
  }));
  return [...screens, ...dom, { group: "할 일", label: "사이트로 가기", hint: site.label, run: go(site.href) }];
}

export function AdminShell({
  brand,
  pages,
  page,
  site,
  children,
}: {
  brand: string;
  pages: AdminNavPage[];
  page: string;
  site: { href: string; label: string };
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const [items, setItems] = useState<Item[]>([]);
  const [toastText, setToastText] = useState("");
  const [toastOn, setToastOn] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const last = useRef<HTMLElement | null>(null);
  const mainRef = useRef<HTMLElement>(null);
  const [mod, setMod] = useState("⌘K");

  const show = useCallback(() => {
    last.current = document.activeElement as HTMLElement | null;
    setItems(collect(pages, page, site));
    setQ("");
    setSel(0);
    setOpen(true);
  }, [pages, page, site]);
  const hide = useCallback(() => {
    setOpen(false);
    last.current?.focus?.();
  }, []);

  // 판이 차례로 올라오게 순서 · #판id 로 들어오면 그 판으로
  useEffect(() => {
    mainRef.current?.querySelectorAll<HTMLElement>(":scope > *").forEach((el, i) => el.style.setProperty("--o", String(i)));
    if (!/Mac|iPhone|iPad/.test(navigator.platform)) setMod("Ctrl K");
    const toHash = () => {
      const id = decodeURIComponent(location.hash.slice(1));
      if (id) flashPanel(document.getElementById(id));
    };
    const t = window.setTimeout(toHash, 60);
    window.addEventListener("hashchange", toHash);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("hashchange", toHash);
    };
  }, []);

  // 알림
  useEffect(() => {
    let t = 0;
    const on = (e: Event) => {
      setToastText(String((e as CustomEvent).detail));
      setToastOn(true);
      window.clearTimeout(t);
      t = window.setTimeout(() => setToastOn(false), 1800);
    };
    window.addEventListener("adm-toast", on);
    return () => window.removeEventListener("adm-toast", on);
  }, []);

  // 단축키
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) hide();
        else show();
        return;
      }
      const a = document.activeElement as HTMLElement | null;
      const typing = !!a && (/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) || a.isContentEditable);
      if (typing || open || e.metaKey || e.ctrlKey || e.altKey) return;
      const p = pages.find((x) => x.key === e.key);
      if (p) {
        if (p.id !== page) location.href = p.href;
        return;
      }
      if (e.key === "/") {
        const f = document.querySelector<HTMLInputElement>("[data-key-slash]");
        if (f) {
          e.preventDefault();
          f.scrollIntoView({ block: "center" });
          f.focus({ preventScroll: true });
        }
      } else if (e.key.toLowerCase() === "r") document.querySelector<HTMLButtonElement>("[data-key-r]")?.click();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, pages, page, show, hide]);

  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  const found = items
    .map((it) => ({ it, m: match(it.label, q) ?? (q && match(it.group, q) ? { hits: [], score: 1 } : null) }))
    .filter((x): x is { it: Item; m: NonNullable<ReturnType<typeof match>> } => x.m !== null)
    .sort((a, b) => (q ? b.m.score - a.m.score : 0))
    .slice(0, 40);
  const cur = Math.min(sel, Math.max(found.length - 1, 0));
  const choose = (i: number) => {
    const f = found[i];
    if (!f) return;
    setOpen(false);
    f.it.run();
  };

  return (
    <div className="adm">
      <header className="adm-mtop">
        <a className="adm-brand" href={pages[0]?.href ?? "/"}>
          <b>{brand}</b>
          <span>어드민</span>
        </a>
        <nav aria-label="어드민 메뉴">
          {pages.map((p) => (
            <a key={p.id} href={p.href} aria-current={p.id === page ? "page" : undefined}>
              {p.short}
            </a>
          ))}
        </nav>
        <button type="button" className="adm-mfind" aria-label="찾기" onClick={show}>
          <IconSearch />
        </button>
      </header>
      <div className="adm-shell">
        <aside className="adm-side">
          <a className="adm-brand" href={pages[0]?.href ?? "/"}>
            <b>{brand}</b>
            <span>어드민</span>
          </a>
          <button type="button" className="adm-find" onClick={show} aria-label={`찾기 (${mod})`}>
            <IconSearch />
            찾기
            <kbd>{mod.replace(" ", "")}</kbd>
          </button>
          <nav className="adm-nav" aria-label="어드민 메뉴">
            {pages.map((p) => {
              const Icon = ICONS[p.icon];
              return (
              <a key={p.id} href={p.href} aria-current={p.id === page ? "page" : undefined}>
                <Icon />
                {p.label}
                <kbd>{p.key}</kbd>
              </a>
              );
            })}
          </nav>
          <nav className="adm-nav foot" aria-label="사이트">
            <a href={site.href}>
              <IconOut />
              사이트로 가기
            </a>
          </nav>
        </aside>
        <main id="main" ref={mainRef} tabIndex={-1} className="adm-main">
          {children}
        </main>
      </div>

      {open && (
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
                onChange={(e) => {
                  setQ(e.target.value);
                  setSel(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                    e.preventDefault();
                    if (!found.length) return;
                    const n = (cur + (e.key === "ArrowDown" ? 1 : -1) + found.length) % found.length;
                    setSel(n);
                    document.getElementById(`adm-po-${n}`)?.scrollIntoView({ block: "nearest" });
                  } else if (e.key === "Enter") {
                    e.preventDefault();
                    choose(cur);
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    hide();
                  } else if (e.key === "Tab") e.preventDefault();
                }}
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
      )}
      <div className={`adm-toast${toastOn ? " on" : ""}`} role="status" aria-live="polite">
        {toastText}
      </div>
    </div>
  );
}
