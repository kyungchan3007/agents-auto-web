// 작업 0349 — GA4 페이지별 머무름: 보고서 → 행 · 저장 SQL(덮어쓰기 · 기준값 한 번만) · GET /ga4 응답 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
// 스키마를 바꾸지 않음(sdd): 작업 0341 의 team_snapshots(key · body JSON · synced_at)에 두 키 — 'ga4-page-engagement'(매일 덮어씀) · 'ga4-page-engagement-baseline'(INSERT OR IGNORE 로 처음 한 번만)
//
// builder 가 만들 것
//   packages/shared/src/contracts/ga4.ts
//     export const PageEngagement = z.object({ from: IsoDate, to: IsoDate, pages: z.array({ path: string; views: 0 이상 정수; sessions: 0 이상 정수; engagementRate: 0~1; bounceRate: 0~1; viewsPerSession: 0 이상 숫자 }) })
//     Ga4Report 에 engagement · baseline: PageEngagement.nullable().default(null)   (예전 응답에는 없어서 기본값 null · 웹 · 어드민이 API 보다 먼저 배포돼도 깨지지 않음)
//   apps/api/src/features/ga4/engagement.ts (의존성 없이 · node --experimental-strip-types 로 돎 — report.ts 처럼 @hav/* 가져오기 없음)
//     export type EngagementRow = { path: string; views: number; sessions: number; engagementRate: number; bounceRate: number; viewsPerSession: number }
//     export type PageEngagementData = { from: string; to: string; pages: EngagementRow[] }
//     export function engagementRows(apiJson: unknown): EngagementRow[]        // 차원 pagePath · 지표 screenPageViews · sessions · engagementRate · bounceRate · screenPageViewsPerSession (헤더 이름으로 찾음)
//     export function engagementSnapshot(rows: EngagementRow[], range: { from: string; to: string }, top?: number): PageEngagementData | null   // 페이지뷰 많은 순(같으면 경로 글자순) 위 top(기본 20) · 행이 없으면 null
//     export function rangeEndingOn(end: string, days?: number): { from: string; to: string }   // end 로 끝나는 days(기본 28)일 구간 · GA4 "28daysAgo ~ yesterday" 와 같은 길이(양끝 포함)
//     export function engagementSql(current: PageEngagementData | null, syncedAt: string, baseline?: PageEngagementData | null): string
//         current → INSERT OR REPLACE INTO team_snapshots (key, body, synced_at) VALUES ('ga4-page-engagement', '<JSON>', '<syncedAt>');
//         baseline → INSERT OR IGNORE INTO team_snapshots (key, body, synced_at) VALUES ('ga4-page-engagement-baseline', '<JSON>', '<syncedAt>');   (이미 있으면 바뀌지 않음)
//         null · 생략이면 그 줄을 쓰지 않음(지우지도 않음) · 둘 다 없으면 빈 글
//     export function parseEngagement(body: string): PageEngagementData | null          // JSON 이 깨졌거나 모양이 다르면 null
//   apps/api/src/features/ga4/summary.ts — ga4Report(daily, sources, pages, snapshots?: { key: string; body: string }[]) 네 번째 인자 → engagement · baseline (없거나 깨졌으면 null)
import { Ga4Report, PageEngagement } from "@hav/shared/ga4";
import { describe, expect, it } from "vitest";
import { engagementRows, engagementSnapshot, engagementSql, parseEngagement, rangeEndingOn } from "./engagement";
import { ga4Report } from "./summary";

