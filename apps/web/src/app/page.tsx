import type { Metadata } from "next";
import { Home } from "@/features/home/home";
import { IntroGate } from "@/features/intro/intro-gate";
import { introDataOf } from "@/features/intro/state/intro-data";
import { api, mustHave } from "@hav/shared/api";
import { JsonLd } from "@/shared/json-ld";
import { HOME_DESCRIPTION, pageMeta, siteLd } from "@/shared/seo";

export const metadata: Metadata = pageMeta({ path: "/", title: "Flapfx — 환전 타이밍 · 오늘 환율 · 여행 물가 · 직구 세금 계산", description: HOME_DESCRIPTION });

// 홈 — 빌드할 때 API 에서 받아 정적 페이지로 (실패해도 빌드는 성공 · 화면은 "아직 받지 못했습니다")
//   받는 것: 오늘 환율 · 신호 · 국제항공료 지수 5년치 · 물가 수준 (인트로 환전소의 "물가는 한국 100 기준" 한 줄이 씀 · 작업 0185) — 1년 USD 기록 · 1개월 변화는 받지 않음 (빌드 때 D1 읽기도 줄어듦 · 작업 0169)
//   인트로는 홈 본문 뒤에 붙는 덮는 층 — 서버 HTML 에는 아무것도 그리지 않고 브라우저에서 폭 700 초과일 때만 열림 (홈 HTML 은 인트로 없이도 같음)
export default async function Page() {
  const [latest, signals, airFare, levels] = await Promise.all([api.latest(), api.signals(), api.indicator("kosis-cpi:air-fare", 60), api.priceLevels()]);
  return (
    <>
      <JsonLd data={siteLd()} />
      <Home latest={mustHave(latest, "오늘 환율")} signals={signals} airFare={airFare} />
      <IntroGate data={introDataOf({ latest, signals, airFare, levels })} />
    </>
  );
}
