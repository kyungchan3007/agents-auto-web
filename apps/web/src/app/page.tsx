import type { Metadata } from "next";
import { Home } from "@/features/home/components/home";
import { api, mustHave } from "@/shared/api";

export const metadata: Metadata = {
  title: "Tripfx — 오늘 환율 · 여행 물가 · 직구 세금 계산",
  alternates: { canonical: "/" },
};

// 홈 — 빌드할 때 API 에서 받아 정적 페이지로 (실패해도 빌드는 성공 · 화면은 "아직 받지 못했습니다")
//   받는 것: 오늘 환율 · 신호 · 국제항공료 지수 5년치 — 새 홈이 안 쓰는 물가 수준 · 1년 USD 기록 · 1개월 변화는 받지 않음 (빌드 때 D1 읽기도 줄어듦 · 작업 0169)
export default async function Page() {
  const [latest, signals, airFare] = await Promise.all([api.latest(), api.signals(), api.indicator("kosis-cpi:air-fare", 60)]);
  return <Home latest={mustHave(latest, "오늘 환율")} signals={signals} airFare={airFare} />;
}
