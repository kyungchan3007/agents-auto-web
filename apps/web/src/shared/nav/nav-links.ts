// 방문자 메뉴 링크 (작업 0168 · R4 · 0312 에 site-nav.tsx 에서 옮김) — 여행 타이밍 · 오늘 환율 · 통화 · 여행 물가 · 직구 계산
//   소개(/about)는 메뉴에 없고 바닥 띠에서 · "오늘 환율"은 홈 환전 타이밍 구역(id="today")으로 · 어드민 화면은 admin.flapfx.com(apps/admin)
import type { NavLink } from "@hav/ui/layout/nav-bar";

export type Page = "home" | "currencies" | "prices" | "flights" | "calc" | "about";

export function navLinks(page: Page): NavLink[] {
  return [
    { href: "/flights", label: "여행 타이밍", current: page === "flights" },
    { href: "/#today", label: "오늘 환율" },
    { href: "/currencies", label: "통화", current: page === "currencies" },
    { href: "/prices", label: "여행 물가", current: page === "prices" },
    { href: "/calc", label: "직구 계산", current: page === "calc" },
  ];
}
