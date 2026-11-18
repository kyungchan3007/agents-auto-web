import { RENAME_DAY } from "@hav/shared/geo";
import type { GeoReport } from "@hav/shared/geo";
import { describe, expect, it } from "vitest";
import { dayRange, renameCompare } from "./rename-compare";

type Daily = NonNullable<GeoReport["daily"]>[number];
type AnswerDay = NonNullable<GeoReport["answerDays"]>[number];

const report = (over: Partial<GeoReport> = {}): GeoReport => ({ since: "2026-10-19", firstDay: "2026-11-05", bots: [], referrals: [], pages: [], verifiedDay: null, search: null, answers: null, ...over });
const d = (day: string, name: string, hits: number, kind: Daily["kind"] = "training"): Daily => ({ day, kind, name, hits });
const a = (day: string, question: string, over: Partial<AnswerDay> = {}): AnswerDay => ({ day, edition: 1, engine: "claude", question, group: "general", status: "ok", found: false, cited: false, ...over });

describe("날짜 범위", () => {
  it("양 끝을 포함 · 달 넘어감", () => {
    expect(dayRange("2026-11-29", "2026-12-02")).toEqual(["2026-11-29", "2026-11-30", "2026-12-01", "2026-12-02"]);
    expect(dayRange("2026-11-17", "2026-11-17")).toEqual(["2026-11-17"]);
    expect(dayRange("2026-11-18", "2026-11-17")).toEqual([]);
  });
});

describe("이름 바꾼 날 전후 비교 — 봇 (작업 0205)", () => {
  const r = report({ daily: [d("2026-11-05", "GPTBot", 4), d("2026-11-16", "GPTBot", 6), d("2026-11-17", "GPTBot", 3), d("2026-11-18", "GPTBot", 1)] });
  const c = renameCompare(r, "2026-11-18");
  const gpt = c.bots?.[0];
  it("기준일 경계 — 11-16 은 전 · 11-17 은 후", () => {
    expect(gpt?.before?.total).toBe(10);
    expect(gpt?.after?.total).toBe(4);
  });
  it("하루 평균의 분모는 달력 날짜 수 — 0인 날 포함 (전 12일: 11-05 ~ 11-16 · 후 2일)", () => {
    expect(gpt?.before?.days).toBe(12);
    expect(gpt?.after?.days).toBe(2);
    expect(gpt?.before?.perDay).toBeCloseTo(10 / 12, 5);
    expect(gpt?.after?.perDay).toBe(2);
    expect(c.beforeDays).toBe(12);
    expect(c.afterDays).toBe(2);
  });
  it("날짜별 막대 자료는 첫 기록일 ~ 오늘 모든 날 (방문 없는 날은 0)", () => {
    expect(gpt?.daily).toHaveLength(14);
    expect(gpt?.daily[1]).toEqual({ day: "2026-11-06", hits: 0 });
    expect(gpt?.daily.at(-1)).toEqual({ day: "2026-11-18", hits: 1 });
  });
  it("같은 날 같은 봇 여러 줄은 합침 · 봇은 방문 많은 순 · 유입은 봇 목록에 없음", () => {
    const c2 = renameCompare(report({ daily: [d("2026-11-17", "A", 1), d("2026-11-17", "B", 2), d("2026-11-17", "B", 3), d("2026-11-17", "ChatGPT", 9, "referral")] }), "2026-11-17");
    expect(c2.bots?.map((b) => [b.name, b.after?.total])).toEqual([["B", 5], ["A", 1]]);
  });
  it("후 기간이 짧으면 short · 7일 이상이면 아님", () => {
    expect(c.short).toBe(true);
    expect(renameCompare(r, "2026-11-23").short).toBe(false);
  });
  it("기준일 전 기록이 없으면 전은 null · 오늘이 기준일 전이면 후는 null", () => {
    expect(renameCompare(report({ firstDay: "2026-11-17", daily: [d("2026-11-17", "A", 1)] }), "2026-11-18").bots?.[0].before).toBeNull();
    expect(renameCompare(report({ daily: [d("2026-11-10", "A", 1)] }), "2026-11-16").bots?.[0].after).toBeNull();
  });
  it("기록이 오늘보다 뒤 날짜면 그 날까지 늘림 (시계 차이)", () => {
    expect(renameCompare(report({ daily: [d("2026-11-19", "A", 2)] }), "2026-11-18").bots?.[0].after?.days).toBe(3);
  });
});

