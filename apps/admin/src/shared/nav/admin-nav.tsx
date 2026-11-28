"use client";

// 어드민(admin.flapfx.com) 틀 — 화면 목록은 admin-pages.ts · 틀 모양은 shared/ui/shell/admin-shell (작업 0303 · 0312)
import type { ReactNode } from "react";
import { SITE_URL } from "@/shared/site";
import { AdminShell } from "../ui/shell/admin-shell";
import { useViewerOwner } from "../gate/use-viewer-owner";
import { ADMIN_NAV, type AdminPage, navFor } from "./admin-pages";

export type { AdminPage };

const SITE = { href: SITE_URL, label: "flapfx.com" };

export function AdminNav({ page, children }: { page: AdminPage; children: ReactNode }) {
  // 메뉴는 여섯 개를 그리고 회사용이 아닌 항목은 CSS 가 숨김 · 찾기 · 숫자 단축키 · 로고 링크는 거른 목록 (작업 0403)
  const reachable = navFor(useViewerOwner());
  return (
    <AdminShell brand="flapfx" pages={ADMIN_NAV} reachable={reachable} page={page} site={SITE}>
      {children}
    </AdminShell>
  );
}
