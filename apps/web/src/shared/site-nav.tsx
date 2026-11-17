// 이 사이트(플랩)의 상단 메뉴 — 모든 페이지가 같이 씀
// 메뉴 모양은 디자인 시스템(@hav/ui/layout/nav-bar) · 사이트 이름 · 링크 같은 이 사이트 설정만 여기 (디자인 시스템은 사이트를 모름)
// 순서 (작업 0168 · R4): 여행 타이밍 · 오늘 환율 · 통화 · 여행 물가 · 직구 계산 · 작업실 · GEO 측정 — 소개(/about)는 메뉴에 없고 바닥 띠에서 · "오늘 환율"은 홈 바다 띠(id="today")로
import { NavBar } from "@hav/ui/layout/nav-bar";

export type Page = "home" | "currencies" | "prices" | "flights" | "calc" | "log" | "about" | "geo";

export function SiteNav({ page }: { page: Page }) {
  return (
    <NavBar
      title="flapfx"
      links={[
        { href: "/flights", label: "여행 타이밍", current: page === "flights" },
        { href: "/#today", label: "오늘 환율" },
        { href: "/currencies", label: "통화", current: page === "currencies" },
        { href: "/prices", label: "여행 물가", current: page === "prices" },
        { href: "/calc", label: "직구 계산", current: page === "calc" },
        { href: "/log", label: "작업실", current: page === "log" }, // 예전 "만드는 중" (2026-10-30 사용자 · 작업 0105)
        { href: "/geo", label: "GEO 측정", current: page === "geo" },
      ]}
    />
  );
}
