import { describe, expect, it } from "vitest";
import type { GeoReport } from "@hav/shared/geo";
import { GEO_EDITION_NOTES, GEO_LIMITS, editionOf, geoDetail, methodLinkText } from "./geo-view";

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

// 작업 0196 — 질문 판이 바뀐 날을 표시해 앞뒤를 나눠 봄 (1판 2026-11-05 · 2판 11-17 · 3판 11-18 = 사이트 이름이 플랩 · flapfx 로 바뀐 뒤)
describe("측정 질문 판 표시 (작업 0196)", () => {
  it("날짜로 판을 찾음 — 11-16 까지 1판 · 11-17 은 2판 · 11-18 부터 3판 · 첫 측정 전 날짜는 없음", () => {
    expect(editionOf("2026-11-05")).toMatchObject({ edition: 1, label: "1판 · Tripfx" });
    expect(editionOf("2026-11-16")?.edition).toBe(1);
    expect(editionOf("2026-11-17")).toMatchObject({ edition: 2, label: "2판 · Tripfx" });
    expect(editionOf("2026-11-18")).toMatchObject({ edition: 3, label: "3판 · 플랩 flapfx" });
    expect(editionOf("2026-12-31")?.edition).toBe(3);
    expect(editionOf("2026-11-04")).toBeNull();
  });

  it("날짜별 기록 표 — 마지막 칸에 판을 적고, 판이 바뀐 날을 알 수 있음 · 최근 날부터", () => {
    const history = (day: string) => ({ day, engine: "claude" as const, total: 24, ok: 24, cited: 0 });
    const answers = { engines: [], history: [history("2026-11-16"), history("2026-11-17"), history("2026-11-18")] };
    const d = geoDetail({ ...base, answers });
    expect(d.history.map((row) => [row[0], row[5]])).toEqual([
      ["2026-11-18", "3판 · 플랩 flapfx"],
      ["2026-11-17", "2판 · Tripfx"],
      ["2026-11-16", "1판 · Tripfx"],
    ]);
  });

  it("판 설명 — 바뀐 날 · 이유 · 비교하는 법을 한국어로 (표 없이 줄글)", () => {
    const text = GEO_EDITION_NOTES.join(" ");
    expect(text).toContain("2026-11-18");
    expect(text).toContain("플랩");
    expect(text).toContain("flapfx.com");
    expect(text).toContain("일반 질문");
    expect(text).not.toMatch(/\|/);
  });
});

