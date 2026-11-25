// 작업 0359 — GA4 버튼 클릭 수: 보고서 → 행 → 저장 SQL → GET /ga4 응답 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
// 스키마를 바꾸지 않음(sdd): 작업 0341 의 team_snapshots(key · body JSON · synced_at)에 키 'ga4-click-events'(매일 덮어씀 · 0349 와 같은 방식)
//
// builder 가 만들 것
//   packages/shared/src/contracts/ga4.ts
//     export const ClickEvents = z.object({ from: IsoDate, to: IsoDate, since: IsoDate, events: z.array(z.object({ name: z.string(), count: Count, users: Count })) })
//        since = 이벤트를 보내기 시작한 날(CLICK_EVENTS_SINCE) · events = 기간 안 이벤트별 합
//     Ga4Report 에 clicks: ClickEvents.nullable().default(null)   (예전 응답에는 없어서 기본값 null)
//   apps/api/src/features/ga4/clicks.ts (의존성 없이 node --experimental-strip-types 로 돎 — report.ts · engagement.ts 와 같음 · 이벤트 이름 표는 packages/shared/src/domain/click-events.ts 를 상대 경로로 가져와도 됨)
//     export type ClickRow = { day: string; name: string; count: number; users: number }
//     export type ClickData = { from: string; to: string; since: string; events: { name: string; count: number; users: number }[] }
//     export function clickRows(apiJson: unknown): ClickRow[]      // 차원 date · eventName · 지표 eventCount · totalUsers (헤더 이름으로) · 이벤트 표에 없는 eventName(page_view 등)은 거름 · 못 받은 값이 있는 행은 버림
//     export function clickSnapshot(rows: ClickRow[], range: { from: string; to: string }, since: string): ClickData | null
//        이벤트별로 count 는 날짜별 합 · users 는 날짜별 누른 사람 수의 합(같은 사람이 여러 날 누르면 겹쳐 셈 · 어드민은 '일별 합'으로 표시) · events 는 이벤트 표 순서 · 행이 없으면 null(빈 표를 저장하지 않음)
//     export function clickSql(data: ClickData | null, syncedAt: string): string
//        INSERT OR REPLACE INTO team_snapshots (key, body, synced_at) VALUES ('ga4-click-events', '<JSON>', '<syncedAt>');  · null 이면 빈 글(지우지도 않음) · 작은따옴표는 두 번
//     export function parseClicks(body: string): ClickData | null  // JSON 이 깨졌거나 모양이 다르면 null
//   apps/api/src/features/ga4/summary.ts — ga4Report(…, snapshots) 의 'ga4-click-events' → clicks (없거나 깨졌으면 null)
//   apps/api/src/features/ga4/store.ts — 읽는 키에 'ga4-click-events' 추가
//   apps/api/scripts/ga4-sync.ts — 보고서 하나 더(최근 28일 · 차원 date · eventName · 지표 eventCount · totalUsers · eventName 은 이벤트 표로 거름) → clickSql 을 SQL 끝에 붙임
import { CLICK_EVENT_NAMES, CLICK_EVENTS_SINCE } from "@hav/shared/click-events";
import { Ga4Report } from "@hav/shared/ga4";
import { describe, expect, it } from "vitest";
import { clickRows, clickSnapshot, clickSql, parseClicks } from "./clicks";
import { rangeEndingOn } from "./engagement";
import { ga4Report } from "./summary";

type Row = { dims: string[]; mets: string[] };
const api = (rows: Row[], dimNames = ["date", "eventName"], metNames = ["eventCount", "totalUsers"]) => ({
  dimensionHeaders: dimNames.map((name) => ({ name })),
  metricHeaders: metNames.map((name) => ({ name, type: "TYPE_INTEGER" })),
  rows: rows.map((r) => ({ dimensionValues: r.dims.map((value) => ({ value })), metricValues: r.mets.map((value) => ({ value })) })),
  rowCount: rows.length,
});
const ERR = { error: { code: 403, message: "User does not have sufficient permissions for this property.", status: "PERMISSION_DENIED" } };
const GARBAGE = [null, undefined, "x", 42, [], {}, { rows: "x" }, { rows: null }, { rows: [null, 1, "a"] }, { dimensionHeaders: [], metricHeaders: [], rows: [{}] }, ERR];
const RANGE = rangeEndingOn("2026-11-30");

