// 작업 0170 — GEO 측정(/geo) 측정 수치 카드 4개 · 읽는 법 (테스트 먼저 · 구현 전에는 FAIL 이 정상) — geo 소유 화면 (geo 가 구현)
// Figma 07 · SR-GEO-01 — 실제 측정값만 (현재 인용 0) · 측정 방법과 한계를 숫자 옆에 · 측정하지 못한 날은 비움
//
// geo 가 만들 것 — apps/admin/src/features/geo/common/geo-view.ts 에 더함
//   geoCards(r: GeoReport): { label: string; value: string; note: string | null }[]     // 항상 4개 · 이 순서
//     [0] label "AI 답변 인용" · value `${인용한 질문 수} / ${질문 수} 질문` · note `${측정 횟수}회 측정 누적`
//         - 질문 수 = 서비스별 가장 최근 측정의 total 중 가장 큰 값 · 인용한 질문 수 = 가장 최근 측정들의 citedQuestions 를 합친 서로 다른 질문 수 · 측정 횟수 = answers.history 줄 수
//         - answers 가 null 이면 value "측정 전" · note null
//     [1] label "구글 검색 노출" · value `${search.impressions}회` · note `클릭 ${search.clicks}회 · Search Console` · search 가 null 이면 value "수집 전" · note "Search Console"
//     [2] label "AI · 검색 봇 방문" · value `${모든 bots hits 합}회` · note 방문이 많은 봇 상위 3개 `${이름} ${hits}` 를 " · " 로 (같으면 이름순) · 봇이 없으면 value "0회" · note null
//     [3] label "AI 서비스 유입" · value `${referrals hits 합}회` · note "방문 통계 기준"
//   geoReading(r: GeoReport): string[]
//     - answers 가 있으면 첫 줄 `질문 ${total}개(브랜드 ${brand} · 일반 ${general})를 같은 방식으로 직접 검색해 노출 · 인용을 기록합니다` — total · brand · general 은 질문 수가 가장 큰 서비스의 최근 측정 results 에서 (group 별 개수)
//     - 항상: "측정하지 못한 날은 비워 두고, 숫자를 추정하지 않습니다" · "원인 조사 기록은 GitHub 이슈에 공개합니다" (이 순서로 뒤에)
//     - answers 가 없으면 이 둘만 (질문 수를 지어내지 않음)
import { describe, expect, it } from "vitest";
import type { GeoReport } from "@hav/shared/geo";
import { geoCards, geoReading } from "./geo-view";

const BASE: GeoReport = { since: "2026-10-08", firstDay: "2026-11-05", bots: [], referrals: [], pages: [], verifiedDay: null, search: null, answers: null };

const questions = [...Array.from({ length: 8 }, (_, i) => ({ question: `브랜드 ${i}`, group: "brand" as const })), ...Array.from({ length: 16 }, (_, i) => ({ question: `일반 ${i}`, group: "general" as const }))];
const results = questions.map((q) => ({ ...q, status: "ok" as const, cited: false, found: false }));
const engine = (name: "claude" | "openai", cited: string[] = []) => ({ engine: name, day: "2026-11-14", total: 24, ok: 24, cited: cited.length, found: 2, citedQuestions: cited, results });
const history = (day: string) => (["claude", "openai", "perplexity"] as const).map((e) => ({ day, engine: e, total: 24, ok: 24, cited: 0 }));

const FULL: GeoReport = {
  ...BASE,
  bots: [
    { name: "Googlebot", kind: "engine", hits: 13, lastDay: "2026-11-14" },
    { name: "bingbot", kind: "engine", hits: 19, lastDay: "2026-11-14" },
    { name: "GPTBot", kind: "training", hits: 1, lastDay: "2026-11-14" },
    { name: "ClaudeBot", kind: "training", hits: 0, lastDay: "2026-11-13" },
  ],
  referrals: [],
  search: { syncedAt: "2026-11-14T00:00:00.000Z", firstDay: "2026-10-18", lastDay: "2026-11-14", clicks: 0, impressions: 3, position: 12.3, queries: [], pages: [] },
  answers: { engines: [engine("claude"), engine("openai")], history: [...history("2026-11-13"), ...history("2026-11-14")] },
};

