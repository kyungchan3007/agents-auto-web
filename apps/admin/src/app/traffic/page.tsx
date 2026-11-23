import type { Metadata } from "next";
import { TrafficPage } from "@/features/traffic/traffic-page";
import { ADMIN_URL } from "@/shared/site";

// 유입 (작업 0324) — 어드민 · 검색에 막음 · 값은 브라우저가 /bff/ga4 에서 (빌드에 굳히지 않음)
export const metadata: Metadata = {
  title: "유입 · Flapfx",
  description: "운영 사이트 방문 — 날짜별 · 유입 경로별 · 많이 본 페이지",
  alternates: { canonical: `${ADMIN_URL}/traffic` },
  robots: { index: false, follow: false },
};

export default function Page() {
  return <TrafficPage />;
}
