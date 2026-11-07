import type Anthropic from "@anthropic-ai/sdk";
import { GeoReport } from "@hav/shared/geo";
import { describe, expect, it } from "vitest";
import { answersSql, claudeHit, isTripfx, openaiHit, perplexityHit } from "./ask";
import { QUESTIONS, questionOf } from "./questions";
import { type AnswerInput, answersSummary, geoReport } from "./summary";

describe("AI 답변 인용 측정 (작업 0139)", () => {
  it("tripfx 주소 판정 — 도메인만 · 비슷한 이름은 아님", () => {
    expect(isTripfx("https://tripfx.pages.dev/currencies/USD")).toBe(true);
    expect(isTripfx("https://abc123.tripfx.pages.dev/")).toBe(true);
    expect(isTripfx("https://tripfx.pages.dev.evil.com/")).toBe(false);
    expect(isTripfx("https://tripfix.com/")).toBe(false);
    expect(isTripfx("tripfx.pages.dev")).toBe(false);
    expect(isTripfx(null)).toBe(false);
  });

  it("Claude — 검색 결과에만 있으면 found · 인용 표시에 있으면 cited", () => {
    const content = [
      { type: "web_search_tool_result", tool_use_id: "t", content: [{ type: "web_search_result", url: "https://tripfx.pages.dev/", title: "Tripfx" }] },
      { type: "text", text: "답", citations: [{ type: "web_search_result_location", url: "https://example.com/", cited_text: "", encrypted_index: "", title: null }] },
    ] as unknown as Anthropic.Beta.BetaContentBlock[];
    expect(claudeHit(content)).toEqual({ cited: false, found: true });
    const cited = [{ type: "text", text: "답", citations: [{ type: "web_search_result_location", url: "https://tripfx.pages.dev/calc" }] }] as unknown as Anthropic.Beta.BetaContentBlock[];
    expect(claudeHit(cited)).toEqual({ cited: true, found: true });
  });

  it("Claude — 검색 오류 블록(목록이 아님)은 건너뜀", () => {
    const content = [{ type: "web_search_tool_result", tool_use_id: "t", content: { type: "web_search_tool_result_error", error_code: "max_uses_exceeded" } }] as unknown as Anthropic.Beta.BetaContentBlock[];
    expect(claudeHit(content)).toEqual({ cited: false, found: false });
  });

  it("OpenAI — url_citation · 검색 출처", () => {
    const json = {
      output: [
        { type: "web_search_call", action: { sources: [{ type: "url", url: "https://tripfx.pages.dev/" }] } },
        { type: "message", content: [{ type: "output_text", text: "답", annotations: [{ type: "url_citation", url: "https://example.com/" }] }] },
      ],
    };
    expect(openaiHit(json)).toEqual({ cited: false, found: true });
    expect(openaiHit({ output: [{ type: "message", content: [{ annotations: [{ type: "url_citation", url: "https://tripfx.pages.dev/prices" }] }] }] })).toEqual({ cited: true, found: true });
    expect(openaiHit("이상한 응답")).toEqual({ cited: false, found: false });
  });

  it("Perplexity — citations · search_results", () => {
    expect(perplexityHit({ citations: ["https://tripfx.pages.dev/"], search_results: [] })).toEqual({ cited: true, found: true });
    expect(perplexityHit({ citations: ["https://a.com/"], search_results: [{ url: "https://tripfx.pages.dev/" }] })).toEqual({ cited: false, found: true });
    expect(perplexityHit({})).toEqual({ cited: false, found: false });
  });

  it("SQL — 같은 날 다시 돌려도 한 줄 · 이상한 값은 넣지 않음 · 오래된 기록 지움", () => {
    const sql = answersSql(
      [
        { day: "2026-11-07", engine: "claude", question: "g1", status: "ok", cited: true, found: true },
        { day: "2026-11-07", engine: "claude", question: "x'; DROP TABLE geo_answers;--", status: "ok", cited: true, found: true },
      ],
      "2026-08-09",
    );
    expect(sql).toContain("DELETE FROM geo_answers WHERE day < '2026-08-09';");
    expect(sql).toContain("VALUES ('2026-11-07', 'claude', 'g1', 'ok', 1, 1) ON CONFLICT (day, engine, question) DO UPDATE");
    expect(sql).not.toContain("DROP");
  });

  it("질문 번호는 겹치지 않고 기준선과 같은 24개 (브랜드 8 · 일반 16)", () => {
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(24);
    expect(QUESTIONS.filter((q) => q.group === "brand")).toHaveLength(8);
  });

  it("요약 — 서비스마다 최근 측정일 · 실패는 인용으로 세지 않음 · 기록이 없으면 null", () => {
    const a = (day: string, engine: AnswerInput["engine"], question: string, status: AnswerInput["status"], cited: number, found = cited): AnswerInput => ({ day, engine, question, status, cited, found });
    expect(answersSummary([], questionOf)).toBeNull();
    const s = answersSummary(
      [a("2026-11-06", "claude", "g1", "ok", 1), a("2026-11-07", "claude", "g1", "ok", 0, 1), a("2026-11-07", "claude", "g2", "ok", 1), a("2026-11-07", "claude", "g3", "error", 0), a("2026-11-07", "perplexity", "b1", "ok", 0)],
      questionOf,
    );
    expect(s?.engines).toEqual([
      {
        engine: "claude",
        day: "2026-11-07",
        total: 3,
        ok: 2,
        cited: 1,
        found: 2,
        citedQuestions: ["지금 환전해도 될까 달러 최근 90일"],
        results: [
          { question: "오늘 달러 환율 싼 편인가요", group: "general", status: "ok", cited: false, found: true },
          { question: "지금 환전해도 될까 달러 최근 90일", group: "general", status: "ok", cited: true, found: true },
          { question: "엔화 환율 지금 싼 편인지 확인", group: "general", status: "error", cited: false, found: false },
        ],
      },
      { engine: "perplexity", day: "2026-11-07", total: 1, ok: 1, cited: 0, found: 0, citedQuestions: [], results: [{ question: "Tripfx", group: "brand", status: "ok", cited: false, found: false }] },
    ]);
    expect(s?.history).toEqual([
      { day: "2026-11-06", engine: "claude", total: 1, ok: 1, cited: 1 },
      { day: "2026-11-07", engine: "claude", total: 3, ok: 2, cited: 1 },
      { day: "2026-11-07", engine: "perplexity", total: 1, ok: 1, cited: 0 },
    ]);
    expect(() => GeoReport.parse(geoReport([], "2026-10-08", null, s))).not.toThrow();
  });
});
