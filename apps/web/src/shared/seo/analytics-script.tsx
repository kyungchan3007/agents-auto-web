"use client";

// GA4 태그 — 운영 주소에서만 gtag.js 를 불러옴 (작업 0322 · next/script afterInteractive) · 그 밖(미리보기 · 로컬 · 어드민)은 아무것도 그리지 않음
import Script from "next/script";
import { GA_MEASUREMENT_ID } from "@/shared/site";
import { gtagInit, gtagSrc } from "./analytics";
import { useAnalyticsEnabled } from "./use-analytics-enabled";
import { useClickTracking } from "./use-click-tracking";

export function AnalyticsScript() {
  const on = useAnalyticsEnabled();
  useClickTracking(); // 버튼 클릭 이벤트 (작업 0359) — 운영에서만 듣기
  if (!on) return null;
  return (
    <>
      <Script src={gtagSrc(GA_MEASUREMENT_ID)} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: gtagInit(GA_MEASUREMENT_ID) }} />
    </>
  );
}
