import type { Metadata } from "next";
import { MarketingPage } from "@/features/marketing/marketing-page";
import { readDrafts } from "@/features/marketing/drafts/read-drafts.server";
import { ADMIN_URL } from "@/shared/site";

// 알리기 (작업 0307) — 어드민 · 검색에 막음 · 소재 초안은 빌드 때 저장소 docs/marketing 에서 읽음(없으면 빈 상태)
export const metadata: Metadata = {
  title: "알리기 · Flapfx",
  description: "Meta 광고 소재 초안 — 날짜별 이미지 · 문구 · 쓴 숫자",
  alternates: { canonical: `${ADMIN_URL}/marketing` },
  robots: { index: false, follow: false },
};

export default function Page() {
  return <MarketingPage drafts={readDrafts()} />;
}