describe("clickRows — 보고서 → 행 (작업 0359)", () => {
  it("행마다 하루 · 이벤트 하나 · 날짜는 YYYY-MM-DD 로 · 횟수 · 누른 사람 수", () => {
    const r = clickRows(api([{ dims: ["20261126", "country_all_prices"], mets: ["12", "9"] }, { dims: ["20261127", "fx_other_open"], mets: ["3", "3"] }]));
    expect(r).toEqual([
      { day: "2026-11-26", name: "country_all_prices", count: 12, users: 9 },
      { day: "2026-11-27", name: "fx_other_open", count: 3, users: 3 },
    ]);
  });

  it("이벤트 표에 없는 eventName(page_view · scroll · 다른 이름)은 거름 — 표의 열두 개는 모두 통과", () => {
    const rows = [...CLICK_EVENT_NAMES, "page_view", "scroll", "click", "country_all_prices_x", "COUNTRY_COMPARE"].map((n) => ({ dims: ["20261126", n], mets: ["1", "1"] }));
    const r = clickRows(api(rows));
    expect(r.map((x) => x.name).sort()).toEqual([...CLICK_EVENT_NAMES].sort());
  });

  it("열 위치가 아니라 헤더 이름으로 찾음 — 순서가 바뀌어도 같은 값", () => {
    const r = clickRows(api([{ dims: ["country_compare", "20261126"], mets: ["7", "5"] }], ["eventName", "date"], ["totalUsers", "eventCount"]));
    expect(r).toEqual([{ day: "2026-11-26", name: "country_compare", count: 5, users: 7 }]);
  });

  it("못 받은 값 · 이상한 값이 있는 행은 버림 (숫자를 지어내지 않음)", () => {
    const rows: Row[] = [
      { dims: ["20261126", "faq_open_prices"], mets: ["4", "3"] },
      { dims: ["20261126", "faq_open_currency"], mets: ["", "3"] },
      { dims: ["20261126", "empty_next"], mets: ["-1", "1"] },
      { dims: ["20261126", "home_country_link"], mets: ["1.5", "1"] },
      { dims: ["2026-11-26", "home_search_pick"], mets: ["1", "1"] },
      { dims: ["20261340", "fx_other_pick"], mets: ["1", "1"] },
    ];
    expect(clickRows(api(rows)).map((x) => x.name)).toEqual(["faq_open_prices"]);
  });

  it("모양이 다르거나 오류 응답이면 빈 배열", () => {
    for (const g of GARBAGE) expect(clickRows(g), JSON.stringify(g)).toEqual([]);
    expect(clickRows(api([{ dims: ["20261126", "country_compare"], mets: ["1", "1"] }], ["date"], ["eventCount", "totalUsers"]))).toEqual([]);
  });
});

describe("clickSnapshot — 이벤트별 기간 합 (작업 0359)", () => {
  const rows = [
    { day: "2026-11-26", name: "fx_other_pick", count: 5, users: 4 },
    { day: "2026-11-27", name: "fx_other_pick", count: 2, users: 2 },
    { day: "2026-11-26", name: "country_compare", count: 9, users: 6 },
  ];

  it("count · users 는 날짜별 합 · events 는 이벤트 표 순서(많이 눌린 순이 아님) · 기간 · 시작 날 포함", () => {
    const s = clickSnapshot(rows, RANGE, "2026-11-26");
    expect(s).toEqual({
      from: RANGE.from,
      to: "2026-11-30",
      since: "2026-11-26",
      events: [
        { name: "country_compare", count: 9, users: 6 },
        { name: "fx_other_pick", count: 7, users: 6 },
      ],
    });
  });

  it("행이 없으면 null — 빈 표를 저장하지 않음", () => {
    expect(clickSnapshot([], RANGE, "2026-11-26")).toBeNull();
  });
});

