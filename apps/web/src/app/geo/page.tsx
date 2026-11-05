import type { Metadata } from "next";
import { GeoPage } from "@/features/geo/components/geo-page";
import { api } from "@/shared/api";

export const metadata: Metadata = {
  title: "GEO 측정 · Tripfx",
  description: "구글 검색 노출 · AI 봇 방문 · AI 서비스 유입 · AI 검색 인용 측정 기록을 공개합니다",
  alternates: { canonical: "/geo" },
};

// 빌드 때 한 번 · 브라우저가 /bff/geo 에서 한 번 더 (API 는 1시간 구간 캐시)
export default async function Page() {
  return <GeoPage build={await api.geo()} />;
}
