import { describe, expect, it } from "vitest";
import type { GeoReport } from "@hav/shared/geo";
import { MEASUREMENTS, answerLines, geoView } from "./geo-view";

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
      search: null,
      answers: null,
    });
    expect([v.aiHits, v.engineHits, v.referralHits]).toEqual([5, 9, 4]);
    expect(v.ai.map((b) => b.name)).toEqual(["GPTBot", "ChatGPT-User"]);
  });
  it("AI 답변 인용 — 응답을 받은 질문 수 기준 · 실패는 따로 · 기록이 없으면 빈 목록 (작업 0139)", () => {
    const base: GeoReport = { since: "2026-10-08", firstDay: null, bots: [], referrals: [], pages: [], verifiedDay: null, search: null, answers: null };
    expect(answerLines(base)).toEqual([]);
    const lines = answerLines({
      ...base,
      answers: { engines: [{ engine: "openai", day: "2026-11-07", total: 24, ok: 22, cited: 1, found: 3, citedQuestions: ["해외직구 관세 계산기"] }], history: [] },
    });
    expect(lines).toEqual([{ name: "ChatGPT", day: "2026-11-07", cited: "1 / 22", found: "3 / 22", failed: 2, citedQuestions: ["해외직구 관세 계산기"] }]);
  });
  it("측정 기록은 기준선부터", () => {
    expect(MEASUREMENTS[0]).toMatchObject({ date: "2026-11-05", brand: 0, general: 0 });
  });
});
