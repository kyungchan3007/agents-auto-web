// /geo 계약 — 이름 바꾼 날 기준 상수와 비교용 선택 필드 (작업 0205)
import { describe, expect, it } from "vitest";
import { GeoReport, RENAME_DAY } from "./geo";

const base = { since: "2026-10-19", firstDay: "2026-11-05", bots: [], referrals: [], pages: [] };

describe("GeoReport 계약 (작업 0205)", () => {
  it("이름 바꾼 날은 상수 한 곳 — 2026-11-17", () => {
    expect(RENAME_DAY).toBe("2026-11-17");
  });
  it("daily · answerDays 가 없는 옛 응답도 통과 (하위 호환)", () => {
    const r = GeoReport.parse(base);
    expect(r.daily).toBeUndefined();
    expect(r.answerDays).toBeUndefined();
  });
  it("daily · answerDays 모양", () => {
    const r = GeoReport.parse({
      ...base,
      daily: [{ day: "2026-11-16", kind: "training", name: "GPTBot", hits: 3 }, { day: "2026-11-17", kind: "referral", name: "ChatGPT", hits: 1 }],
      answerDays: [{ day: "2026-11-17", edition: 2, engine: "claude", question: "해외직구 관세 계산기", group: "general", status: "ok", found: true, cited: false }],
    });
    expect(r.daily).toHaveLength(2);
    expect(r.answerDays?.[0].edition).toBe(2);
  });
  it("모르는 종류 · 판 번호는 거부", () => {
    expect(GeoReport.safeParse({ ...base, daily: [{ day: "2026-11-16", kind: "test", name: "x", hits: 1 }] }).success).toBe(false);
    expect(GeoReport.safeParse({ ...base, answerDays: [{ day: "2026-11-17", edition: 9, engine: "claude", question: "q", group: "general", status: "ok", found: true, cited: true }] }).success).toBe(false);
  });
});
