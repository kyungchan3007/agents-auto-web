import { GeoReport } from "@hav/shared/geo";
import { describe, expect, it } from "vitest";
import { type GeoRow, geoReport } from "./summary";

const row = (day: string, kind: GeoRow["kind"], name: string, path: string, hits: number): GeoRow => ({ day, kind, name, path, hits });

describe("GEO 응답 (작업 0129)", () => {
  const r = geoReport(
    [
      row("2026-11-05", "training", "GPTBot", "/", 2),
      row("2026-11-06", "training", "GPTBot", "/about", 3),
      row("2026-11-06", "engine", "Googlebot", "/", 9),
      row("2026-11-06", "referral", "ChatGPT", "/calc", 1),
      row("2026-11-07", "test", "Tripfx-Verify", "/geo", 5),
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
    expect(geoReport([], "2026-10-08")).toEqual({ since: "2026-10-08", firstDay: null, bots: [], referrals: [], pages: [], verifiedDay: null });
  });
});
