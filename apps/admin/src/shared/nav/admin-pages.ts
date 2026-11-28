// 어드민 화면 목록 (작업 0303 · 0307 · 0312) — 이름 · 짧은 이름 · 단축키 · 아이콘 · 경로는 @hav/shared/site 의 ADMIN_PATHS 와 같아야 함(admin-pages.test.ts)
import type { AdminNavPage } from "../ui/shell/palette-items";

export type AdminPage = "log" | "geo" | "how" | "marketing" | "traffic" | "instagram";

export const ADMIN_NAV: (AdminNavPage & { id: AdminPage })[] = [
  { id: "log", href: "/log", label: "작업실", short: "작업실", key: "1", icon: "log" },
  { id: "geo", href: "/geo", label: "GEO 측정", short: "GEO", key: "2", icon: "geo" },
  { id: "how", href: "/how", label: "만드는 방식", short: "만드는 방식", key: "3", icon: "how" },
  { id: "marketing", href: "/marketing", label: "알리기", short: "알리기", key: "4", icon: "marketing" },
  { id: "traffic", href: "/traffic", label: "유입", short: "유입", key: "5", icon: "traffic" },
  { id: "instagram", href: "/instagram", label: "인스타 유입", short: "인스타", key: "6", icon: "instagram" },
];

/** 회사 링크(owner 아님)가 보는 화면 — GEO 측정 · 만드는 방식 (작업 0403 · 숫자 단축키는 원래 키 그대로) */
export const COMPANY_PAGES: readonly AdminPage[] = ["geo", "how"];

/** 세션에 맞는 메뉴 — owner 로 확인되기 전에는 회사 목록(두 개) · 확인되면 여섯 개 */
const COMPANY_NAV = ADMIN_NAV.filter((p) => COMPANY_PAGES.includes(p.id));
export const navFor = (owner: boolean) => (owner ? ADMIN_NAV : COMPANY_NAV);
