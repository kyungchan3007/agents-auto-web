// 작업 0359 — 버튼 클릭 이벤트 표 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
// 요구(request.md · sdd): 이벤트 이름은 버튼마다 따로(eventName 만으로 셈 · 맞춤 측정기준 없음) · 한국어 이름 · 있는 페이지 표는 packages/shared 한 곳(운영 · 수집 · 어드민이 같이 씀)
//
// builder 가 만들 것 — packages/shared/src/domain/click-events.ts (+ package.json exports "./click-events")
//   export type ClickEvent = { name: string; label: string; page: string }
//   export const CLICK_EVENTS: readonly ClickEvent[]          // 아래 12개 · 이 순서
//   export type ClickEventName = (typeof CLICK_EVENTS)[number]["name"]   (이름 글자 유니온 · as const)
//   export const CLICK_EVENT_NAMES: readonly string[]         // CLICK_EVENTS 의 name 만 · 같은 순서
//   export const isClickEvent = (name: unknown) => name is ClickEventName
//   export const clickLabel = (name: string) => string | null // 한국어 이름 · 목록 밖은 null
//   export const CLICK_EVENTS_SINCE: string                   // 이벤트를 보내기 시작한 날(운영 반영 날) YYYY-MM-DD · 2026-11-25 이후의 달력에 있는 날
//   요청 원문의 이름 열한 개 + 질문은 여행 물가 · 통화 상세 구분(sdd): faq_open_prices · faq_open_currency
import { describe, expect, it } from "vitest";
import { CLICK_EVENTS, CLICK_EVENTS_SINCE, CLICK_EVENT_NAMES, clickLabel, isClickEvent } from "./click-events";

const NAMES = ["home_search_pick", "home_country_link", "country_next_fx", "country_next_flight", "country_next_budget", "country_compare", "country_all_prices", "fx_other_open", "fx_other_pick", "faq_open_prices", "faq_open_currency", "empty_next"];

describe("이벤트 표 (작업 0359)", () => {
  it("이름 열두 개 · 이 순서 · 중복 없음", () => {
    expect(CLICK_EVENTS.map((e) => e.name)).toEqual(NAMES);
    expect(new Set(CLICK_EVENT_NAMES).size).toBe(12);
    expect([...CLICK_EVENT_NAMES]).toEqual(NAMES);
  });

  it("이름 모양: 소문자 · 숫자 · 밑줄 · 40자 이내(GA4 이벤트 이름 규칙) · 영문자로 시작", () => {
    for (const n of CLICK_EVENT_NAMES) expect(n, n).toMatch(/^[a-z][a-z0-9_]{0,39}$/);
  });

  it("한국어 이름 · 있는 페이지가 모두 있음 · 한국어 이름은 서로 다름", () => {
    for (const e of CLICK_EVENTS) {
      expect(e.label, `${e.name} 이름`).toMatch(/[가-힣]/);
      expect(e.page, `${e.name} 페이지`).toMatch(/^\/|^[가-힣]/); // 주소(/prices/[code])나 한국어 화면 이름
      expect(e.page.length, `${e.name} 페이지 길이`).toBeGreaterThan(1);
    }
    expect(new Set(CLICK_EVENTS.map((e) => e.label)).size).toBe(12);
  });

  it("있는 페이지: 나라 페이지 · 통화 상세 · 홈이 맞음", () => {
    const page = (n: string) => CLICK_EVENTS.find((e) => e.name === n)?.page;
    for (const n of ["country_next_fx", "country_next_flight", "country_next_budget", "country_compare", "country_all_prices", "faq_open_prices"]) expect(page(n), n).toContain("/prices/");
    for (const n of ["fx_other_open", "fx_other_pick", "faq_open_currency"]) expect(page(n), n).toContain("/currencies/");
    for (const n of ["home_search_pick", "home_country_link"]) expect(page(n), n).toBe("/");
  });

  it("clickLabel · isClickEvent — 목록 안은 한국어 이름 · 밖은 null · false", () => {
    expect(clickLabel("country_all_prices")).toBe(CLICK_EVENTS.find((e) => e.name === "country_all_prices")?.label);
    expect(clickLabel("page_view")).toBeNull();
    expect(clickLabel("")).toBeNull();
    expect(isClickEvent("fx_other_open")).toBe(true);
    for (const v of ["page_view", "click", "", null, undefined, 3, "FX_OTHER_OPEN"]) expect(isClickEvent(v), String(v)).toBe(false);
  });

  it("보내기 시작한 날: 달력에 있는 날 · 2026-11-25 이후", () => {
    expect(CLICK_EVENTS_SINCE).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(new Date(`${CLICK_EVENTS_SINCE}T00:00:00Z`).toISOString().slice(0, 10)).toBe(CLICK_EVENTS_SINCE);
    expect(CLICK_EVENTS_SINCE >= "2026-11-25").toBe(true);
  });
});
