import { GeoReport } from "@hav/shared/geo";
import { describe, expect, it } from "vitest";
import { editionOfQuestion, questionOf } from "./questions";
import { type AnswerInput, type GeoRow, answerDays, geoReport } from "./summary";

const row = (day: string, kind: GeoRow["kind"], name: string, path: string, hits: number): GeoRow => ({ day, kind, name, path, hits });

describe("GEO 응답 (작업 0129)", () => {
  const r = geoReport(
    [
      row("2026-11-05", "training", "GPTBot", "/", 2),
      row("2026-11-06", "training", "GPTBot", "/about", 3),
      row("2026-11-06", "engine", "Googlebot", "/", 9),
      row("2026-11-06", "referral", "ChatGPT", "/calc", 1),
      row("2026-11-07", "test", "Flapfx-Verify", "/geo", 5),
    ],
    "2026-10-08",
  );
  it("봇 · 유입 합계 · 최근 날 · 계약 모양", () => {
    expect(GeoReport.parse(r)).toBeTruthy();
    expect(r.bots[0]).toEqual({ name: "Googlebot", kind: "engine", hits: 9, lastDay: "2026-11-06" });
    expect(r.bots[1]).toEqual({ name: "GPTBot", kind: "training", hits: 5, lastDay: "2026-11-06" });
    expect(r.referrals).toEqual([{ name: "ChatGPT", hits: 1, lastDay: "2026-11-06" }]);
  });
  it("페이지별은 AI 봇만 · 검색 엔진 · 유입 제외", () => {
    expect(r.pages).toEqual([{ path: "/about", hits: 3 }, { path: "/", hits: 2 }]);
  });
  it("운영 확인 방문은 공개 수치에 없음", () => {
    expect(JSON.stringify(r.bots)).not.toContain("Verify");
    expect(r.firstDay).toBe("2026-11-05");
    expect(r.verifiedDay).toBe("2026-11-07");
  });
  it("기록이 없으면 빈 값", () => {
    expect(geoReport([], "2026-10-08")).toEqual({ since: "2026-10-08", firstDay: null, bots: [], referrals: [], pages: [], verifiedDay: null, search: null, answers: null, daily: [], answerDays: [] });
  });
  it("날짜별 집계 daily — 봇 · 유입을 일 · 종류 · 이름별로 합침 · 페이지는 합치고 · 운영 확인 방문은 뺌 (작업 0205)", () => {
    const d = geoReport(
      [
        row("2026-11-16", "training", "GPTBot", "/", 2),
        row("2026-11-16", "training", "GPTBot", "/about", 3),
        row("2026-11-17", "referral", "ChatGPT", "/calc", 1),
        row("2026-11-17", "test", "Flapfx-Verify", "/geo", 5),
      ],
      "2026-10-08",
    ).daily;
    expect(d).toEqual([
      { day: "2026-11-16", kind: "training", name: "GPTBot", hits: 5 },
      { day: "2026-11-17", kind: "referral", name: "ChatGPT", hits: 1 },
    ]);
    expect(JSON.stringify(d)).not.toContain("path");
  });
  it("기존 필드는 그대로 — daily 를 더해도 bots · referrals · pages 값이 같음", () => {
    expect(r.bots.map((b) => b.hits)).toEqual([9, 5]);
    expect(r.daily?.length).toBe(4);
  });
});

describe("날짜별 질문 결과 answerDays (작업 0205)", () => {
  const a = (day: string, engine: AnswerInput["engine"], question: string, status: AnswerInput["status"], cited: number, found: number): AnswerInput => ({ day, engine, question, status, cited, found });
  const rows = [
    a("2026-11-17", "claude", "g7", "ok", 1, 1),
    a("2026-11-16", "claude", "g1", "ok", 0, 1),
    a("2026-11-18", "claude", "b14", "error", 0, 0),
    a("2026-11-18", "claude", "zzz", "ok", 1, 1),
  ];
  const out = answerDays(rows, questionOf);
  it("질문 글자 · 구분 · 판 번호를 붙이고 · 날짜 오름차순 · 모르는 질문은 뺌", () => {
    expect(out.map((x) => [x.day, x.question, x.group, x.edition])).toEqual([
      ["2026-11-16", "오늘 달러 환율 싼 편인가요", "general", 1],
      ["2026-11-17", "해외직구 관세 계산기", "general", 1],
      ["2026-11-18", "Flapfx", "brand", 3],
    ]);
  });
  it("실패한 질문은 found · cited 를 false 로", () => {
    expect(out[2]).toMatchObject({ status: "error", found: false, cited: false });
    expect(out[1]).toMatchObject({ status: "ok", found: true, cited: true });
  });
  it("기록이 없으면 빈 배열", () => {
    expect(answerDays([], questionOf)).toEqual([]);
  });
  it("질문 판 — 1판 · 2판에서 처음 쓴 질문 · 3판(Flapfx 브랜드)", () => {
    expect(["b1", "b8", "g1", "g16"].map(editionOfQuestion)).toEqual([1, 1, 1, 1]);
    expect(["b9", "b13", "g17", "g29"].map(editionOfQuestion)).toEqual([2, 2, 2, 2]);
    expect(["b14", "b21"].map(editionOfQuestion)).toEqual([3, 3]);
  });
});
