// 작업 0359 — 버튼 클릭 이벤트 보내기 trackClick (테스트 먼저 · 구현 전에는 FAIL 이 정상)
// 요구: 운영 주소(analyticsEnabled)에서만 window.gtag('event', 이름) · 미리보기 · 로컬은 보내지 않음 · 이름은 이벤트 표 안만 · 개인정보 없음(고른 통화 · 나라 코드만)
//
// builder 가 만들 것 — apps/web/src/shared/seo/track-click.ts (analytics.ts 옆 · 의존: analyticsEnabled · @hav/shared/click-events)
//   export type ClickParams = { currency?: string; country?: string }
//   export function trackClick(name: ClickEventName, params?: ClickParams): void
//     - window 가 없으면(서버) · window.gtag 가 함수가 아니면 · analyticsEnabled(window.location.hostname) 이 false 면 아무것도 안 함(예외 없음)
//     - 이름이 이벤트 표에 없으면(타입을 우회해도) 보내지 않음
//     - 매개변수는 currency · country 키만 · 값은 영문 대문자 세 글자(USD · JPN)만 남김 · 남은 게 없으면 매개변수 없이 window.gtag("event", 이름) — 인자 두 개
//     - 남은 게 있으면 window.gtag("event", 이름, { …남은 것 })
import { afterEach, describe, expect, it, vi } from "vitest";
import { trackClick } from "./track-click";

function stage(hostname: string, withGtag = true) {
  const gtag = vi.fn();
  vi.stubGlobal("window", { location: { hostname }, ...(withGtag ? { gtag } : {}) });
  return gtag;
}
afterEach(() => vi.unstubAllGlobals());

describe("trackClick — 운영에서만 보냄 (작업 0359)", () => {
  it("운영 주소 flapfx.com · www.flapfx.com: window.gtag('event', 이름) — 인자 두 개", () => {
    for (const h of ["flapfx.com", "www.flapfx.com"]) {
      const g = stage(h);
      trackClick("country_all_prices");
      expect(g.mock.calls, h).toEqual([["event", "country_all_prices"]]);
    }
  });

  it("미리보기 · 로컬 · 어드민 · 비슷한 주소는 보내지 않음", () => {
    for (const h of ["127.0.0.1", "localhost", "agents-auto-web.workers.dev", "admin.flapfx.com", "flapfx.com.evil.com", "preview.flapfx.com", ""]) {
      const g = stage(h);
      trackClick("fx_other_open");
      expect(g, `'${h}'`).not.toHaveBeenCalled();
    }
  });

  it("window 가 없거나(서버) gtag 가 없어도 예외 없이 조용히 지나감", () => {
    vi.stubGlobal("window", undefined);
    expect(() => trackClick("home_search_pick")).not.toThrow();
    stage("flapfx.com", false);
    expect(() => trackClick("home_search_pick")).not.toThrow();
  });

  it("이벤트 표에 없는 이름은 운영에서도 보내지 않음", () => {
    const g = stage("flapfx.com");
    trackClick("page_view" as never);
    trackClick("" as never);
    expect(g).not.toHaveBeenCalled();
  });
});

describe("trackClick — 매개변수는 고른 통화 · 나라 코드만 (개인정보 없음)", () => {
  it("currency · country 영문 대문자 세 글자는 그대로 보냄", () => {
    const g = stage("flapfx.com");
    trackClick("fx_other_pick", { currency: "USD" });
    trackClick("home_search_pick", { country: "JPN" });
    expect(g.mock.calls).toEqual([["event", "fx_other_pick", { currency: "USD" }], ["event", "home_search_pick", { country: "JPN" }]]);
  });

  it("다른 키 · 모양이 다른 값은 버림 (이메일 · 검색어 · 긴 글)", () => {
    const g = stage("flapfx.com");
    trackClick("home_search_pick", { country: "japan", currency: "usd", email: "a@b.c", query: "도쿄 호텔" } as never);
    expect(g.mock.calls, "남은 게 없으면 매개변수 없이").toEqual([["event", "home_search_pick"]]);
    g.mockClear();
    trackClick("home_search_pick", { country: "JPN", email: "a@b.c" } as never);
    expect(g.mock.calls).toEqual([["event", "home_search_pick", { country: "JPN" }]]);
  });

  it("빈 매개변수 객체는 매개변수 없음과 같음", () => {
    const g = stage("flapfx.com");
    trackClick("faq_open_currency", {});
    expect(g.mock.calls).toEqual([["event", "faq_open_currency"]]);
  });
});
