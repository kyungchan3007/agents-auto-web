// 어드민(admin.flapfx.com) 틀 — 작업실 · GEO 측정 · 만드는 방식 · 알리기(작업 0307) — 이 사이트의 어드민 화면 목록 · 이름 · 사이트 주소만 여기 (틀 모양은 @hav/ui/admin/admin-shell · 작업 0303)
//   site-nav.tsx 의 어드민 짝 · 작업실 · GEO 측정 · 만드는 방식 세 화면이 같이 씀
import { AdminShell, type AdminNavPage } from "../ui/shell/admin-shell";
import type { ReactNode } from "react";
import { SITE_URL } from "@/shared/site";

export type AdminPage = "log" | "geo" | "how" | "marketing";

export const ADMIN_NAV: AdminNavPage[] = [
  { id: "log", href: "/log", label: "작업실", short: "작업실", key: "1", icon: "log" },
  { id: "geo", href: "/geo", label: "GEO 측정", short: "GEO", key: "2", icon: "geo" },
  { id: "how", href: "/how", label: "만드는 방식", short: "만드는 방식", key: "3", icon: "how" },
  { id: "marketing", href: "/marketing", label: "알리기", short: "알리기", key: "4", icon: "marketing" }, // 작업 0307
];

export function AdminNav({ page, children }: { page: AdminPage; children: ReactNode }) {
  return (
    <AdminShell brand="flapfx" pages={ADMIN_NAV} page={page} site={{ href: SITE_URL, label: "flapfx.com" }}>
      {children}
    </AdminShell>
  );
}