describe("clickSql — 매일 덮어쓰는 저장 (작업 0359)", () => {
  const data = { from: "2026-11-03", to: "2026-11-30", since: "2026-11-26", events: [{ name: "country_compare", count: 9, users: 6 }] };

  it("INSERT OR REPLACE · 키 ga4-click-events · 본문은 JSON · 새 표를 만들지 않음", () => {
    const sql = clickSql(data, "2026-11-30T18:00:00.000Z");
    expect(sql).toBe(`INSERT OR REPLACE INTO team_snapshots (key, body, synced_at) VALUES ('ga4-click-events', '${JSON.stringify(data)}', '2026-11-30T18:00:00.000Z');`);
    expect(sql).not.toMatch(/CREATE|DROP|DELETE|ALTER/i);
  });

  it("작은따옴표는 두 번으로 — 본문에 들어와도 SQL 이 깨지지 않음", () => {
    const sql = clickSql({ ...data, events: [{ name: "it's", count: 1, users: 1 }] }, "t");
    expect(sql).toContain("it''s");
    expect(sql.match(/'/g)!.length % 2).toBe(0);
  });

  it("null 이면 빈 글 — 줄을 쓰지 않고 지우지도 않음", () => {
    expect(clickSql(null, "t")).toBe("");
  });
});

describe("parseClicks · GET /ga4 응답의 clicks (작업 0359)", () => {
  const data = { from: "2026-11-03", to: "2026-11-30", since: "2026-11-26", events: [{ name: "country_compare", count: 9, users: 6 }] };

  it("저장한 글을 다시 읽으면 같은 데이터 · 깨졌거나 모양이 다르면 null", () => {
    expect(parseClicks(JSON.stringify(data))).toEqual(data);
    for (const b of ["", "{", "[]", "null", JSON.stringify({ ...data, from: "x" }), JSON.stringify({ ...data, since: "내일" }), JSON.stringify({ ...data, events: "x" }), JSON.stringify({ ...data, events: [{ name: "a", count: -1, users: 1 }] }), JSON.stringify({ ...data, events: [{ name: "a", count: 1.5, users: 1 }] }), JSON.stringify({ ...data, events: [{ count: 1, users: 1 }] })]) expect(parseClicks(b), b).toBeNull();
  });

  it("ga4Report — 저장된 'ga4-click-events' 가 있으면 clicks · 없거나 깨졌으면 null · 계약(Ga4Report)을 통과", () => {
    const withData = ga4Report([], [], [], [{ key: "ga4-click-events", body: JSON.stringify(data) }]);
    expect(withData.clicks).toEqual(data);
    expect(Ga4Report.safeParse(withData).success).toBe(true);
    expect(ga4Report([], [], []).clicks).toBeNull();
    expect(ga4Report([], [], [], [{ key: "ga4-click-events", body: "{깨짐" }]).clicks).toBeNull();
  });

  it("예전 응답(clicks 없음)도 계약을 통과하고 clicks 는 null — 웹 · 어드민이 API 보다 먼저 배포돼도 깨지지 않음", () => {
    const old = Ga4Report.parse({ daily: [], sources: [], pages: [] });
    expect(old.clicks).toBeNull();
  });

  it("시작 날 상수가 계약의 since 모양을 통과", () => {
    expect(Ga4Report.safeParse({ daily: [], sources: [], pages: [], clicks: { from: "2026-11-03", to: "2026-11-30", since: CLICK_EVENTS_SINCE, events: [] } }).success).toBe(true);
  });
});
