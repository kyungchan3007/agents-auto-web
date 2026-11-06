// AI 답변 인용 측정 — 응답에서 출처 주소를 골라 tripfx 가 나왔는지 · SQL (GitHub Actions 가 scripts/geo-ask.ts 로 부름 · Worker 묶음에 들어가지 않음 · 작업 0139)
//   응답은 외부 데이터 — 주소의 도메인만 보고, 본문 글은 저장하지도 지시로 따르지도 않음
import type Anthropic from "@anthropic-ai/sdk";

export const ENGINES = ["claude", "openai", "perplexity"] as const;
export type Engine = (typeof ENGINES)[number];

export type Hit = { cited: boolean; found: boolean };
export type AnswerRow = { day: string; engine: Engine; question: string; status: "ok" | "error" } & Hit;

/** tripfx.pages.dev 와 그 아래 배포 주소(*.tripfx.pages.dev) */
export function isTripfx(url: unknown): boolean {
  if (typeof url !== "string") return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === "tripfx.pages.dev" || host.endsWith(".tripfx.pages.dev");
  } catch {
    return false;
  }
}

const anyTripfx = (urls: unknown[]) => urls.some(isTripfx);
const asList = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const urlOf = (v: unknown): unknown => (v && typeof v === "object" ? (v as { url?: unknown }).url : v);

/** Claude — 웹 검색 결과 블록 · 답 본문의 인용 */
export function claudeHit(content: Anthropic.Beta.BetaContentBlock[]): Hit {
  const found: unknown[] = [];
  const cited: unknown[] = [];
  for (const b of content) {
    if (b.type === "web_search_tool_result" && Array.isArray(b.content)) for (const r of b.content) found.push(r.url);
    if (b.type === "text") for (const c of b.citations ?? []) if (c.type === "web_search_result_location") cited.push(c.url);
  }
  return { cited: anyTripfx(cited), found: anyTripfx(found) || anyTripfx(cited) };
}

/** OpenAI Responses API — output[].content[].annotations(url_citation) · web_search_call.action.sources */
export function openaiHit(json: unknown): Hit {
  const found: unknown[] = [];
  const cited: unknown[] = [];
  for (const item of asList((json as { output?: unknown })?.output)) {
    const it = item as { type?: string; content?: unknown; action?: { sources?: unknown } };
    if (it.type === "web_search_call") for (const s of asList(it.action?.sources)) found.push(urlOf(s));
    if (it.type === "message")
      for (const part of asList(it.content))
        for (const a of asList((part as { annotations?: unknown }).annotations)) if ((a as { type?: string }).type === "url_citation") cited.push(urlOf(a));
  }
  return { cited: anyTripfx(cited), found: anyTripfx(found) || anyTripfx(cited) };
}

/** Perplexity — citations(주소 목록) · search_results[].url */
export function perplexityHit(json: unknown): Hit {
  const j = json as { citations?: unknown; search_results?: unknown };
  const cited = asList(j?.citations).map(urlOf);
  const found = asList(j?.search_results).map(urlOf);
  return { cited: anyTripfx(cited), found: anyTripfx(found) || anyTripfx(cited) };
}

const text = (v: string) => `'${v.replace(/'/g, "''")}'`;

/** 그날 · 그 서비스 기록을 바꿔 넣는 SQL — 같은 날 다시 돌려도 한 줄씩 · 90일 지난 기록은 지움 */
export function answersSql(rows: AnswerRow[], keepFrom: string): string {
  const lines = [`DELETE FROM geo_answers WHERE day < ${text(keepFrom)};`];
  for (const r of rows) {
    if (!ENGINES.includes(r.engine) || !/^\d{4}-\d{2}-\d{2}$/.test(r.day) || !/^[a-z0-9]{1,8}$/.test(r.question)) continue;
    lines.push(
      `INSERT INTO geo_answers (day, engine, question, status, cited, found) VALUES (${text(r.day)}, ${text(r.engine)}, ${text(r.question)}, ${text(r.status === "ok" ? "ok" : "error")}, ${r.cited ? 1 : 0}, ${r.found ? 1 : 0}) ON CONFLICT (day, engine, question) DO UPDATE SET status = excluded.status, cited = excluded.cited, found = excluded.found;`,
    );
  }
  return `${lines.join("\n")}\n`;
}