type Row = { dims: string[]; mets: string[] };
const MET = ["screenPageViews", "sessions", "engagementRate", "bounceRate", "screenPageViewsPerSession"];
const api = (dimNames: string[], metNames: string[], rows: Row[]) => ({
  dimensionHeaders: dimNames.map((name) => ({ name })),
  metricHeaders: metNames.map((name) => ({ name, type: "TYPE_FLOAT" })),
  rows: rows.map((r) => ({ dimensionValues: r.dims.map((value) => ({ value })), metricValues: r.mets.map((value) => ({ value })) })),
  rowCount: rows.length,
});
const ERR = { error: { code: 403, message: "User does not have sufficient permissions for this property.", status: "PERMISSION_DENIED" } };
const GARBAGE = [null, undefined, "x", 42, [], {}, { rows: "x" }, { rows: null }, { rows: [null, 1, "a"] }, { dimensionHeaders: [], metricHeaders: [], rows: [{}] }, ERR];

describe("engagementRows — 보고서 → 페이지별 행 (작업 0349)", () => {
  it("행마다 한 페이지 · 비율은 0~1 소수 그대로 · 이탈률 = 1 − 참여율(GA4 정의)", () => {
    const r = engagementRows(api(["pagePath"], MET, [{ dims: ["/prices/JPN"], mets: ["1200", "800", "0.6523", "0.3477", "1.8412"] }, { dims: ["/"], mets: ["4000", "3500", "0.5", "0.5", "1.1"] }]));
    expect(r).toEqual([
      { path: "/prices/JPN", views: 1200, sessions: 800, engagementRate: 0.6523, bounceRate: 0.3477, viewsPerSession: 1.8412 },
      { path: "/", views: 4000, sessions: 3500, engagementRate: 0.5, bounceRate: 0.5, viewsPerSession: 1.1 },
    ]);
  });

  it("지표는 열 위치가 아니라 헤더 이름으로 — 순서가 달라도 같은 결과", () => {
    const r = engagementRows(api(["pagePath"], ["bounceRate", "screenPageViewsPerSession", "sessions", "screenPageViews", "engagementRate"], [{ dims: ["/calc"], mets: ["0.4", "2.5", "100", "250", "0.6"] }]));
    expect(r).toEqual([{ path: "/calc", views: 250, sessions: 100, engagementRate: 0.6, bounceRate: 0.4, viewsPerSession: 2.5 }]);
  });

  it("받은 0 은 0 (세션이 0 이면 세션당 페이지뷰도 0 으로 받은 그대로)", () => {
    expect(engagementRows(api(["pagePath"], MET, [{ dims: ["/x"], mets: ["0", "0", "0", "0", "0"] }]))).toEqual([{ path: "/x", views: 0, sessions: 0, engagementRate: 0, bounceRate: 0, viewsPerSession: 0 }]);
  });

  it("값이 없거나 숫자가 아니거나 비율이 0~1 밖인 행은 버림 — 지어내지 않음 · 나머지 행은 그대로", () => {
    const r = engagementRows(api(["pagePath"], MET, [
      { dims: ["/ok"], mets: ["10", "5", "0.5", "0.5", "2"] },
      { dims: ["/nan"], mets: ["10", "5", "abc", "0.5", "2"] },
      { dims: ["/empty"], mets: ["10", "5", "", "0.5", "2"] },
      { dims: ["/over"], mets: ["10", "5", "1.5", "-0.5", "2"] },
      { dims: ["/neg"], mets: ["-3", "5", "0.5", "0.5", "2"] },
      { dims: ["/inf"], mets: ["10", "5", "0.5", "0.5", "Infinity"] },
    ]));
    expect(r.map((x) => x.path)).toEqual(["/ok"]);
  });

  it("경로는 외부 데이터 — 제어 문자는 공백 · 200자까지", () => {
    const r = engagementRows(api(["pagePath"], MET, [{ dims: [`/a\nb\u0007c${"x".repeat(300)}`], mets: ["1", "1", "0.5", "0.5", "1"] }]));
    expect(r[0].path).toHaveLength(200);
    expect(r[0].path.startsWith("/a b c")).toBe(true);
  });

  it("쓸 열이 없거나 모양이 다르면 빈 배열 (권한 오류 본문 · 쓰레기 입력에도 던지지 않음)", () => {
    for (const g of GARBAGE) expect(engagementRows(g)).toEqual([]);
    expect(engagementRows(api(["pagePath"], ["screenPageViews"], [{ dims: ["/"], mets: ["1"] }]))).toEqual([]); // 필요한 지표가 없음
  });
});

