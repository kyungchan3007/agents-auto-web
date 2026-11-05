import { describe, expect, it } from "vitest";
import { MEASUREMENTS, geoView } from "./geo-view";

describe("GEO 화면 자료 (작업 0129)", () => {
  it("AI 봇과 일반 검색 엔진을 나눠 합계", () => {
    const v = geoView({
      since: "2026-10-08",
      firstDay: "2026-11-05",
      bots: [
        { name: "Googlebot", kind: "engine", hits: 9, lastDay: "2026-11-05" },
        { name: "GPTBot", kind: "training", hits: 2, lastDay: "2026-11-05" },
        { name: "ChatGPT-User", kind: "user", hits: 3, lastDay: "2026-11-05" },
      ],
      referrals: [{ name: "ChatGPT", hits: 4, lastDay: "2026-11-05" }],
      pages: [],
      verifiedDay: null,
    });
    expect([v.aiHits, v.engineHits, v.referralHits]).toEqual([5, 9, 4]);
    expect(v.ai.map((b) => b.name)).toEqual(["GPTBot", "ChatGPT-User"]);
  });
  it("측정 기록은 기준선부터", () => {
    expect(MEASUREMENTS[0]).toMatchObject({ date: "2026-11-05", brand: 0, general: 0 });
  });
});
