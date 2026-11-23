// 작업 0323 — 인스타 성과 가져오기: 응답 → 행 · SQL · 토큰 지우기 (순수 함수 · 테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   builder 가 만들 것 — apps/api/src/features/ig/insights.ts
//     export type MediaRow = { day: string; mediaId: string; metric: string; value: number }
//     export type AccountRow = { day: string; metric: string; value: number }
//     export function mediaRows(day: string, mediaId: string, apiJson: unknown): MediaRow[]      — GET /{media-id}/insights?metric=reach,likes,saved,shares,views 의 응답
//     export function accountRows(day: string, apiJson: unknown): AccountRow[]                    — GET /{IG_USER_ID}/insights?metric=…&metric_type=total_value 의 응답
//     export function insightsSql(rows: (MediaRow | AccountRow)[]): string                       — mediaId 가 있는 행은 ig_media_insights · 없으면 ig_account_insights
//     export function scrubToken(text: string, token: string): string
//   원칙(prd): 숫자는 받은 값만 · 받지 못한 지표는 0 이 아니라 행이 없음 · 받은 0 은 0 · 토큰은 어디에도 남지 않음
import { describe, expect, it } from "vitest";
import { type AccountRow, type MediaRow, accountRows, insightsSql, mediaRows, scrubToken } from "./insights";

const DAY = "2026-11-23";
/** 게시물 성과 응답 모양(Graph API insights): data[] 마다 name · values[{ value }] */
const mediaApi = (vals: Record<string, unknown>) => ({ data: Object.entries(vals).map(([name, value]) => ({ name, period: "lifetime", values: [{ value }], title: name, id: `1790/insights/${name}/lifetime` })) });
/** 계정 성과 응답 모양(metric_type=total_value): data[] 마다 name · total_value{ value } */
const accountApi = (vals: Record<string, unknown>) => ({ data: Object.entries(vals).map(([name, value]) => ({ name, period: "day", total_value: { value }, title: name, id: `1784/insights/${name}/day` })) });

describe("mediaRows — 게시물 성과 응답 → 행 (작업 0323)", () => {
  it("받은 지표마다 한 행 · 날짜 · 게시물 · 지표 · 값", () => {
    const rows = mediaRows(DAY, "1790001", mediaApi({ reach: 120, likes: 9, saved: 3, shares: 2, views: 300 }));
    expect(rows).toHaveLength(5);
    expect(rows).toContainEqual({ day: DAY, mediaId: "1790001", metric: "reach", value: 120 });
    expect(rows).toContainEqual({ day: DAY, mediaId: "1790001", metric: "views", value: 300 });
    expect(Object.fromEntries(rows.map((r) => [r.metric, r.value]))).toEqual({ reach: 120, likes: 9, saved: 3, shares: 2, views: 300 });
  });

  it("받은 0 은 0 으로 남김 — 값이 있다는 뜻", () => {
    const rows = mediaRows(DAY, "1790001", mediaApi({ reach: 0, likes: 0 }));
    expect(rows.map((r) => [r.metric, r.value])).toEqual([["reach", 0], ["likes", 0]]);
  });

  it("값이 없는 지표는 행이 없음 — 0 으로 채우지 않음 (null · 값 칸 없음 · 숫자가 아님 · 무한대)", () => {
    const api = { data: [
      { name: "reach", values: [{ value: 5 }] },
      { name: "likes", values: [{ value: null }] },
      { name: "saved", values: [] },
      { name: "shares" },
      { name: "views", values: [{ value: "많음" }] },
      { name: "comments", values: [{ value: Number.POSITIVE_INFINITY }] },
    ] };
    expect(mediaRows(DAY, "1790001", api)).toEqual([{ day: DAY, mediaId: "1790001", metric: "reach", value: 5 }]);
  });

  it("오류 응답 · 알 수 없는 모양은 행 없음 · 던지지 않음", () => {
    expect(mediaRows(DAY, "1790001", { error: { message: "(#10) Application does not have permission", type: "OAuthException", code: 10 } })).toEqual([]);
    for (const bad of [null, undefined, "x", 42, [], {}, { data: "x" }, { data: null }, { data: [null, 1, "a"] }]) expect(mediaRows(DAY, "1790001", bad), JSON.stringify(bad)).toEqual([]);
  });

  it("행에 응답의 다른 글(제목 · 설명 · 주소)을 싣지 않음 — 값만", () => {
    const rows = mediaRows(DAY, "1790001", mediaApi({ reach: 7 }));
    expect(Object.keys(rows[0] ?? {}).sort()).toEqual(["day", "mediaId", "metric", "value"]);
  });
});