describe("이름 바꾼 날 전후 비교 — 유입 (작업 0205)", () => {
  it("이름별 · 합계의 전후 · 없으면 빈 줄", () => {
    const c = renameCompare(report({ daily: [d("2026-11-10", "ChatGPT", 2, "referral"), d("2026-11-18", "ChatGPT", 1, "referral"), d("2026-11-18", "Perplexity", 1, "referral")] }), "2026-11-18");
    expect(c.referrals?.rows.map((x) => [x.name, x.before?.total, x.after?.total])).toEqual([["ChatGPT", 2, 1], ["Perplexity", 0, 1]]);
    expect(c.referrals?.sum.before?.total).toBe(2);
    expect(c.referrals?.sum.after?.total).toBe(2);
    expect(renameCompare(report({ daily: [d("2026-11-10", "GPTBot", 2)] }), "2026-11-18").referrals?.rows).toEqual([]);
  });
});

describe("이름 바꾼 날 전후 비교 — 새 필드가 없을 때 (API 배포 전 · 미리보기)", () => {
  it("daily · answerDays 가 없으면 봇 · 유입 · 답변은 null (지어내지 않음)", () => {
    const c = renameCompare(report(), "2026-11-18");
    expect(c.bots).toBeNull();
    expect(c.referrals).toBeNull();
    expect(c.answers).toBeNull();
    expect(c.day).toBe(RENAME_DAY);
  });
});

describe("이름 바꾼 날 전후 비교 — AI 답변 (작업 0205)", () => {
  const rows: AnswerDay[] = [
    a("2026-11-16", "q1", { found: true }),
    a("2026-11-16", "q2"),
    a("2026-11-17", "q1", { found: true, cited: true }),
    a("2026-11-17", "q2", { status: "error" }),
    a("2026-11-17", "old", { group: "general" }),
    a("2026-11-18", "q1", { found: true }),
    a("2026-11-18", "q2", { found: true }),
    a("2026-11-18", "Flapfx", { group: "brand", edition: 3, cited: true, found: true }),
    a("2026-11-16", "Tripfx", { group: "brand", edition: 1, found: true }),
    a("2026-11-17", "Tripfx 환율", { group: "brand", edition: 2 }),
  ];
  const c = renameCompare(report({ answerDays: rows }), "2026-11-18");
  it("일반 질문은 같은 질문끼리 전 · 후 — 측정 횟수는 응답 받은 것만 · 가장 최근 측정일에 있던 질문만", () => {
    const g = c.answers?.general ?? [];
    expect(g.map((x) => x.question)).toEqual(["q1", "q2"]);
    expect(g[0]).toMatchObject({ before: { measured: 1, found: 1, cited: 0 }, after: { measured: 2, found: 2, cited: 1 } });
    expect(g[1]).toMatchObject({ before: { measured: 1, found: 0, cited: 0 }, after: { measured: 1, found: 1, cited: 0 } });
  });
  it("브랜드는 이어 비교하지 않고 판으로 — Tripfx 시기(1 · 2판) / Flapfx 시기(3판)", () => {
    expect(c.answers?.brand.tripfx).toEqual({ days: 2, first: "2026-11-16", last: "2026-11-17", measured: 2, found: 1, cited: 0 });
    expect(c.answers?.brand.flapfx).toEqual({ days: 1, first: "2026-11-18", last: "2026-11-18", measured: 1, found: 1, cited: 1 });
  });
  it("측정한 판이 없으면 그 시기는 null · 기록이 비어 있으면 일반도 빈 목록", () => {
    const e = renameCompare(report({ answerDays: [] }), "2026-11-18").answers;
    expect(e).toEqual({ general: [], brand: { tripfx: null, flapfx: null } });
  });
});

describe("이름 바꾼 날 전후 비교 — 검색 노출", () => {
  it("옛 속성은 Search Console 값 · 새 속성(flapfx.com)은 아직 없음", () => {
    const s = { syncedAt: "2026-11-18T00:00:00.000Z", firstDay: "2026-10-20", lastDay: "2026-11-16", clicks: 2, impressions: 40, position: 12, queries: [], pages: [] };
    expect(renameCompare(report({ search: s }), "2026-11-18").search).toEqual({ old: { impressions: 40, clicks: 2, range: "2026-10-20 ~ 2026-11-16" }, newProperty: null });
    expect(renameCompare(report(), "2026-11-18").search).toEqual({ old: null, newProperty: null });
  });
});
