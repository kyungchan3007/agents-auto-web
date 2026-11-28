"use client";

// 어드민(admin.flapfx.com) 틀 — 화면 목록은 admin-pages.ts · 틀 모양은 shared/ui/shell/admin-shell (작업 0303 · 0312)
import type { ReactNode } from "react";
import { SITE_URL } from "@/shared/site";
import { AdminShell } from "../ui/shell/admin-shell";
import { useIsOwner } from "../gate/use-is-owner";
import { type AdminPage, navFor } from "./admin-pages";

export type { AdminPage };

const SITE = { href: SITE_URL, label: "flapfx.com" };

export function AdminNav({ page, children }: { page: AdminPage; children: ReactNode }) {
  // 사이드 · 휴대폰 메뉴 · 찾기 · 숫자 단축키 · 로고 링크가 모두 같은 거른 목록 (작업 0403)
  const pages = navFor(useIsOwner());
  return (
    <AdminShell brand="flapfx" pages={pages} page={page} site={SITE}>
      {children}
    </AdminShell>
  );
}
