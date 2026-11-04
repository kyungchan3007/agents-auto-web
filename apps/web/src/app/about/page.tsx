import type { Metadata } from "next";
import { AboutPage } from "@/features/about/about-page";
import { api } from "@/shared/api";

export const metadata: Metadata = {
  title: "소개 · 판단 기준 · Tripfx",
  description: "Tripfx 가 쓰는 자료의 출처와 환율 신호 · 여행 물가 · 직구 세금을 계산하는 기준",
  alternates: { canonical: "/about" },
};

// 신호 규칙 숫자는 빌드 때 API 에서 (화면에 따로 적어 어긋나지 않게) · 작업 0115
export default async function Page() {
  return <AboutPage signals={await api.signals()} />;
}
