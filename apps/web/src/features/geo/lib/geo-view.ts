// GEO 화면 자료 — 응답을 화면이 쓰는 모양으로 (순수 함수) · 받지 못한 값은 만들지 않음
import { numberText } from "@hav/shared/format";
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

type Answers = NonNullable<GeoReport["answers"]>;

/** 질문 수가 가장 큰 서비스의 최근 측정 — 같으면 먼저 온 서비스 */
function widest(answers: Answers) {
  return answers.engines.reduce<Answers["engines"][number] | null>((m, e) => (m === null || e.total > m.total ? e : m), null);
}

/** 측정 수치 카드 4개 (작업 0170 · Figma 07) — 측정한 값만 · 받지 못한 값은 "측정 전" · "수집 전" 으로 두고 숫자를 만들지 않음 */
export function geoCards(r: GeoReport): { label: string; value: string; note: string | null }[] {
  const top = widest(r.answers ?? { engines: [], history: [] });
  const cited = new Set((r.answers?.engines ?? []).flatMap((e) => e.citedQuestions));
  const bots = r.bots
    .filter((b) => b.hits > 0)
    .sort((a, b) => b.hits - a.hits || a.name.localeCompare(b.name))
    .slice(0, 3);
  return [
    r.answers && top
      ? { label: "AI 답변 인용", value: `${numberText(cited.size)} / ${numberText(top.total)} 질문`, note: `${numberText(r.answers.history.length)}회 측정 누적` }
      : { label: "AI 답변 인용", value: "측정 전", note: null },
    r.search
      ? { label: "구글 검색 노출", value: `${numberText(r.search.impressions)}회`, note: `클릭 ${numberText(r.search.clicks)}회 · Search Console` }
      : { label: "구글 검색 노출", value: "수집 전", note: "Search Console" },
    { label: "AI · 검색 봇 방문", value: `${numberText(sum(r.bots))}회`, note: bots.length === 0 ? null : bots.map((b) => `${b.name} ${numberText(b.hits)}`).join(" · ") },
    { label: "AI 서비스 유입", value: `${numberText(sum(r.referrals))}회`, note: "방문 통계 기준" },
  ];
}

/** "이 수치를 읽는 법" 줄 — 질문 수는 실제 측정 기록에서만 (없으면 그 줄을 빼고 지어내지 않음) */
export function geoReading(r: GeoReport): string[] {
  const top = r.answers ? widest(r.answers) : null;
  const brand = top?.results.filter((q) => q.group === "brand").length ?? 0;
  const general = top?.results.filter((q) => q.group === "general").length ?? 0;
  return [
    ...(top && brand + general > 0 ? [`질문 ${brand + general}개(브랜드 ${brand} · 일반 ${general})를 같은 방식으로 직접 검색해 노출 · 인용을 기록합니다`] : []),
    "측정하지 못한 날은 비워 두고, 숫자를 추정하지 않습니다",
    "원인 조사 기록은 GitHub 이슈에 공개합니다",
  ];
}
