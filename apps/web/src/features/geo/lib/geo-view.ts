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

/** 자세한 기록 (작업 0180) — 응답을 구간별 표 줄로 · 값이 없는 구간은 empty 로 알려 빈 상태 글자를 보이게 함 (지어내지 않음) */
export function geoDetail(r: GeoReport) {
  const ai = r.bots.filter((b) => b.kind !== "engine");
  const engines = r.bots.filter((b) => b.kind === "engine");
  const s = r.search;
  return {
    answers: answerLines(r),
    history: answerHistory(r),
    search: s
      ? {
          range: s.firstDay && s.lastDay ? `${s.firstDay} ~ ${s.lastDay}` : "기록 없음",
          impressions: `${numberText(s.impressions)}회`,
          clicks: `${numberText(s.clicks)}회`,
          position: s.position == null ? "자료 없음" : `${s.position}위`,
          queries: s.queries.map((q) => [q.key, q.impressions, q.clicks, q.position]),
          pages: s.pages.map((q) => [q.key, q.impressions, q.clicks, q.position]),
        }
      : null,
    aiBots: ai.map((b) => [b.name, KIND_TEXT[b.kind], b.hits, b.lastDay]),
    aiPages: r.pages.map((p) => [p.path, p.hits]),
    referrals: r.referrals.map((x) => [x.name, x.hits, x.lastDay]),
    engineBots: engines.map((b) => [b.name, b.hits, b.lastDay]),
    period: `지난 30일 (${r.since}부터) · ${r.firstDay ? `첫 기록 ${r.firstDay}` : "아직 기록이 없습니다"}`,
  };
}

/** 측정의 한계 — 예전 문구 그대로 (작업 0129 · 0170 에서 화면에서 빠졌다가 0180 에서 되살림) */
export const GEO_LIMITS = [
  "봇 방문은 요청에 적힌 봇 이름을 기준으로 센 추정치입니다. 이름은 위조될 수 있습니다.",
  "유입은 브라우저가 유입 주소를 보낸 방문만 잡힙니다. 앱에서 넘어온 방문은 빠질 수 있습니다.",
  "방문은 하루 · 봇 이름 · 페이지별 횟수로만 저장합니다. IP 주소 · 전체 User-Agent · 쿼리는 저장하지 않으며, 일반 방문은 이 집계에 넣지 않습니다.",
  "봇이 읽었다는 것이 AI 답변에 인용되었다는 뜻은 아닙니다.",
  "검색어는 노출 2회 이상인 것만 표시합니다.",
  "AI 답변은 에이전트 세션의 웹 검색 기준입니다 (2026-11-07 ~ 09는 API 측정). 같은 질문도 날마다 결과가 달라질 수 있어 경향만 봅니다. 답변 본문은 저장하지 않습니다.",
] as const;

export const GEO_UNLINKED = "Bing Webmaster Tools에 등록했습니다 (2026-11-05). Bing 검색 · Copilot 인용 수치와 구글 AI 답변 전용 수치는 아직 이 페이지에 연결하지 않았습니다.";

/** 측정 방법 링크 글자 (작업 0180) — 질문 수는 실제 측정 기록에서만, 없으면 수를 쓰지 않음 */
export function methodLinkText(r: GeoReport | null): string {
  const top = r?.answers ? widest(r.answers) : null;
  const n = top?.results.length ?? 0;
  return n > 0 ? `질문 ${numberText(n)}개와 측정 방법 보기 (GitHub)` : "질문 목록과 측정 방법 보기 (GitHub)";
}
