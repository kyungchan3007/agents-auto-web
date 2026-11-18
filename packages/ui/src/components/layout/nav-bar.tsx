"use client";

// 따라오는 상단 메뉴 — 모든 페이지에서 브랜드 파랑(바다 띠 바탕) 면 · 로고 'flap' 흰 + 'fx' 노랑(배지 없음) · 메뉴 글자 흰색 · 지금 페이지는 흰 알약(파랑 글자) (작업 0216 · 시안 C/header-blue · 로고 2안 B)
// 데스크톱(sm 이상): 메뉴를 한 줄로 바로 보임 · 모바일: 로고 + 메뉴 버튼 → 누르면 메뉴가 아래로 펼쳐짐 (키보드 · 화면 읽기 프로그램으로 열고 닫음: button · aria-expanded · aria-controls · Esc)
// 높이는 한 줄 기준이고 펼친 메뉴는 아래로 얹혀 높이를 바꾸지 않음 — 고정 높이를 쓰는 곳은 tokens.css 의 --hav-nav-h 를 봄
import { type ReactNode, useEffect, useId, useRef, useState } from "react";

/** current = 지금 보고 있는 페이지 (글자가 진하고 화면 읽기 프로그램에도 알림) */
export type NavLink = { href: string; label: string; current?: boolean };

/** accent = 로고 끝에서 노랑으로 칠할 글자 (title 이 그 글자로 끝날 때만 · 글자가 끊겨도 화면 읽기 이름은 title 그대로) */
export function NavBar({ title, accent = "fx", logo, links, action }: { title: string; accent?: string; logo?: ReactNode; links: NavLink[]; action?: ReactNode }) {
  const head = accent && title.endsWith(accent) ? title.slice(0, -accent.length) : title;
  const tail = accent && title.endsWith(accent) ? accent : "";
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const button = useRef<HTMLButtonElement>(null);

  // 열려 있을 때 Esc 로 닫고 포커스를 버튼으로 돌려줌
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // 데스크톱은 메뉴가 로고 바로 오른쪽부터 왼쪽 정렬 · 15px 알약 링크 (작업 0216 · 예전 Figma 메뉴/데스크톱 작업 0170)
  // 좌우 여백은 header 에 · 폭은 본문과 같은 max-w-page — 본문 컨테이너(main px-4 sm:px-8 → mx-auto max-w-page)와 로고 왼쪽 선이 같음 (작업 0170 · Figma 01)
  return (
    <header data-surface="dark" className="sticky top-0 z-50 bg-surface px-4 sm:px-8">
      <nav className="relative mx-auto flex h-14 max-w-page items-center justify-between gap-6 text-fg sm:h-18 sm:justify-start sm:gap-14">
        <a href="/" className="flex shrink-0 items-center gap-2 font-display text-[1.375rem] font-extrabold tracking-[-0.05em] text-foam sm:text-[1.75rem]">
          {logo}
          <span>
            {head}
            {tail && (
              <b data-accent className="font-extrabold text-sun">
                {tail}
              </b>
            )}
          </span>
        </a>
        <button
          ref={button}
          type="button"
          aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((v) => !v)}
          className="-mr-2 inline-flex size-10 items-center justify-center rounded-field text-foam focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foam sm:hidden"
        >
          <svg aria-hidden viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
        {/* 모바일: 닫혀 있으면 숨김 · 열리면 로고 줄 아래로 펼침 / 데스크톱: 항상 한 줄 */}
        <ul
          id={menuId}
          className={`${open ? "flex" : "hidden"} absolute top-full -right-4 -left-4 flex-col gap-1 bg-surface px-4 pt-2 pb-5 text-body font-semibold sm:static sm:flex sm:flex-row sm:items-center sm:gap-0.5 sm:bg-transparent sm:p-0 sm:text-[0.9375rem] sm:font-normal`}
        >
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                aria-current={l.current ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={`block rounded-full px-3.5 py-2 whitespace-nowrap transition-colors sm:py-1.5 ${l.current ? "bg-foam font-bold text-pin-cheap" : "text-foam/85 hover:bg-foam/10 hover:text-foam"}`}
              >
                {l.label}
              </a>
            </li>
          ))}
          {action && <li className="hidden sm:block">{action}</li>}
        </ul>
      </nav>
    </header>
  );
}
