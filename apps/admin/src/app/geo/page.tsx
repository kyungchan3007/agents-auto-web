import type { Metadata } from "next";
import { GeoPage } from "@/features/geo/geo-page";
import { api } from "@hav/shared/api";
import { ADMIN_URL } from "@/shared/site";
import { buildDay } from "@/shared/time/build-time";

export const metadata: Metadata = {
  title: "GEO 측정 · Flapfx",
  description: "구글 검색 노출 · AI 봇 방문 · AI 서비스 유입 · AI 검색 인용 측정 기록을 공개합니다",
  // 어드민으로 옮김 · 검색에 막음 (작업 0302)
  alternates: { canonical: `${ADMIN_URL}/geo` },
  robots: { index: false, follow: false },
};

// 빌드 때 한 번 · 브라우저가 /bff/geo 에서 한 번 더 (API 는 1시간 구간 캐시)
export default async function Page() {
  const build = await api.geo();
  // 자료를 받은 날(빌드 때 한국 날짜) — 이름 바꾼 날 전후 비교의 끝 날짜 (작업 0205 · 브라우저에서 여는 날이 아님)
  return <GeoPage build={build} asOf={buildDay()} />;
}
