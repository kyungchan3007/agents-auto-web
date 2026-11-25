// 버튼 클릭 이벤트 보내기 (작업 0359) — 운영 주소(analyticsEnabled)에서만 window.gtag('event', 이름[, 매개변수])
//   이름은 packages/shared 이벤트 표 안만 · 매개변수는 고른 통화(currency) · 나라(country) 코드만 — 영문 대문자 세 글자 모양일 때만 남김 (개인정보 없음)
//   화면 부품은 이 함수만 부르거나 data-track 표시만 단다 (trackFromClick 이 문서 한 곳에서 읽음)
import { type ClickEventName, isClickEvent } from "@hav/shared/click-events";
import { analyticsEnabled } from "./analytics";

export type ClickParams = { currency?: string; country?: string };

const CODE = /^[A-Z]{3}$/;
const KEYS = ["currency", "country"] as const;

type Gtag = (...args: unknown[]) => void;

export function trackClick(name: ClickEventName, params?: ClickParams): void {
  if (typeof window === "undefined") return;
  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  if (typeof gtag !== "function" || !analyticsEnabled(window.location.hostname) || !isClickEvent(name)) return;
  const kept: ClickParams = {};
  for (const k of KEYS) {
    const v = params?.[k];
    if (typeof v === "string" && CODE.test(v)) kept[k] = v;
  }
  if (Object.keys(kept).length === 0) gtag("event", name);
  else gtag("event", name, kept);
}

/**
 * 문서 전체 클릭 → data-track 이 달린 가장 가까운 요소의 이름으로 보냄 (서버 부품에도 표시만 달면 됨)
 *   data-track="이름" · data-track-currency · data-track-country(매개변수) · data-track-when="closed"(자주 묻는 질문: 닫혀 있던 것을 펼칠 때만)
 */
export function trackFromClick(e: MouseEvent): void {
  const t = e.target instanceof Element ? e.target.closest<HTMLElement>("[data-track]") : null;
  const name = t?.dataset.track;
  if (!t || !isClickEvent(name)) return;
  if (t.dataset.trackWhen === "closed" && t.closest("details")?.open) return;
  trackClick(name, { currency: t.dataset.trackCurrency, country: t.dataset.trackCountry });
}
