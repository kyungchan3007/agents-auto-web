// 작업 0324 — GA4 가져오기: runReport 응답 → 행 · upsert SQL (순수 함수 · 테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   builder 가 만들 것 — apps/api/src/features/ga4/report.ts
//     export type Ga4DailyRow = { day: string; users: number; sessions: number; pageViews: number }                                  → ga4_daily(day, users, sessions, page_views)
//     export type Ga4SourceRow = { day: string; source: string; medium: string; campaign: string; sessions: number; users: number }   → ga4_sources(day, source, medium, campaign, sessions, users)
//     export type Ga4PageRow = { day: string; path: string; views: number }                                                           → ga4_pages(day, path, views)
//     export function dailyRows(apiJson: unknown): Ga4DailyRow[]     — 차원 date · 지표 activeUsers · sessions · screenPageViews
//     export function sourceRows(apiJson: unknown): Ga4SourceRow[]   — 차원 date · sessionSource · sessionMedium · sessionCampaignName · 지표 sessions · activeUsers
//     export function pageRows(apiJson: unknown): Ga4PageRow[]       — 차원 date · pagePath · 지표 screenPageViews
//     export function ga4Sql(data: { daily: Ga4DailyRow[]; sources: Ga4SourceRow[]; pages: Ga4PageRow[] }): string
//   응답 모양(GA4 Data API runReport): { dimensionHeaders: [{name}], metricHeaders: [{name, type}], rows: [{ dimensionValues: [{value}], metricValues: [{value}] }] }
//     값은 모두 글자 — 날짜는 "20261123"(→ "2026-11-23") · 숫자 지표는 "12" · 열 위치가 아니라 헤더 이름으로 찾음(순서가 달라도 같은 결과)
//   원칙(prd): 받은 값만 · 못 받은 값은 지어내지 않음(행을 버림) · 유입 경로 글(utm 값)은 받은 그대로
import { describe, expect, it } from "vitest";
import { dailyRows, ga4Sql, pageRows, sourceRows } from "./report";

type Row = { dims: string[]; mets: string[] };
const api = (dimNames: string[], metNames: string[], rows: Row[]) => ({
  dimensionHeaders: dimNames.map((name) => ({ name })),
  metricHeaders: metNames.map((name) => ({ name, type: "TYPE_INTEGER" })),
  rows: rows.map((r) => ({ dimensionValues: r.dims.map((value) => ({ value })), metricValues: r.mets.map((value) => ({ value })) })),
  rowCount: rows.length,
});
const ERR = { error: { code: 403, message: "User does not have sufficient permissions for this property.", status: "PERMISSION_DENIED" } };
const GARBAGE = [null, undefined, "x", 42, [], {}, { rows: "x" }, { rows: null }, { rows: [null, 1, "a"] }, { dimensionHeaders: [], metricHeaders: [], rows: [{}] }];

describe("dailyRows — 날짜별 사용자 · 세션 · 페이지뷰 (작업 0324)", () => {
  const D = ["date"];
  const M = ["activeUsers", "sessions", "screenPageViews"];

  it("행마다 하루 · 날짜는 YYYY-MM-DD · 값은 숫자", () => {
    const r = dailyRows(api(D, M, [{ dims: ["20261123"], mets: ["1234", "1500", "5678"] }, { dims: ["20261122"], mets: ["0", "0", "0"] }]));
    expect(r).toEqual([
      { day: "2026-11-23", users: 1234, sessions: 1500, pageViews: 5678 },
      { day: "2026-11-22", users: 0, sessions: 0, pageViews: 0 }, // 받은 0 은 0
    ]);
  });

  it("지표는 열 위치가 아니라 헤더 이름으로 — 순서가 달라도 같은 결과", () => {
    const r = dailyRows(api(D, ["screenPageViews", "activeUsers", "sessions"], [{ dims: ["20261123"], mets: ["5678", "1234", "1500"] }]));
    expect(r).toEqual([{ day: "2026-11-23", users: 1234, sessions: 1500, pageViews: 5678 }]);
  });

  it("날짜 모양이 아닌 행 · 숫자가 아닌 값이 하나라도 있는 행은 버림 — 지어내지 않음", () => {
    const r = dailyRows(api(D, M, [
      { dims: ["20261123"], mets: ["1", "2", "3"] },
      { dims: ["(other)"], mets: ["9", "9", "9"] },
      { dims: ["2026"], mets: ["9", "9", "9"] },
      { dims: ["20261340"], mets: ["9", "9", "9"] }, // 없는 날짜(13월)
      { dims: ["20261122"], mets: ["abc", "2", "3"] },
      { dims: ["20261121"], mets: ["", "2", "3"] },
      { dims: ["20261120"], mets: ["1", "-5", "3"] }, // 음수
      { dims: ["20261119"], mets: ["1", "Infinity", "3"] },
    ]));
    expect(r).toEqual([{ day: "2026-11-23", users: 1, sessions: 2, pageViews: 3 }]);
  });

  it("필요한 지표 헤더가 없으면 행 없음", () => {
    expect(dailyRows(api(D, ["activeUsers", "sessions"], [{ dims: ["20261123"], mets: ["1", "2"] }]))).toEqual([]);
  });

  it("오류 응답(403 권한 없음) · 알 수 없는 모양 · 행 없음은 빈 배열 · 던지지 않음", () => {
    expect(dailyRows(ERR)).toEqual([]);
    for (const bad of GARBAGE) expect(dailyRows(bad), JSON.stringify(bad)).toEqual([]);
    expect(dailyRows(api(D, M, []))).toEqual([]);
  });
});

