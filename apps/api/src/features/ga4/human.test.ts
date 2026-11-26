// 작업 0374 — GA4 사람 판별 값: 보고서 → 날짜별 · 기기 · 국가 → 저장 SQL → GET /ga4 응답의 human (테스트 먼저 · 구현 전에는 FAIL 이 정상)
// 스키마를 바꾸지 않음(sdd): team_snapshots(key · body JSON · synced_at)의 키 'ga4-human' · 매일 덮어씀 (clicks.ts 와 같은 방식)
//
// builder 가 만들 것
//   packages/shared/src/contracts/ga4.ts
//     HumanReport = { from: IsoDate; to: IsoDate;
//                     days: { day: IsoDate; users: Count; sessions: Count; engagedSessions: Count|null; engagementSeconds: 0 이상 숫자|null }[];
//                     devices: { name: string; users: Count; sessions: Count; engagedSessions: Count|null }[];
//                     countries: (devices 와 같은 모양)[] }
//     Ga4Report 에 human: HumanReport.nullable().default(null)   (예전 응답에는 없어서 기본값 null)
//   apps/api/src/features/ga4/human.ts (의존성 없이 node --experimental-strip-types 로 돎 — report.ts 를 상대 경로로 가져옴)
//     export type HumanDay = { day: string; users: number; sessions: number; engagedSessions: number | null; engagementSeconds: number | null }
//     export type HumanGroup = { name: string; users: number; sessions: number; engagedSessions: number | null }
//     export type HumanData = { from: string; to: string; days: HumanDay[]; devices: HumanGroup[]; countries: HumanGroup[] }
//     export function humanRows(apiJson: unknown): HumanDay[]
//        차원 date · 지표 activeUsers · sessions(없으면 모양이 다르다고 보고 []) · engagedSessions · userEngagementDuration(헤더가 없거나 값이 이상하면 그 칸만 null · 행은 남음) · 날짜 · 사용자 · 세션을 못 받은 행은 버림
//     export function breakdownRows(apiJson: unknown, dimension: "deviceCategory" | "country"): HumanGroup[]    // 같은 지표 · 차원 하나(name = 받은 그대로 · 빈 글 · 못 받은 행은 버림)
//     export function humanSnapshot(days: HumanDay[], devices: HumanGroup[], countries: HumanGroup[], range: { from: string; to: string }): HumanData | null
//        days 가 없으면 null(빈 표를 저장하지 않음) · 날짜 오름차순 · devices · countries 는 같은 이름끼리 합(날짜별로 받은 줄이 여러 개일 수 있음)해 세션 많은 순(같으면 이름 글자순) 위 5개
//     export function humanSql(data: HumanData | null, syncedAt: string): string
//        INSERT OR REPLACE INTO team_snapshots (key, body, synced_at) VALUES ('ga4-human', '<JSON>', '<syncedAt>');  · null 이면 빈 글 · 작은따옴표는 두 번
//     export function parseHuman(body: string): HumanData | null     // JSON 이 깨졌거나 모양이 다르면 null
//   apps/api/src/features/ga4/summary.ts — ga4Report(…, snapshots) 의 'ga4-human' → human (없거나 깨졌으면 null)
//   apps/api/src/features/ga4/store.ts — 읽는 키에 'ga4-human' 추가
//   apps/api/scripts/ga4-sync.ts — 보고서 세 개 더(최근 28일 · date / deviceCategory / country 차원 · 지표 activeUsers · sessions · engagedSessions · userEngagementDuration) · 실패해도 나머지 수집은 계속 · humanSql 을 SQL 끝에 붙임
import { Ga4Report } from "@hav/shared/ga4";
import { describe, expect, it } from "vitest";
import { breakdownRows, humanRows, humanSnapshot, humanSql, parseHuman } from "./human";
import { rangeEndingOn } from "./engagement";
import { ga4Report } from "./summary";

type Row = { dims: string[]; mets: string[] };
const api = (rows: Row[], dimNames: string[], metNames = ["activeUsers", "sessions", "engagedSessions", "userEngagementDuration"]) => ({
  dimensionHeaders: dimNames.map((name) => ({ name })),
  metricHeaders: metNames.map((name) => ({ name, type: "TYPE_INTEGER" })),
  rows: rows.map((r) => ({ dimensionValues: r.dims.map((value) => ({ value })), metricValues: r.mets.map((value) => ({ value })) })),
  rowCount: rows.length,
});
const ERR = { error: { code: 403, message: "User does not have sufficient permissions for this property.", status: "PERMISSION_DENIED" } };
const GARBAGE = [null, undefined, "x", 42, [], {}, { rows: "x" }, { rows: null }, { rows: [null, 1, "a"] }, { dimensionHeaders: [], metricHeaders: [], rows: [{}] }, ERR];
const RANGE = rangeEndingOn("2026-11-30");

