import { describe, expect, it } from "vitest";
import type { GeoReport } from "@hav/shared/geo";
import { answerHistory, answerLines, geoView } from "./geo-view";

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
  it("AI 답변 인용 — 세 서비스 모두 · 기록이 없으면 측정 안 함 · 실패는 따로 · 질문별 결과 · 저장 기록 (작업 0139 · 0141)", () => {
    const base: GeoReport = { since: "2026-10-08", firstDay: null, bots: [], referrals: [], pages: [], verifiedDay: null, search: null, answers: null };
    expect(answerLines(base).map((a) => a.measured)).toEqual([false, false, false]);
    expect(answerHistory(base)).toEqual([]);
    const r: GeoReport = {
      ...base,
      answers: {
        engines: [
          {
            engine: "claude",
            day: "2026-11-07",
            total: 2,
            ok: 1,
            cited: 1,
            found: 1,
            citedQuestions: ["해외직구 관세 계산기"],
            results: [
              { question: "해외직구 관세 계산기", group: "general", status: "ok", cited: true, found: true },
              { question: "Tripfx", group: "brand", status: "error", cited: false, found: false },
            ],
          },
        ],
        history: [
          { day: "2026-11-06", engine: "claude", total: 24, ok: 24, cited: 0 },
          { day: "2026-11-07", engine: "claude", total: 2, ok: 1, cited: 1 },
        ],
      },
    };
    const [claude, openai] = answerLines(r);
    expect(claude).toMatchObject({ name: "Claude", measured: true, day: "2026-11-07", saved: 2, cited: "1 / 1", found: "1 / 1", failed: 1 });
    expect(claude.measured && claude.results).toEqual([
      ["해외직구 관세 계산기", "일반", "예", "예", "성공"],
      ["Tripfx", "사이트 이름", "-", "-", "실패"],
    ]);
    expect(openai).toEqual({ engine: "openai", name: "ChatGPT", measured: false });
    expect(answerHistory(r)).toEqual([
      ["2026-11-07", "Claude", 2, 1, 1],
      ["2026-11-06", "Claude", 24, 24, 0],
    ]);
  });
});
