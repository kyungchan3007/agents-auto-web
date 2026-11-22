// 어드민(admin.flapfx.com) 틀 — 화면 목록은 admin-pages.ts · 틀 모양은 shared/ui/shell/admin-shell (작업 0303 · 0312)
import type { ReactNode } from "react";
import { SITE_URL } from "@/shared/site";
import { AdminShell } from "../ui/shell/admin-shell";
import { ADMIN_NAV, type AdminPage } from "./admin-pages";

export type { AdminPage };

const SITE = { href: SITE_URL, label: "flapfx.com" };

export function AdminNav({ page, children }: { page: AdminPage; children: ReactNode }) {
  return (
    <AdminShell brand="flapfx" pages={ADMIN_NAV} page={page} site={SITE}>
      {children}
    </AdminShell>
  );
}