describe("humanRows — 날짜별 사람 판별 값 (작업 0374)", () => {
  it("행마다 하루 · 날짜 YYYY-MM-DD · 사용자 · 세션 · 참여 세션 · 참여 시간(초)", () => {
    const r = humanRows(api([{ dims: ["20261125"], mets: ["374", "380", "41", "1234.5"] }, { dims: ["20261124"], mets: ["116", "118", "0", "0"] }], ["date"]));
    expect(r).toEqual([
      { day: "2026-11-25", users: 374, sessions: 380, engagedSessions: 41, engagementSeconds: 1234.5 },
      { day: "2026-11-24", users: 116, sessions: 118, engagedSessions: 0, engagementSeconds: 0 },
    ]);
  });

  it("열 위치가 아니라 헤더 이름으로 찾음", () => {
    const r = humanRows(api([{ dims: ["20261125"], mets: ["1234", "41", "380", "374"] }], ["date"], ["userEngagementDuration", "engagedSessions", "sessions", "activeUsers"]));
    expect(r).toEqual([{ day: "2026-11-25", users: 374, sessions: 380, engagedSessions: 41, engagementSeconds: 1234 }]);
  });

  it("참여 지표를 못 받으면 그 칸만 null · 행은 남음 (0 으로 채우지 않음) — 헤더가 없을 때 · 값이 이상할 때", () => {
    const noHeader = humanRows(api([{ dims: ["20261125"], mets: ["374", "380"] }], ["date"], ["activeUsers", "sessions"]));
    expect(noHeader).toEqual([{ day: "2026-11-25", users: 374, sessions: 380, engagedSessions: null, engagementSeconds: null }]);
    const bad = humanRows(api([{ dims: ["20261125"], mets: ["374", "380", "많음", "-5"] }], ["date"]));
    expect(bad).toEqual([{ day: "2026-11-25", users: 374, sessions: 380, engagedSessions: null, engagementSeconds: null }]);
  });

  it("날짜 · 사용자 · 세션을 못 받은 행은 버림", () => {
    const r = humanRows(api([{ dims: ["2026-11-25"], mets: ["1", "1", "1", "1"] }, { dims: ["20261125"], mets: ["x", "1", "1", "1"] }, { dims: ["20261125"], mets: ["1", "", "1", "1"] }, { dims: ["20261126"], mets: ["2", "3", "1", "5"] }], ["date"]));
    expect(r.map((x) => x.day)).toEqual(["2026-11-26"]);
  });

  it("오류 응답 · 알 수 없는 모양은 빈 목록 · 던지지 않음", () => {
    for (const bad of GARBAGE) expect(humanRows(bad), JSON.stringify(bad)).toEqual([]);
  });
});

describe("breakdownRows — 기기 · 국가 (작업 0374)", () => {
  it("차원 이름 하나로 묶음 · 이름은 받은 그대로((not set) 포함)", () => {
    const r = breakdownRows(api([{ dims: ["mobile"], mets: ["300", "310", "30", "900"] }, { dims: ["(not set)"], mets: ["5", "5", "0", "0"] }], ["deviceCategory"]), "deviceCategory");
    expect(r).toEqual([
      { name: "mobile", users: 300, sessions: 310, engagedSessions: 30 },
      { name: "(not set)", users: 5, sessions: 5, engagedSessions: 0 },
    ]);
  });

  it("참여 세션을 못 받으면 그 칸만 null · 이름 · 사용자 · 세션이 없는 행은 버림 · 오류 응답은 빈 목록", () => {
    const r = breakdownRows(api([{ dims: ["Korea"], mets: ["9", "9"] }, { dims: ["Japan"], mets: ["x", "1"] }], ["country"], ["activeUsers", "sessions"]), "country");
    expect(r).toEqual([{ name: "Korea", users: 9, sessions: 9, engagedSessions: null }]);
    for (const bad of GARBAGE) expect(breakdownRows(bad, "country"), JSON.stringify(bad)).toEqual([]);
  });

  it("요청한 차원이 응답에 없으면 빈 목록", () => {
    expect(breakdownRows(api([{ dims: ["mobile"], mets: ["1", "1", "1", "1"] }], ["deviceCategory"]), "country")).toEqual([]);
  });
});

