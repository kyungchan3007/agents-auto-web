// 인트로를 띄울지 (순수 · 작업 0186) — 사이트에 들어올 때만(주소창 · 외부 링크 · 새로고침)
//   원칙: 기존 홈은 그대로 · 인트로는 덮기만 → 사이트 안 이동(다른 페이지 → 홈) · #위치 링크(예: "오늘 환율" /#today) · 뒤로 가기 · 같은 문서에서 두 번째 홈에서는 띄우지 않음
//   폭 700 이하 · 끄기 스위치도 띄우지 않음 (작업 0185 그대로)

/** 인트로가 닫힐 때(끝 · 건너뛰기) 보내는 이벤트 — 인트로 문이 부품을 내림 (작업 0186) */
export const INTRO_CLOSED_EVENT = "flapfx:intro-closed";

export type IntroEntry = {
  /** 폭 701 이상 */
  wide: boolean;
  /** 끄기 스위치(localStorage flapfx:intro-off = "1") */
  off: boolean;
  /** location.hash */
  hash: string;
  /** 이 문서에서 이미 인트로를 띄운 적이 있음 */
  shownBefore: boolean;
  /** performance navigation type — "navigate" · "reload" · "back_forward" · "prerender" */
  navType: string;
  /** document.referrer */
  referrer: string;
  /** location.origin */
  origin: string;
  /** 이 문서를 처음 연 주소의 경로 (화면 안 이동으로 홈에 온 경우 홈이 아님) */
  firstPath: string;
};

const originOf = (url: string): string | null => {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
};

export function shouldShowIntro(e: IntroEntry): boolean {
  if (!e.wide || e.off) return false;
  if (e.hash && e.hash !== "#") return false;
  if (e.shownBefore) return false;
  if (e.firstPath !== "/") return false;
  if (e.navType === "back_forward") return false;
  if (e.navType === "reload") return true;
  return originOf(e.referrer) !== e.origin;
}