describe("geoCards — 측정 수치 4개 (실제 측정값만)", () => {
  it("Figma 구성 — 인용 · 구글 노출 · 봇 방문 · 서비스 유입 순서", () => {
    expect(geoCards(FULL)).toEqual([
      { label: "AI 답변 인용", value: "0 / 24 질문", note: "6회 측정 누적" },
      { label: "구글 검색 노출", value: "3회", note: "클릭 0회 · Search Console" },
      { label: "AI · 검색 봇 방문", value: "33회", note: "bingbot 19 · Googlebot 13 · GPTBot 1" },
      { label: "AI 서비스 유입", value: "0회", note: "방문 통계 기준" },
    ]);
  });

  it("인용이 있으면 서로 다른 질문 수 — 두 서비스가 같은 질문을 인용해도 한 번", () => {
    const r: GeoReport = { ...FULL, answers: { engines: [engine("claude", ["브랜드 0", "일반 3"]), engine("openai", ["브랜드 0"])], history: history("2026-11-14") } };
    expect(geoCards(r)[0]).toEqual({ label: "AI 답변 인용", value: "2 / 24 질문", note: "3회 측정 누적" });
  });

  it("측정한 적이 없으면 숫자를 만들지 않고 '측정 전' · '수집 전'", () => {
    const c = geoCards(BASE);
    expect(c).toHaveLength(4);
    expect(c[0]).toEqual({ label: "AI 답변 인용", value: "측정 전", note: null });
    expect(c[1]).toEqual({ label: "구글 검색 노출", value: "수집 전", note: "Search Console" });
    expect(c[2]).toEqual({ label: "AI · 검색 봇 방문", value: "0회", note: null });
    expect(c[3]).toEqual({ label: "AI 서비스 유입", value: "0회", note: "방문 통계 기준" });
  });

  it("봇 방문 note 는 상위 3개만 · 같으면 이름순", () => {
    const bots = [
      { name: "d", kind: "engine" as const, hits: 5, lastDay: "2026-11-14" },
      { name: "b", kind: "engine" as const, hits: 5, lastDay: "2026-11-14" },
      { name: "a", kind: "training" as const, hits: 5, lastDay: "2026-11-14" },
      { name: "c", kind: "user" as const, hits: 1, lastDay: "2026-11-14" },
    ];
    expect(geoCards({ ...BASE, bots })[2]).toEqual({ label: "AI · 검색 봇 방문", value: "16회", note: "a 5 · b 5 · d 5" });
  });

  it("AI 서비스 유입은 referrals 합계", () => {
    const r = { ...BASE, referrals: [{ name: "ChatGPT", hits: 4, lastDay: "2026-11-14" }, { name: "Claude", hits: 1, lastDay: "2026-11-14" }] };
    expect(geoCards(r)[3].value).toBe("5회");
  });
});

describe("geoReading — 이 수치를 읽는 법", () => {
  it("측정이 있으면 질문 수(브랜드 · 일반)를 실제 기록에서 · 이어서 두 줄", () => {
    expect(geoReading(FULL)).toEqual([
      "질문 24개(브랜드 8 · 일반 16)를 같은 방식으로 직접 검색해 노출 · 인용을 기록합니다",
      "측정하지 못한 날은 비워 두고, 숫자를 추정하지 않습니다",
      "원인 조사 기록은 GitHub 이슈에 공개합니다",
    ]);
  });

  it("측정이 없으면 질문 수를 지어내지 않고 두 줄만", () => {
    expect(geoReading(BASE)).toEqual(["측정하지 못한 날은 비워 두고, 숫자를 추정하지 않습니다", "원인 조사 기록은 GitHub 이슈에 공개합니다"]);
  });
});