describe("humanSnapshot — 저장할 한 장 (작업 0374)", () => {
  const d = (day: string, users: number, sessions: number, engagedSessions: number | null = 1, engagementSeconds: number | null = 10) => ({ day, users, sessions, engagedSessions, engagementSeconds });
  const g = (name: string, sessions: number, engagedSessions: number | null = 1) => ({ name, users: sessions, sessions, engagedSessions });

  it("days 가 없으면 null (빈 표를 저장하지 않음)", () => {
    expect(humanSnapshot([], [g("mobile", 3)], [g("Korea", 3)], RANGE)).toBeNull();
  });

  it("날짜 오름차순 · 기간(from · to) 그대로 · 받은 null 은 그대로 null", () => {
    const s = humanSnapshot([d("2026-11-25", 5, 6, null, null), d("2026-11-24", 3, 4)], [], [], RANGE)!;
    expect(s.from).toBe(RANGE.from);
    expect(s.to).toBe(RANGE.to);
    expect(s.days.map((x) => x.day)).toEqual(["2026-11-24", "2026-11-25"]);
    expect(s.days[1]).toEqual({ day: "2026-11-25", users: 5, sessions: 6, engagedSessions: null, engagementSeconds: null });
  });

  it("기기 · 국가는 같은 이름끼리 합 · 세션 많은 순 · 같으면 이름 글자순 · 위 5개", () => {
    const countries = [g("Korea", 100), g("Korea", 50), g("Japan", 10), g("Brazil", 10), g("US", 5), g("France", 4), g("Peru", 3), g("Chad", 1)];
    const s = humanSnapshot([d("2026-11-25", 1, 1)], [g("mobile", 5), g("desktop", 7), g("mobile", 4)], countries, RANGE)!;
    expect(s.devices.map((x) => [x.name, x.sessions])).toEqual([["mobile", 9], ["desktop", 7]]);
    expect(s.countries.map((x) => [x.name, x.sessions])).toEqual([["Korea", 150], ["Brazil", 10], ["Japan", 10], ["US", 5], ["France", 4]]);
  });

  it("합칠 때 참여 세션이 하나라도 null 이면 합도 null (모르는 값을 0 으로 더하지 않음)", () => {
    const s = humanSnapshot([d("2026-11-25", 1, 1)], [g("mobile", 5, 2), g("mobile", 4, null), g("desktop", 3, 1), g("desktop", 2, 1)], [], RANGE)!;
    expect(s.devices.find((x) => x.name === "mobile")?.engagedSessions).toBeNull();
    expect(s.devices.find((x) => x.name === "desktop")?.engagedSessions).toBe(2);
  });
});

describe("humanSql · parseHuman — 저장 · 읽기 (작업 0374)", () => {
  const data = humanSnapshot([{ day: "2026-11-25", users: 374, sessions: 380, engagedSessions: 41, engagementSeconds: 1234.5 }], [{ name: "mobile", users: 300, sessions: 310, engagedSessions: 30 }], [{ name: "Korea", users: 9, sessions: 9, engagedSessions: null }], RANGE)!;

  it("team_snapshots 의 키 'ga4-human' 을 오늘 값으로 덮어씀 · 지우지 않음", () => {
    const sql = humanSql(data, "2026-11-26T04:50:00.000Z");
    expect(sql).toMatch(/^INSERT OR REPLACE INTO team_snapshots \(key, body, synced_at\) VALUES \('ga4-human', '/);
    expect(sql).toContain("'2026-11-26T04:50:00.000Z');");
    expect(sql).not.toMatch(/DELETE|DROP|TRUNCATE/i);
  });

  it("null 이면 빈 글(줄을 쓰지 않음 · 지우지도 않음) · 작은따옴표는 두 번", () => {
    expect(humanSql(null, "2026-11-26T04:50:00.000Z")).toBe("");
    const quote = humanSnapshot([{ day: "2026-11-25", users: 1, sessions: 1, engagedSessions: 1, engagementSeconds: 1 }], [], [{ name: "Cote d'Ivoire", users: 1, sessions: 1, engagedSessions: 1 }], RANGE)!;
    expect(humanSql(quote, "t")).toContain("Cote d''Ivoire");
  });

  it("저장한 글을 다시 읽으면 같은 데이터 · 깨졌거나 모양이 다르면 null", () => {
    const sql = humanSql(data, "t");
    const body = sql.slice(sql.indexOf("'ga4-human', '") + "'ga4-human', '".length, sql.lastIndexOf("', 't')")).replace(/''/g, "'");
    expect(parseHuman(body)).toEqual(data);
    for (const bad of ["", "not json", "[]", "null", JSON.stringify({ ...data, days: "x" }), JSON.stringify({ ...data, from: "내일" }), JSON.stringify({ ...data, days: [{ day: "2026-11-25", users: -1, sessions: 1, engagedSessions: 1, engagementSeconds: 1 }] })])
      expect(parseHuman(bad), bad).toBeNull();
  });
});

describe("GET /ga4 응답 — human (작업 0374)", () => {
  const data = humanSnapshot([{ day: "2026-11-25", users: 374, sessions: 380, engagedSessions: 41, engagementSeconds: 1234.5 }], [{ name: "mobile", users: 300, sessions: 310, engagedSessions: 30 }], [], RANGE)!;
  const snap = (body: string) => [{ key: "ga4-human", body }];

  it("저장된 'ga4-human' 이 있으면 human 으로 · 계약 모양", () => {
    const r = ga4Report([], [], [], snap(JSON.stringify(data)));
    expect(Ga4Report.parse(r)).toBeTruthy();
    expect(r.human?.days).toEqual(data.days);
    expect(r.human?.devices).toEqual(data.devices);
  });

  it("없거나 깨졌으면 null (첫 수집 전에는 빈 상태) · 예전 응답(human 칸 없음)도 읽힘", () => {
    expect(ga4Report([], [], []).human).toBeNull();
    expect(ga4Report([], [], [], snap("깨진 글")).human).toBeNull();
    expect(Ga4Report.parse({ daily: [], sources: [], pages: [] }).human).toBeNull();
  });

  it("다른 키(ga4-click-events 등)는 human 으로 읽지 않음", () => {
    expect(ga4Report([], [], [], [{ key: "ga4-click-events", body: JSON.stringify(data) }]).human).toBeNull();
  });
});
