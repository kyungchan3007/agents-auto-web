"use client";

// 어드민 틀 (작업 0303 · 시안 Version 6) — 왼쪽 메뉴(찾기 · 화면들 · 사이트로 가기) · 휴대폰은 위쪽 탭 · 화면 목록과 사이트 주소는 쓰는 쪽이 넘김
//   고정폭 글꼴은 --font-adm-mono (앱 layout 이 next/font 로 넣음 · 없으면 시스템 고정폭)
//   찾기 창(⌘K · Ctrl+K): 화면들 + 지금 화면의 [data-cmd] 요소(판 · 질문 · 규칙 · 궁금한 것)를 낱자 · 초성으로 찾음 (palette.tsx · use-palette)
//   단축키(use-shell-keys) · 주소 끝 #판id 로 들어오면 그 판으로 스크롤(use-shell-mount) · 알림(use-toast) — 이 파일은 그리기만 (작업 0312)
import type { ReactNode } from "react";
import { IconCamera, IconChart, IconGeo, IconHow, IconLog, IconMegaphone, IconOut, IconSearch } from "../icons/icons";
import { Palette } from "./palette";
import { type AdminNavPage, type SiteLink, kbdText } from "./palette-items";
import { usePalette } from "./use-palette";
import { useShellKeys } from "./use-shell-keys";
import { useShellMount } from "./use-shell-mount";
import { useToast } from "./use-toast";
import "../admin.css";

export type { AdminNavPage };

/** 채용 담당자(owner 아닌 세션)에게만 보이는 글 — 원문 그대로 · owner 는 html[data-viewer=owner] 일 때 CSS 가 숨김 (작업 0403) */
const DEMO_NOTE = "채용 담당자분들을 위한 데모 링크입니다. 열람 기록이 남지 않도록 모든 분께 같은 링크 하나를 드리고 있습니다.";

const ICONS = { log: IconLog, geo: IconGeo, how: IconHow, marketing: IconMegaphone, traffic: IconChart, instagram: IconCamera } satisfies Record<AdminNavPage["icon"], () => ReactNode>;

export function AdminShell({ brand, pages, reachable = pages, page, site, children }: { brand: string; pages: AdminNavPage[]; reachable?: AdminNavPage[]; page: string; site: SiteLink; children: ReactNode }) {
  const pal = usePalette(reachable, page, site);
  const toast = useToast();
  const { mainRef, mod } = useShellMount();
  useShellKeys({ pages: reachable, page, open: pal.open, show: pal.show, hide: pal.hide });
  const home = reachable[0]?.href ?? "/";

  return (
    <div className="adm">
      <header className="adm-mtop">
        <a className="adm-brand" href={home}>
          <b>{brand}</b>
          <span>어드민</span>
        </a>
        <nav aria-label="어드민 메뉴">
          {pages.map((p) => (
            <a key={p.id} href={p.href} aria-current={p.id === page ? "page" : undefined} data-owner-only={p.ownerOnly ? "" : undefined}>
              {p.short}
            </a>
          ))}
        </nav>
        <button type="button" className="adm-mfind" aria-label="찾기" onClick={pal.show}>
          <IconSearch />
        </button>
      </header>
      <div className="adm-shell">
        <aside className="adm-side">
          <a className="adm-brand" href={home}>
            <b>{brand}</b>
            <span>어드민</span>
          </a>
          <button type="button" className="adm-find" onClick={pal.show} aria-label={`찾기 (${mod})`}>
            <IconSearch />
            찾기
            <kbd>{kbdText(mod)}</kbd>
          </button>
          <nav className="adm-nav" aria-label="어드민 메뉴">
            {pages.map((p) => {
              const Icon = ICONS[p.icon];
              return (
                <a key={p.id} href={p.href} aria-current={p.id === page ? "page" : undefined} data-owner-only={p.ownerOnly ? "" : undefined}>
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
          <p className="adm-demo-note adm-demo-note-side">{DEMO_NOTE}</p>
          {/* 어드민 입구 쿠키를 지움 (작업 0326) — 어드민 메뉴 밖 */}
          <a className="adm-logout" href="/logout">
            로그아웃
          </a>
        </aside>
        <main id="main" ref={mainRef} tabIndex={-1} className="adm-main">
          {children}
          <p className="adm-demo-note adm-demo-note-main">{DEMO_NOTE}</p>
        </main>
      </div>
      {pal.open && <Palette p={pal} />}
      <div className={`adm-toast${toast.on ? " on" : ""}`} role="status" aria-live="polite">
        {toast.text}
      </div>
    </div>
  );
}