describe("engagementSnapshot — 위 20쪽 (작업 0349)", () => {
  const row = (path: string, views: number) => ({ path, views, sessions: 1, engagementRate: 0.5, bounceRate: 0.5, viewsPerSession: 1 });
  const range = { from: "2026-10-28", to: "2026-11-24" };

  it("페이지뷰 많은 순 · 같으면 경로 글자순 · 위 20개", () => {
    const rows = Array.from({ length: 25 }, (_, i) => row(`/p${String(i).padStart(2, "0")}`, 100 + i));
    const s = engagementSnapshot([...rows, row("/a", 124), row("/b", 124)], range)!;
    expect(s.pages).toHaveLength(20);
    expect(s.pages.slice(0, 4).map((p) => p.path)).toEqual(["/a", "/b", "/p24", "/p23"]); // /a · /b · /p24 가 모두 124 라 글자순 · 다음 123
    expect(s.from).toBe("2026-10-28");
    expect(s.to).toBe("2026-11-24");
  });

  it("행이 없으면 null (자료 없음 — 빈 표를 저장하지 않음)", () => {
    expect(engagementSnapshot([], range)).toBeNull();
  });

  it("계약 모양 — PageEngagement 로 읽힘", () => {
    expect(() => PageEngagement.parse(engagementSnapshot([row("/", 5)], range))).not.toThrow();
  });
});

describe("rangeEndingOn — 기준 기간 (작업 0349)", () => {
  it("end 로 끝나는 28일(양끝 포함)", () => {
    expect(rangeEndingOn("2026-11-24")).toEqual({ from: "2026-10-28", to: "2026-11-24" });
    expect(rangeEndingOn("2026-03-02")).toEqual({ from: "2026-02-03", to: "2026-03-02" }); // 달 경계
    expect(rangeEndingOn("2027-01-05", 7)).toEqual({ from: "2026-12-30", to: "2027-01-05" }); // 해 경계 · days 인자
  });
});

