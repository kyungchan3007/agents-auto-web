// 작업 0323 — GET /ig 응답 만들기: D1 에서 읽은 행 → 날짜별 계정 값 · 게시물별 값 (순수 함수 · 테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   builder 가 만들 것
//     packages/shared/src/contracts/ig.ts — export const IgReport (zod) · package.json exports "./ig"
//       IgReport = { account: { day: IsoDate; reach; views; profileViews; websiteClicks; accountsEngaged: 0 이상 정수 | null }[]            (최근 날부터)
//                    media:   { mediaId: string; postedAt: string; permalink: string; kind: string; day: IsoDate | null;
//                               reach; likes; saved; shares; views: 0 이상 정수 | null }[]                                                   (게시 최근 순) }
//     apps/api/src/features/ig/summary.ts — export function igReport(media: IgMediaInfo[], mediaInsights: IgMediaInsightRow[], accountInsights: IgAccountInsightRow[]): IgReport
//       IgMediaInfo = { mediaId, postedAt, permalink, kind } · IgMediaInsightRow = { day, mediaId, metric, value } · IgAccountInsightRow = { day, metric, value }
//   규칙: 받지 못한 값은 null(0 아님) · 받은 0 은 0 · 지표마다 가장 최근 날 값 · day = 그 게시물에서 값을 받은 가장 최근 날 · 빈 D1 이면 빈 목록
import { IgReport } from "@hav/shared/ig";
import { describe, expect, it } from "vitest";
import { igReport } from "./summary";

const media = (mediaId: string, postedAt: string, kind = "IMAGE") => ({ mediaId, postedAt, permalink: `https://www.instagram.com/p/${mediaId}/`, kind });
const mi = (day: string, mediaId: string, metric: string, value: number) => ({ day, mediaId, metric, value });
const ai = (day: string, metric: string, value: number) => ({ day, metric, value });

describe("GET /ig 응답 — 계정 (작업 0323)", () => {
  it("빈 D1 이면 빈 목록 · 계약 모양", () => {
    const r = igReport([], [], []);
    expect(r).toEqual({ account: [], media: [] });
    expect(IgReport.parse(r)).toBeTruthy();
  });

  it("날짜별 한 줄 · 최근 날부터 · 지표 이름은 화면용(profile_views → profileViews 등)", () => {
    const r = igReport([], [], [
      ai("2026-11-22", "reach", 10), ai("2026-11-22", "views", 30), ai("2026-11-22", "profile_views", 2), ai("2026-11-22", "website_clicks", 1), ai("2026-11-22", "accounts_engaged", 4),
      ai("2026-11-23", "reach", 15), ai("2026-11-23", "views", 50), ai("2026-11-23", "profile_views", 3), ai("2026-11-23", "website_clicks", 0), ai("2026-11-23", "accounts_engaged", 5),
    ]);
    expect(IgReport.parse(r)).toBeTruthy();
    expect(r.account.map((d) => d.day)).toEqual(["2026-11-23", "2026-11-22"]);
    expect(r.account[0]).toEqual({ day: "2026-11-23", reach: 15, views: 50, profileViews: 3, websiteClicks: 0, accountsEngaged: 5 });
  });

  it("받지 못한 지표는 null · 받은 0 은 0 — 0 으로 채우지 않음", () => {
    const r = igReport([], [], [ai("2026-11-23", "reach", 0), ai("2026-11-23", "views", 8)]);
    expect(r.account).toEqual([{ day: "2026-11-23", reach: 0, views: 8, profileViews: null, websiteClicks: null, accountsEngaged: null }]);
  });

  it("목록에 없는 지표(follows_and_unfollows 등)는 응답에 싣지 않음", () => {
    const r = igReport([], [], [ai("2026-11-23", "reach", 1), ai("2026-11-23", "follows_and_unfollows", 9)]);
    expect(Object.keys(r.account[0] ?? {}).sort()).toEqual(["accountsEngaged", "day", "profileViews", "reach", "views", "websiteClicks"]);
  });
});

describe("GET /ig 응답 — 게시물 (작업 0323)", () => {
  const ms = [media("m1", "2026-11-20T03:00:00+0000"), media("m2", "2026-11-22T03:31:00+0000", "CAROUSEL_ALBUM"), media("m3", "2026-11-21T03:00:00+0000")];

  it("게시 최근 순 · 게시물 정보(번호 · 게시 시각 · 링크 · 종류) 그대로", () => {
    const r = igReport(ms, [], []);
    expect(IgReport.parse(r)).toBeTruthy();
    expect(r.media.map((m) => m.mediaId)).toEqual(["m2", "m3", "m1"]);
    expect(r.media[0]).toMatchObject({ mediaId: "m2", postedAt: "2026-11-22T03:31:00+0000", permalink: "https://www.instagram.com/p/m2/", kind: "CAROUSEL_ALBUM" });
  });

  it("성과 행이 없는 게시물도 한 줄 — 모든 값 null · 받은 날짜 null (0 으로 채우지 않음)", () => {
    const r = igReport(ms, [], []);
    for (const m of r.media) expect(m).toMatchObject({ day: null, reach: null, likes: null, saved: null, shares: null, views: null });
  });

  it("지표마다 가장 최근 날 값(게시 뒤 시간이 지나며 늘어남) · 받은 날짜는 그 게시물의 가장 최근 날", () => {
    const r = igReport(
      ms,
      [
        mi("2026-11-22", "m2", "reach", 5), mi("2026-11-23", "m2", "reach", 12), // 12
        mi("2026-11-22", "m2", "likes", 1), // 이 지표는 11-22 값만 → 1
        mi("2026-11-23", "m2", "views", 0), // 받은 0
      ],
      [],
    );
    const m2 = r.media.find((m) => m.mediaId === "m2");
    expect(m2).toMatchObject({ day: "2026-11-23", reach: 12, likes: 1, saved: null, shares: null, views: 0 });
  });

  it("다른 게시물 값이 섞이지 않음 · 목록에 없는 게시물의 성과 행은 버림(유령 줄 없음)", () => {
    const r = igReport(ms, [mi("2026-11-23", "m1", "reach", 3), mi("2026-11-23", "ghost", "reach", 99)], []);
    expect(r.media.map((m) => m.mediaId)).toEqual(["m2", "m3", "m1"]);
    expect(r.media.find((m) => m.mediaId === "m1")?.reach).toBe(3);
    expect(r.media.find((m) => m.mediaId === "m2")?.reach).toBeNull();
    expect(JSON.stringify(r)).not.toContain("ghost");
  });

  it("목록에 없는 지표는 응답에 싣지 않음", () => {
    const r = igReport(ms, [mi("2026-11-23", "m1", "impressions", 7), mi("2026-11-23", "m1", "reach", 2)], []);
    expect(Object.keys(r.media[0] ?? {}).sort()).toEqual(["day", "kind", "likes", "mediaId", "permalink", "postedAt", "reach", "saved", "shares", "views"]);
  });
});
