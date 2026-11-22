import type { Metadata } from "next";
import { HowPage } from "@/features/how/how-page";
import { readHowCounts } from "@/features/how/repo-counts/repo-counts.server";
import { ADMIN_URL } from "@/shared/site";

// 만드는 방식 (작업 0303) — 어드민 · 검색에 막음 · 숫자는 빌드 때 저장소에서 셈(못 세면 그 칸을 뺌 · 지어내지 않음)
export const metadata: Metadata = {
  title: "만드는 방식 · Flapfx",
  description: "사람 한 명과 AI 에이전트 팀이 이 사이트를 만드는 방식 — 역할 · 도구 · 규칙",
  alternates: { canonical: `${ADMIN_URL}/how` },
  robots: { index: false, follow: false },
};

export default function Page() {
  return <HowPage counts={readHowCounts()} />;
}