describe("sourceRows — 유입 경로(utm 값 그대로) (작업 0324)", () => {
  const D = ["date", "sessionSource", "sessionMedium", "sessionCampaignName"];
  const M = ["sessions", "activeUsers"];

  it("인스타 utm 값이 받은 그대로 — instagram / social / daily-20261123 · facebook / paid_social", () => {
    const r = sourceRows(api(D, M, [
      { dims: ["20261123", "instagram", "social", "daily-20261123"], mets: ["321", "300"] },
      { dims: ["20261123", "facebook", "paid_social", "profile"], mets: ["12", "11"] },
    ]));
    expect(r).toEqual([
      { day: "2026-11-23", source: "instagram", medium: "social", campaign: "daily-20261123", sessions: 321, users: 300 },
      { day: "2026-11-23", source: "facebook", medium: "paid_social", campaign: "profile", sessions: 12, users: 11 },
    ]);
  });

  it("GA4 가 쓰는 자리 글((direct) · (none) · (not set))도 받은 그대로 — 바꾸거나 지우지 않음", () => {
    const r = sourceRows(api(D, M, [{ dims: ["20261123", "(direct)", "(none)", "(not set)"], mets: ["5", "4"] }]));
    expect(r[0]).toMatchObject({ source: "(direct)", medium: "(none)", campaign: "(not set)" });
  });

  it("빈 글(캠페인 이름 없음)은 빈 글 그대로 — 지어낸 '(not set)' 이 아님", () => {
    const r = sourceRows(api(D, M, [{ dims: ["20261123", "google", "organic", ""], mets: ["5", "4"] }]));
    expect(r[0]?.campaign).toBe("");
  });

  it("차원은 헤더 이름으로 · 지표 순서가 달라도 같은 결과", () => {
    const r = sourceRows(api(["sessionMedium", "date", "sessionCampaignName", "sessionSource"], ["activeUsers", "sessions"], [{ dims: ["social", "20261123", "daily-20261123", "instagram"], mets: ["300", "321"] }]));
    expect(r).toEqual([{ day: "2026-11-23", source: "instagram", medium: "social", campaign: "daily-20261123", sessions: 321, users: 300 }]);
  });

  it("날짜가 틀린 행 · 숫자가 아닌 값이 있는 행은 버림", () => {
    const r = sourceRows(api(D, M, [
      { dims: ["20261123", "a", "b", "c"], mets: ["1", "1"] },
      { dims: ["(other)", "a", "b", "c"], mets: ["1", "1"] },
      { dims: ["20261123", "a", "b", "c"], mets: ["x", "1"] },
    ]));
    expect(r).toHaveLength(1);
  });

  it("글에 든 제어 문자는 공백으로 · 아주 긴 글은 잘라 냄(200자) — 화면 · SQL 에 줄바꿈이 새지 않음", () => {
    const r = sourceRows(api(D, M, [{ dims: ["20261123", "ig\nram", "so\tcial", `daily-${"x".repeat(300)}`], mets: ["1", "1"] }]));
    expect(r[0]?.source).toBe("ig ram");
    expect(r[0]?.medium).toBe("so cial");
    expect((r[0]?.campaign ?? "").length).toBeLessThanOrEqual(200);
  });

  it("오류 응답 · 알 수 없는 모양은 빈 배열", () => {
    expect(sourceRows(ERR)).toEqual([]);
    for (const bad of GARBAGE) expect(sourceRows(bad), JSON.stringify(bad)).toEqual([]);
  });
});

