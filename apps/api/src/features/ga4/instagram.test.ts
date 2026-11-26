// 작업 0374 — GA4 유입에서 인스타를 따로 셈: 링크(리퍼러 instagram.com · l.instagram.com)와 utm(utm_source=instagram) 을 나눔 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//
// builder 가 만들 것
//   packages/shared/src/contracts/ga4.ts — Ga4Report 에 instagram: { link: { sessions: Count; users: Count }; utm: { sessions: Count; users: Count } }.nullable().default(null)
//   apps/api/src/features/ga4/instagram.ts — export function instagramVisits(rows: Ga4SourceRow[]): { link: Visits; utm: Visits } | null     (Visits = { sessions: number; users: number })
//     source 는 대소문자 구분 없이 · 유입 경로 상위 20개가 아니라 모든 행(날짜 · 출처 · 매체 · 캠페인 줄)에서 날짜를 가로질러 합
//       link: 출처 호스트가 instagram.com 이거나 그 하위(l.instagram.com · m.instagram.com · www.instagram.com) — 리퍼러로 들어온 방문
//       utm : 출처가 정확히 instagram 또는 ig — utm_source=instagram 을 붙인 링크로 들어온 방문(매체 · 캠페인은 무엇이든)
//       둘 다 아니면 안 셈(notinstagram.com · instagram.evil.com · facebook 의 캠페인 이름이 instagram 인 줄 등)
//     행이 하나도 없으면 null(받지 못함 · 0 이 아님) · 행은 있는데 인스타가 없으면 둘 다 0(받은 0)
//   apps/api/src/features/ga4/summary.ts — ga4Report 의 instagram = instagramVisits(sources)  (sources 는 상위 20 로 자르기 전 전체 행)
import { Ga4Report } from "@hav/shared/ga4";
import { describe, expect, it } from "vitest";
import { instagramVisits } from "./instagram";
import type { Ga4SourceRow } from "./report";
import { ga4Report } from "./summary";

const s = (source: string, medium: string, campaign: string, sessions: number, users: number, day = "2026-11-25"): Ga4SourceRow => ({ day, source, medium, campaign, sessions, users });

describe("instagramVisits — 인스타 유입 따로 셈 (작업 0374)", () => {
  it("l.instagram.com · instagram.com 리퍼러는 링크 · utm_source=instagram 은 utm — 둘을 나눠 셈", () => {
    const r = instagramVisits([s("l.instagram.com", "referral", "(not set)", 30, 28), s("instagram.com", "referral", "(not set)", 5, 5), s("instagram", "social", "profile", 12, 10), s("google", "organic", "", 99, 90)]);
    expect(r).toEqual({ link: { sessions: 35, users: 33 }, utm: { sessions: 12, users: 10 } });
  });

  it("날짜를 가로질러 합 · 대소문자 구분 없음 · ig 도 utm", () => {
    const r = instagramVisits([s("Instagram", "social", "a", 1, 1, "2026-11-24"), s("instagram", "social", "a", 2, 2, "2026-11-25"), s("IG", "story", "b", 4, 3), s("L.Instagram.com", "referral", "(not set)", 7, 6, "2026-11-24"), s("m.instagram.com", "referral", "(not set)", 1, 1, "2026-11-25")]);
    expect(r).toEqual({ link: { sessions: 8, users: 7 }, utm: { sessions: 7, users: 6 } });
  });

  it("비슷한 이름은 안 셈 — notinstagram.com · instagram.evil.com · instagram-fan.com · 캠페인 이름만 instagram 인 facebook", () => {
    const r = instagramVisits([s("notinstagram.com", "referral", "x", 9, 9), s("instagram.evil.com", "referral", "x", 9, 9), s("instagram-fan.com", "referral", "x", 9, 9), s("facebook", "paid_social", "instagram", 9, 9), s("(direct)", "(none)", "(not set)", 9, 9)]);
    expect(r).toEqual({ link: { sessions: 0, users: 0 }, utm: { sessions: 0, users: 0 } });
  });

  it("행이 없으면 null (받지 못함 · 0 이 아님) · 행은 있는데 인스타가 없으면 받은 0", () => {
    expect(instagramVisits([])).toBeNull();
    expect(instagramVisits([s("google", "organic", "", 3, 3)])).toEqual({ link: { sessions: 0, users: 0 }, utm: { sessions: 0, users: 0 } });
  });
});

describe("GET /ga4 응답 — instagram (작업 0374)", () => {
  it("상위 20개 밖의 인스타 줄도 셈 (유입 경로 표는 20개로 자르지만 인스타 합은 전체 행)", () => {
    const many = Array.from({ length: 25 }, (_, i) => s(`src${String(i).padStart(2, "0")}`, "m", "c", 1000 - i, 1));
    const r = ga4Report([], [...many, s("l.instagram.com", "referral", "(not set)", 2, 2), s("instagram", "social", "profile", 1, 1)], []);
    expect(Ga4Report.parse(r)).toBeTruthy();
    expect(r.sources.some((x) => x.source === "l.instagram.com")).toBe(false);
    expect(r.instagram).toEqual({ link: { sessions: 2, users: 2 }, utm: { sessions: 1, users: 1 } });
  });

  it("유입 행이 없으면 null · 예전 응답(instagram 칸 없음)도 읽힘", () => {
    expect(ga4Report([], [], []).instagram).toBeNull();
    expect(Ga4Report.parse({ daily: [], sources: [], pages: [] }).instagram).toBeNull();
  });
});