describe("accountRows — 계정 성과 응답 → 행 (작업 0323)", () => {
  it("받은 지표마다 한 행 · 날짜 · 지표 · 값 (게시물 번호 없음)", () => {
    const rows = accountRows(DAY, accountApi({ reach: 40, views: 90, profile_views: 6, website_clicks: 2, accounts_engaged: 4 }));
    expect(rows).toHaveLength(5);
    expect(rows).toContainEqual({ day: DAY, metric: "profile_views", value: 6 });
    expect(rows).toContainEqual({ day: DAY, metric: "website_clicks", value: 2 });
    for (const r of rows) expect("mediaId" in r).toBe(false);
  });

  it("받은 0 은 0 · 값 없음 / 값 구조가 다른 지표(follows_and_unfollows 의 total_value 에 value 가 없음)는 행 없음", () => {
    const api = { data: [
      { name: "reach", total_value: { value: 0 } },
      { name: "views", total_value: {} },
      { name: "follows_and_unfollows", total_value: { breakdowns: [{ dimension_keys: ["follow_type"], results: [] }] } },
      { name: "likes" },
      { name: "saves", total_value: { value: null } },
    ] };
    expect(accountRows(DAY, api)).toEqual([{ day: DAY, metric: "reach", value: 0 }]);
  });

  it("오류 응답 · 알 수 없는 모양은 행 없음 · 던지지 않음", () => {
    expect(accountRows(DAY, { error: { message: "Invalid parameter", code: 100 } })).toEqual([]);
    for (const bad of [null, undefined, "x", [], {}, { data: {} }]) expect(accountRows(DAY, bad), JSON.stringify(bad)).toEqual([]);
  });
});

describe("insightsSql — 같은 날 다시 넣으면 덮어쓰는 SQL (작업 0323)", () => {
  const m: MediaRow = { day: DAY, mediaId: "1790001", metric: "reach", value: 120 };
  const a: AccountRow = { day: DAY, metric: "profile_views", value: 6 };

  it("게시물 행은 ig_media_insights(day, media_id, metric, value) · 계정 행은 ig_account_insights(day, metric, value)", () => {
    const sql = insightsSql([m, a]);
    expect(sql).toMatch(/INSERT INTO ig_media_insights \(day, media_id, metric, value\) VALUES \('2026-11-23', '1790001', 'reach', 120\)/);
    expect(sql).toMatch(/INSERT INTO ig_account_insights \(day, metric, value\) VALUES \('2026-11-23', 'profile_views', 6\)/);
  });

  it("같은 키(날짜 · 대상 · 지표)는 덮어씀(upsert) — 키 충돌 때 값 갱신 · 지우지 않음(지난 날 값이 남음)", () => {
    const sql = insightsSql([m, a]);
    expect(sql).toMatch(/ON CONFLICT\s*\(day, media_id, metric\)\s*DO UPDATE SET value\s*=\s*excluded\.value/i);
    expect(sql).toMatch(/ON CONFLICT\s*\(day, metric\)\s*DO UPDATE SET value\s*=\s*excluded\.value/i);
    expect(sql).not.toMatch(/DELETE|DROP|TRUNCATE/i);
  });

  it("행마다 한 문장 · 세미콜론으로 끝남 · 같은 입력이면 같은 글", () => {
    const sql = insightsSql([m, a, { ...m, metric: "likes", value: 9 }]);
    expect(sql.match(/INSERT INTO/g)).toHaveLength(3);
    expect(sql.trim().endsWith(";")).toBe(true);
    expect(insightsSql([m, a])).toBe(insightsSql([m, a]));
  });

  it("행이 없으면 문장이 없음", () => {
    expect(insightsSql([]).trim()).toBe("");
  });

  it("따옴표 이스케이프 — 게시물 번호 · 지표 이름은 데이터", () => {
    const sql = insightsSql([{ day: DAY, mediaId: "x'); DROP TABLE fx_rates; --", metric: "re'ach", value: 1 }]);
    expect(sql).toContain("'x''); DROP TABLE fx_rates; --'");
    expect(sql).toContain("'re''ach'");
  });

  it("숫자가 아닌 값(NaN · 무한대)은 SQL 에 넣지 않음 — 지어내지 않음", () => {
    const sql = insightsSql([{ ...m, value: Number.NaN }, { ...m, metric: "likes", value: Number.POSITIVE_INFINITY }, { ...m, metric: "saved", value: 3 }]);
    expect(sql).not.toMatch(/NaN|Infinity/);
    expect(sql.match(/INSERT INTO/g)).toHaveLength(1);
    expect(sql).toContain("'saved', 3");
  });
});

describe("scrubToken — 오류 문구에서 토큰 지우기 (작업 0323)", () => {
  const T = "EAAB.secret+token/ABC123=";

  it("토큰이 있는 자리는 모두 <토큰> 으로 — 여러 번 나와도 · 주소 · 머리글 글에서도", () => {
    const text = `request failed https://graph.facebook.com/v23.0/1/insights?access_token=${T}&x=1 · Authorization: Bearer ${T} · ${T}`;
    const out = scrubToken(text, T);
    expect(out).not.toContain(T);
    expect(out).not.toContain("secret+token");
    expect(out.match(/<토큰>/g)).toHaveLength(3);
    expect(out).toContain("request failed https://graph.facebook.com/v23.0/1/insights?access_token=<토큰>&x=1");
  });

  it("정규식 글자(. + * ? 등)가 든 토큰도 글자 그대로 찾음", () => {
    expect(scrubToken("a.b*c?d+e", "a.b*c?d+e")).toBe("<토큰>");
    expect(scrubToken("axbxc", "a.b")).toBe("axbxc"); // . 이 아무 글자가 아님
  });

  it("토큰이 없으면 글 그대로 · 빈 토큰이면 아무것도 바꾸지 않음(글을 망가뜨리지 않음)", () => {
    expect(scrubToken("HTTP 400 Bad Request", T)).toBe("HTTP 400 Bad Request");
    expect(scrubToken("HTTP 400 Bad Request", "")).toBe("HTTP 400 Bad Request");
  });
});
