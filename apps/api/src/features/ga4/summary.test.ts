// 작업 0324 — GET /ga4 응답 만들기: D1 에서 읽은 행 → 날짜별 · 유입 경로별(기간 합) · 페이지별(기간 합) (순수 함수 · 테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   builder 가 만들 것
//     packages/shared/src/contracts/ga4.ts — export const Ga4Report (zod) · package.json exports "./ga4"
//       Ga4Report = { daily:   { day: IsoDate; users; sessions; pageViews: 0 이상 정수 }[]                                   (최근 날부터)
//                     sources: { source: string; medium: string; campaign: string; sessions; users: 0 이상 정수 }[]             (기간 합 · 세션 많은 순 · 같으면 source · medium · campaign 글자순 · 위 20개)
//                     pages:   { path: string; views: 0 이상 정수 }[]                                                           (기간 합 · 조회 많은 순 · 같으면 경로 글자순 · 위 20개) }
//     apps/api/src/features/ga4/summary.ts — export function ga4Report(daily: Ga4DailyRow[], sources: Ga4SourceRow[], pages: Ga4PageRow[]): Ga4Report
//       입력 행 모양은 report.test.ts 의 Ga4DailyRow · Ga4SourceRow · Ga4PageRow (D1 표 한 행씩 · 날짜 · 경로가 여러 날 겹침)
//   규칙: 빈 D1 이면 빈 목록 · 받은 0 은 0 · 같은 (source, medium, campaign) 을 날짜를 가로질러 합침 · 합계는 지어내지 않고 받은 행의 합만
import { Ga4Report } from "@hav/shared/ga4";
import { describe, expect, it } from "vitest";
import { ga4Report } from "./summary";

const d = (day: string, users: number, sessions: number, pageViews: number) => ({ day, users, sessions, pageViews });
const s = (day: string, source: string, medium: string, campaign: string, sessions: number, users: number) => ({ day, source, medium, campaign, sessions, users });
const p = (day: string, path: string, views: number) => ({ day, path, views });

describe("GET /ga4 응답 — 날짜별 (작업 0324)", () => {
  it("빈 D1 이면 빈 목록 · 계약 모양", () => {
    const r = ga4Report([], [], []);
    expect(r).toEqual({ daily: [], sources: [], pages: [] });
    expect(Ga4Report.parse(r)).toBeTruthy();
  });

  it("날짜별 한 줄 · 최근 날부터 · 받은 0 은 0 (입력 순서와 상관없이)", () => {
    const r = ga4Report([d("2026-11-22", 0, 0, 0), d("2026-11-24", 5, 6, 7), d("2026-11-23", 1234, 1500, 5678)], [], []);
    expect(Ga4Report.parse(r)).toBeTruthy();
    expect(r.daily).toEqual([d("2026-11-24", 5, 6, 7), d("2026-11-23", 1234, 1500, 5678), d("2026-11-22", 0, 0, 0)]);
  });

  it("행에 다른 글을 싣지 않음 — 날짜 · 사용자 · 세션 · 페이지뷰만", () => {
    const r = ga4Report([d("2026-11-23", 1, 2, 3)], [], []);
    expect(Object.keys(r.daily[0] ?? {}).sort()).toEqual(["day", "pageViews", "sessions", "users"]);
  });
});

describe("GET /ga4 응답 — 유입 경로별 기간 합 (작업 0324)", () => {
  it("같은 (source, medium, campaign) 은 날짜를 가로질러 합침 · 세션 많은 순", () => {
    const r = ga4Report([], [
      s("2026-11-22", "instagram", "social", "daily-20261122", 10, 9),
      s("2026-11-23", "instagram", "social", "daily-20261123", 321, 300),
      s("2026-11-22", "google", "organic", "(not set)", 40, 35),
      s("2026-11-23", "google", "organic", "(not set)", 60, 50),
    ], []);
    expect(Ga4Report.parse(r)).toBeTruthy();
    expect(r.sources).toEqual([
      { source: "instagram", medium: "social", campaign: "daily-20261123", sessions: 321, users: 300 },
      { source: "google", medium: "organic", campaign: "(not set)", sessions: 100, users: 85 },
      { source: "instagram", medium: "social", campaign: "daily-20261122", sessions: 10, users: 9 },
    ]);
  });

  it("utm 값은 받은 그대로 — 캠페인이 다르면 따로 · 빈 캠페인은 빈 글 그대로", () => {
    const r = ga4Report([], [s("2026-11-23", "facebook", "paid_social", "profile", 2, 2), s("2026-11-23", "facebook", "paid_social", "", 1, 1)], []);
    expect(r.sources.map((x) => x.campaign)).toEqual(["profile", ""]);
  });

  it("세션이 같으면 글자순(source · medium · campaign)", () => {
    const r = ga4Report([], [s("2026-11-23", "b", "x", "c", 5, 1), s("2026-11-23", "a", "z", "c", 5, 1), s("2026-11-23", "a", "y", "d", 5, 1), s("2026-11-23", "a", "y", "c", 5, 1)], []);
    expect(r.sources.map((x) => `${x.source}/${x.medium}/${x.campaign}`)).toEqual(["a/y/c", "a/y/d", "a/z/c", "b/x/c"]);
  });

  it("위 20개만 · 세션 0 도 행으로 남음(받은 값)", () => {
    const many = Array.from({ length: 25 }, (_, i) => s("2026-11-23", `src${String(i).padStart(2, "0")}`, "m", "c", 100 - i, 1));
    const r = ga4Report([], [...many, s("2026-11-23", "zero", "m", "c", 0, 0)], []);
    expect(r.sources).toHaveLength(20);
    expect(r.sources[0]?.source).toBe("src00");
    expect(r.sources.some((x) => x.source === "zero")).toBe(false); // 20위 밖
    const few = ga4Report([], [s("2026-11-23", "zero", "m", "c", 0, 0)], []);
    expect(few.sources).toEqual([{ source: "zero", medium: "m", campaign: "c", sessions: 0, users: 0 }]);
  });
});

describe("GET /ga4 응답 — 페이지별 기간 합 (작업 0324)", () => {
  it("같은 경로는 날짜를 가로질러 합침 · 조회 많은 순 · 같으면 경로 글자순", () => {
    const r = ga4Report([], [], [p("2026-11-22", "/", 1000), p("2026-11-23", "/", 3000), p("2026-11-23", "/calc", 900), p("2026-11-22", "/about", 900), p("2026-11-23", "/currencies/USD", 50)]);
    expect(Ga4Report.parse(r)).toBeTruthy();
    expect(r.pages).toEqual([{ path: "/", views: 4000 }, { path: "/about", views: 900 }, { path: "/calc", views: 900 }, { path: "/currencies/USD", views: 50 }]);
  });

  it("위 20개만", () => {
    const r = ga4Report([], [], Array.from({ length: 25 }, (_, i) => p("2026-11-23", `/p${String(i).padStart(2, "0")}`, 100 - i)));
    expect(r.pages).toHaveLength(20);
    expect(r.pages[0]).toEqual({ path: "/p00", views: 100 });
    expect(r.pages.at(-1)).toEqual({ path: "/p19", views: 81 });
  });

  it("행에 날짜를 싣지 않음(기간 합) · 경로와 조회 수만", () => {
    const r = ga4Report([], [], [p("2026-11-23", "/", 1)]);
    expect(Object.keys(r.pages[0] ?? {}).sort()).toEqual(["path", "views"]);
  });
});
