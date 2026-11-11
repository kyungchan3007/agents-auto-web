// GEO 화면 자료 — 응답을 화면이 쓰는 모양으로 (순수 함수) · 받지 못한 값은 만들지 않음
import type { GeoReport } from "@hav/shared/geo";

export const KIND_TEXT: Record<GeoReport["bots"][number]["kind"], string> = {
  training: "학습용 수집",
  search: "AI 검색 색인",
  user: "사용자 요청",
  engine: "일반 검색 엔진",
};

const sum = (list: { hits: number }[]) => list.reduce((n, x) => n + x.hits, 0);

export function geoView(r: GeoReport) {
  const engines = r.bots.filter((b) => b.kind === "engine");
  const ai = r.bots.filter((b) => b.kind !== "engine");
  return { ai, engines, aiHits: sum(ai), engineHits: sum(engines), referralHits: sum(r.referrals) };
}

/** AI 답변 인용 측정 서비스 이름 (작업 0139) */
export const ENGINE_TEXT: Record<NonNullable<GeoReport["answers"]>["engines"][number]["engine"], string> = {
  claude: "Claude",
  openai: "ChatGPT",
  perplexity: "Perplexity",
};

const ENGINES = ["claude", "openai", "perplexity"] as const;
const yes = (b: boolean) => (b ? "예" : "아니오");

/** 서비스별 최근 측정 한 줄 — 세 서비스 모두 · 기록이 없는 서비스는 측정 안 함 · 응답을 받지 못한 질문은 인용 수에 넣지 않고 따로 셈 (작업 0139 · 0141) */
export function answerLines(r: GeoReport) {
  return ENGINES.map((engine) => {
    const e = r.answers?.engines.find((x) => x.engine === engine);
    if (!e) return { engine, name: ENGINE_TEXT[engine], measured: false as const };
    return {
      engine,
      name: ENGINE_TEXT[engine],
      measured: true as const,
      day: e.day,
      saved: e.total,
      cited: `${e.cited} / ${e.ok}`,
      found: `${e.found} / ${e.ok}`,
      failed: e.total - e.ok,
      citedQuestions: e.citedQuestions,
      results: e.results.map((q) => [q.question, q.group === "brand" ? "사이트 이름" : "일반", q.status === "ok" ? yes(q.cited) : "-", q.status === "ok" ? yes(q.found) : "-", q.status === "ok" ? "성공" : "실패"]),
    };
  });
}

/** 날짜별 저장 기록 — 최근 날부터 */
export function answerHistory(r: GeoReport) {
  return [...(r.answers?.history ?? [])].reverse().map((h) => [h.day, ENGINE_TEXT[h.engine], h.total, h.ok, h.cited]);
}