describe("engagementSql — 덮어쓰기 · 기준값 한 번만 (작업 0349)", () => {
  const snap = { from: "2026-10-28", to: "2026-11-24", pages: [{ path: "/prices/JPN", views: 1200, sessions: 800, engagementRate: 0.65, bounceRate: 0.35, viewsPerSession: 1.8 }] };
  const AT = "2026-11-25T04:50:00.000Z";

  it("오늘 값은 INSERT OR REPLACE — 매일 덮어씀", () => {
    const sql = engagementSql(snap, AT);
    expect(sql).toContain("INSERT OR REPLACE INTO team_snapshots (key, body, synced_at) VALUES ('ga4-page-engagement', '");
    expect(sql).toContain(`'${AT}');`);
    expect(sql).not.toContain("ga4-page-engagement-baseline");
  });

  it("기준값은 INSERT OR IGNORE — 이미 있으면 바뀌지 않음 (처음 한 번만) · 기준 기간이 body 에 들어감", () => {
    const sql = engagementSql(snap, AT, { ...snap, from: "2026-10-27", to: "2026-11-23" });
    expect(sql).toContain("INSERT OR IGNORE INTO team_snapshots (key, body, synced_at) VALUES ('ga4-page-engagement-baseline', '");
    expect(sql).toContain('"to":"2026-11-23"');
    expect(sql).not.toMatch(/INSERT OR REPLACE INTO team_snapshots \(key, body, synced_at\) VALUES \('ga4-page-engagement-baseline'/);
  });

  it("기준값이 없으면(null · 생략) 그 줄을 쓰지 않음 · 지우지도 않음 · 오늘 값이 null 이어도 옛 값을 지우지 않음", () => {
    expect(engagementSql(snap, AT, null)).not.toContain("baseline");
    expect(engagementSql(null, AT, snap)).not.toContain("'ga4-page-engagement',");
    const none = engagementSql(null, AT, null);
    expect(none.trim()).toBe("");
    expect(engagementSql(snap, AT)).not.toMatch(/DELETE/);
  });

  it("작은따옴표는 두 번 — 페이지 경로는 남이 만들 수 있는 글(외부 데이터) · SQL 을 끼워도 글일 뿐", () => {
    const evil = { ...snap, pages: [{ ...snap.pages[0], path: "/x'); DROP TABLE team_snapshots; --" }] };
    const sql = engagementSql(evil, AT);
    expect(sql).toContain("/x''); DROP TABLE team_snapshots; --");
    const stripped = sql.replace(/''/g, "");
    expect((stripped.match(/'/g) ?? []).length % 2).toBe(0);
    expect(sql.trim().split("\n").every((l) => /^INSERT OR (REPLACE|IGNORE) INTO team_snapshots/.test(l))).toBe(true);
  });

  it("줄바꿈이 든 글도 한 줄 SQL (JSON 이 \\n 으로 씀)", () => {
    const sql = engagementSql({ ...snap, pages: [{ ...snap.pages[0], path: "/a\nb" }] }, AT);
    expect(sql.trim().split("\n")).toHaveLength(1);
  });
});

describe("parseEngagement · GET /ga4 응답에 engagement · baseline (작업 0349)", () => {
  const cur = { from: "2026-10-29", to: "2026-11-25", pages: [{ path: "/", views: 4000, sessions: 3500, engagementRate: 0.55, bounceRate: 0.45, viewsPerSession: 1.2 }] };
  const base = { from: "2026-10-27", to: "2026-11-23", pages: [{ path: "/", views: 3900, sessions: 3400, engagementRate: 0.5, bounceRate: 0.5, viewsPerSession: 1.1 }] };

  it("저장된 글 → 데이터 · 깨졌거나 모양이 다르면 null", () => {
    expect(parseEngagement(JSON.stringify(cur))).toEqual(cur);
    expect(parseEngagement("{깨진")).toBeNull();
    expect(parseEngagement(JSON.stringify({ from: "2026-10-29", to: "2026-11-25", pages: [{ path: "/", views: "많음" }] }))).toBeNull();
    expect(parseEngagement(JSON.stringify({ pages: [] }))).toBeNull();
  });

  it("두 키를 engagement · baseline 으로 · 나머지(날짜별 · 유입 경로 · 페이지)는 그대로", () => {
    const r = ga4Report([], [], [], [
      { key: "ga4-page-engagement", body: JSON.stringify(cur) },
      { key: "ga4-page-engagement-baseline", body: JSON.stringify(base) },
      { key: "today-issue", body: "{}" }, // 다른 키는 무시
    ]);
    expect(Ga4Report.parse(r)).toBeTruthy();
    expect(r.engagement).toEqual(cur);
    expect(r.baseline).toEqual(base);
    expect(r.daily).toEqual([]);
  });

  it("없거나 깨졌으면 둘 다 null · 기준값만 없어도 오늘 값은 그대로", () => {
    expect(ga4Report([], [], [])).toMatchObject({ engagement: null, baseline: null });
    expect(ga4Report([], [], [], [{ key: "ga4-page-engagement", body: "{깨진" }])).toMatchObject({ engagement: null, baseline: null });
    expect(ga4Report([], [], [], [{ key: "ga4-page-engagement", body: JSON.stringify(cur) }])).toMatchObject({ engagement: cur, baseline: null });
  });

  it("예전 응답(engagement · baseline 없음)도 통과 — 어드민이 API 보다 먼저 배포돼도 깨지지 않음", () => {
    expect(Ga4Report.parse({ daily: [], sources: [], pages: [] })).toMatchObject({ engagement: null, baseline: null });
  });
});
