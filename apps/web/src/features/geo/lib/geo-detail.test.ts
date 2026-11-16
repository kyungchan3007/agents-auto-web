import { describe, expect, it } from "vitest";
import type { GeoReport } from "@hav/shared/geo";
import { GEO_LIMITS, geoDetail, methodLinkText } from "./geo-view";

const base: GeoReport = { since: "2026-10-17", firstDay: null, bots: [], referrals: [], pages: [], verifiedDay: null, search: null, answers: null };

describe("GEO 자세한 기록 (작업 0180)", () => {
  it("자료가 없으면 모든 구간이 비어 있음 — 값을 만들지 않음", () => {
    const d = geoDetail(base);
    expect(d.search).toBeNull();
    expect([d.history, d.aiBots, d.aiPages, d.referrals, d.engineBots].map((x) => x.length)).toEqual([0, 0, 0, 0, 0]);
    expect(d.answers.every((a) => !a.measured)).toBe(true);
    expect(d.period).toContain("아직 기록이 없습니다");
  });

  it("검색 성과 — 기간 · 노출 · 클릭 · 순위 · 검색어 줄, 순위가 없으면 자료 없음", () => {
    const search = { syncedAt: "2026-11-16T00:00:00.000Z", firstDay: "2026-11-03", lastDay: "2026-11-13", clicks: 0, impressions: 3, position: 2.7, queries: [], pages: [{ key: "/", clicks: 0, impressions: 3, position: 2.7 }] };
    const d = geoDetail({ ...base, search });
    expect(d.search).toMatchObject({ range: "2026-11-03 ~ 2026-11-13", impressions: "3회", clicks: "0회", position: "2.7위", queries: [], pages: [["/", 3, 0, 2.7]] });
    expect(geoDetail({ ...base, search: { ...search, position: null, firstDay: null, lastDay: null } }).search).toMatchObject({ range: "기록 없음", position: "자료 없음" });
  });

  it("봇 — AI 봇과 검색 엔진을 나눠 표 줄로 · 읽은 페이지 · 유입", () => {
    const d = geoDetail({
      ...base,
      firstDay: "2026-11-05",
      bots: [
        { name: "Googlebot", kind: "engine", hits: 13, lastDay: "2026-11-13" },
        { name: "GPTBot", kind: "training", hits: 1, lastDay: "2026-11-06" },
      ],
      referrals: [{ name: "ChatGPT", hits: 2, lastDay: "2026-11-10" }],
      pages: [{ path: "/", hits: 1 }],
    });
    expect(d.aiBots).toEqual([["GPTBot", "학습용 수집", 1, "2026-11-06"]]);
    expect(d.engineBots).toEqual([["Googlebot", 13, "2026-11-13"]]);
    expect(d.aiPages).toEqual([["/", 1]]);
    expect(d.referrals).toEqual([["ChatGPT", 2, "2026-11-10"]]);
    expect(d.period).toContain("첫 기록 2026-11-05");
  });

  it("측정의 한계 — 예전 다섯 문구가 그대로 있음", () => {
    expect(GEO_LIMITS[0]).toContain("이름은 위조될 수 있습니다");
    expect(GEO_LIMITS[4]).toBe("검색어는 노출 2회 이상인 것만 표시합니다.");
    expect(GEO_LIMITS.length).toBeGreaterThanOrEqual(5);
  });

  it("측정 방법 링크 글자 — 질문 수는 측정 기록에서만 · 없으면 수를 쓰지 않음", () => {
    expect(methodLinkText(null)).toBe("질문 목록과 측정 방법 보기 (GitHub)");
    expect(methodLinkText(base)).toBe("질문 목록과 측정 방법 보기 (GitHub)");
    const results = [
      { question: "a", group: "brand" as const, status: "ok" as const, cited: false, found: false },
      { question: "b", group: "general" as const, status: "ok" as const, cited: false, found: false },
    ];
    const answers = { engines: [{ engine: "claude" as const, day: "2026-11-14", total: 2, ok: 2, cited: 0, found: 0, citedQuestions: [], results }], history: [] };
    expect(methodLinkText({ ...base, answers })).toBe("질문 2개와 측정 방법 보기 (GitHub)");
  });
});
