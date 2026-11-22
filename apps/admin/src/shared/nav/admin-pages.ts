// 어드민 화면 목록 (작업 0303 · 0307 · 0312) — 이름 · 짧은 이름 · 단축키 · 아이콘 · 경로는 @hav/shared/site 의 ADMIN_PATHS 와 같아야 함(admin-pages.test.ts)
import type { AdminNavPage } from "../ui/shell/palette-items";

export type AdminPage = "log" | "geo" | "how" | "marketing";

export const ADMIN_NAV: (AdminNavPage & { id: AdminPage })[] = [
  { id: "log", href: "/log", label: "작업실", short: "작업실", key: "1", icon: "log" },
  { id: "geo", href: "/geo", label: "GEO 측정", short: "GEO", key: "2", icon: "geo" },
  { id: "how", href: "/how", label: "만드는 방식", short: "만드는 방식", key: "3", icon: "how" },
  { id: "marketing", href: "/marketing", label: "알리기", short: "알리기", key: "4", icon: "marketing" },
];
