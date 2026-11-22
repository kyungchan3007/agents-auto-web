// 이 사이트(Flapfx)의 상단 메뉴 — 모든 페이지가 같이 씀 · 링크는 nav-links.ts
// 메뉴 모양은 디자인 시스템(@hav/ui/layout/nav-bar) · 사이트 이름 · 링크 같은 이 사이트 설정만 (디자인 시스템은 사이트를 모름)
import { NavBar } from "@hav/ui/layout/nav-bar";
import { type Page, navLinks } from "./nav-links";

export type { Page };

export function SiteNav({ page }: { page: Page }) {
  return <NavBar title="flapfx" links={navLinks(page)} />;
}
