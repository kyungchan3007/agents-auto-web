import type { Metadata } from "next";
import { AboutPage } from "@/features/about/components/about-page";
import { DUTY_FREE_USD, RULES_SOURCE } from "@/features/import-calc/lib/rules";
import { api } from "@hav/shared/api";
import { JsonLd } from "@/shared/json-ld";
import { breadcrumbLd, pageMeta } from "@/shared/seo";

export const metadata: Metadata = pageMeta({ path: "/about", title: "소개 · 판단 기준 · Flapfx", description: "Flapfx가 쓰는 자료의 출처와 환율 신호 · 여행 물가 · 직구 세금을 계산하는 기준" });

// 신호 규칙 숫자는 빌드 때 API 에서 (화면에 따로 적어 어긋나지 않게) · 작업 0115
export default async function Page() {
  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: "소개", path: "/about" }])} />
      <AboutPage signals={await api.signals()} duty={{ usList: DUTY_FREE_USD["us-list"], other: DUTY_FREE_USD.other, source: RULES_SOURCE }} />
    </>
  );
}
