import type { Metadata } from "next";
import { InstagramPage } from "@/features/instagram/instagram-page";
import { ADMIN_URL } from "@/shared/site";

// 인스타 성과 (작업 0324) — 어드민 · 검색에 막음 · 값은 브라우저가 /bff/ig 에서
export const metadata: Metadata = {
  title: "인스타 성과 · Flapfx",
  description: "인스타 게시물 · 계정의 도달 · 반응 — 날짜별",
  alternates: { canonical: `${ADMIN_URL}/instagram` },
  robots: { index: false, follow: false },
};

export default function Page() {
  return <InstagramPage />;
}