describe("pageRows — 페이지별 페이지뷰 (작업 0324)", () => {
  const D = ["date", "pagePath"];
  const M = ["screenPageViews"];

  it("행마다 하루 · 경로 · 조회 수 (경로는 받은 그대로)", () => {
    const r = pageRows(api(D, M, [{ dims: ["20261123", "/"], mets: ["4000"] }, { dims: ["20261123", "/currencies/USD"], mets: ["50"] }]));
    expect(r).toEqual([{ day: "2026-11-23", path: "/", views: 4000 }, { day: "2026-11-23", path: "/currencies/USD", views: 50 }]);
  });

  it("날짜가 틀린 행 · 숫자가 아닌 값은 버림 · 받은 0 은 0", () => {
    const r = pageRows(api(D, M, [{ dims: ["20261123", "/a"], mets: ["0"] }, { dims: ["x", "/b"], mets: ["5"] }, { dims: ["20261123", "/c"], mets: ["많이"] }]));
    expect(r).toEqual([{ day: "2026-11-23", path: "/a", views: 0 }]);
  });

  it("오류 응답 · 알 수 없는 모양은 빈 배열", () => {
    expect(pageRows(ERR)).toEqual([]);
    for (const bad of GARBAGE) expect(pageRows(bad), JSON.stringify(bad)).toEqual([]);
  });
});

describe("ga4Sql — 같은 날 다시 넣으면 덮어쓰는 SQL (작업 0324)", () => {
  const daily = { day: "2026-11-23", users: 1234, sessions: 1500, pageViews: 5678 };
  const source = { day: "2026-11-23", source: "instagram", medium: "social", campaign: "daily-20261123", sessions: 321, users: 300 };
  const page = { day: "2026-11-23", path: "/calc", views: 900 };
  const all = { daily: [daily], sources: [source], pages: [page] };

  it("표 세 개 · 열 이름 · 값 — ga4_daily(day, users, sessions, page_views) · ga4_sources(day, source, medium, campaign, sessions, users) · ga4_pages(day, path, views)", () => {
    const sql = ga4Sql(all);
    expect(sql).toMatch(/INSERT INTO ga4_daily \(day, users, sessions, page_views\) VALUES \('2026-11-23', 1234, 1500, 5678\)/);
    expect(sql).toMatch(/INSERT INTO ga4_sources \(day, source, medium, campaign, sessions, users\) VALUES \('2026-11-23', 'instagram', 'social', 'daily-20261123', 321, 300\)/);
    expect(sql).toMatch(/INSERT INTO ga4_pages \(day, path, views\) VALUES \('2026-11-23', '\/calc', 900\)/);
  });

  it("키가 같으면 덮어씀(upsert) — daily(day) · sources(day, source, medium, campaign) · pages(day, path) · 지우지 않음(지난 날 값이 남음)", () => {
    const sql = ga4Sql(all);
    expect(sql).toMatch(/INSERT INTO ga4_daily[^;]*ON CONFLICT\s*\(day\)\s*DO UPDATE SET users\s*=\s*excluded\.users,\s*sessions\s*=\s*excluded\.sessions,\s*page_views\s*=\s*excluded\.page_views/i);
    expect(sql).toMatch(/INSERT INTO ga4_sources[^;]*ON CONFLICT\s*\(day, source, medium, campaign\)\s*DO UPDATE SET sessions\s*=\s*excluded\.sessions,\s*users\s*=\s*excluded\.users/i);
    expect(sql).toMatch(/INSERT INTO ga4_pages[^;]*ON CONFLICT\s*\(day, path\)\s*DO UPDATE SET views\s*=\s*excluded\.views/i);
    expect(sql).not.toMatch(/DELETE|DROP|TRUNCATE/i);
  });

  it("행마다 한 문장 · 세미콜론으로 끝남 · 같은 입력이면 같은 글 · 비어 있으면 문장 없음", () => {
    const sql = ga4Sql({ daily: [daily, { ...daily, day: "2026-11-22" }], sources: [source], pages: [page, { ...page, path: "/" }] });
    expect(sql.match(/INSERT INTO/g)).toHaveLength(5);
    expect(sql.trim().endsWith(";")).toBe(true);
    expect(ga4Sql(all)).toBe(ga4Sql(all));
    expect(ga4Sql({ daily: [], sources: [], pages: [] }).trim()).toBe("");
  });

  it("따옴표 이스케이프 — 유입 경로 · 경로 글은 외부 데이터", () => {
    const sql = ga4Sql({ daily: [], sources: [{ ...source, source: "x'); DROP TABLE fx_rates; --", campaign: "o'neil" }], pages: [{ ...page, path: "/a'b" }] });
    expect(sql).toContain("'x''); DROP TABLE fx_rates; --'");
    expect(sql).toContain("'o''neil'");
    expect(sql).toContain("'/a''b'");
  });

  it("숫자가 아닌 값(NaN · 무한대)이 든 행은 SQL 에 넣지 않음", () => {
    const sql = ga4Sql({ daily: [{ ...daily, users: Number.NaN }, { ...daily, day: "2026-11-22" }], sources: [{ ...source, sessions: Number.POSITIVE_INFINITY }], pages: [] });
    expect(sql).not.toMatch(/NaN|Infinity/);
    expect(sql.match(/INSERT INTO/g)).toHaveLength(1);
    expect(sql).toContain("'2026-11-22'");
  });
});
