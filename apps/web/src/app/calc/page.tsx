import type { Metadata } from "next";
import { CalcPage } from "@/features/import-calc/components/calc-page";
import type { CustomsRate } from "@/features/import-calc/lib/customs-rate";
import { api } from "@/shared/api";

export const metadata: Metadata = {
  title: "직구 계산기 · Tripfx",
  alternates: { canonical: "/calc" },
  description: "해외 직구 물건 값을 원화로 · 면세 한도 안인지 · 넘으면 관세 · 부가세 예상",
};

// 환율은 빌드 때 우리 API 에서 · 입력 · 계산은 브라우저 안에서만 (IMP-01)
export default async function Page() {
  const latest = await api.latest();
  // 관세청 과세환율 (작업 0163) — 통화마다 가장 최근 1주 + 달러 주별 흐름 · 못 받으면 빈 값 (수출입은행 환율 + 예상 금액 안내로 돌아감)
  const codes = latest.ok ? latest.data.rates.map((r) => r.currency) : [];
  // 수입물가지수 (한국은행 ECOS · 작업 0165) + 같은 기간 원/달러 — 못 받으면 "준비 중"
  const [trend, price, usd, ...lasts] = await Promise.all([api.indicator("kcs-import:USD", 26), api.indicator("ecos-import-price:krw", 36), api.history("USD", 1000), ...codes.map((c) => api.indicator(`kcs-import:${c}`, 1))]);
  const customs: Record<string, CustomsRate> = {};
  codes.forEach((c, i) => {
    const f = lasts[i];
    const p = f.ok ? f.data.points.at(-1) : undefined;
    if (p) customs[c] = { perUnit: p.value, weekStart: p.period };
  });
  return <CalcPage latest={latest} customs={customs} trend={trend.ok ? trend.data.points : null} usdDays={usd.ok ? usd.data.rates : null} importPrice={price.ok ? price.data.points : null} />;
}
