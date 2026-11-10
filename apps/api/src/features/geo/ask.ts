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

/** 실패 이유 한 줄 — 상태 코드 · 오류 종류 · 메시지 앞부분 (외부 응답이라 출력만 · 키처럼 보이는 값은 가림 · 작업 0147)
 *  2026-11-08 ~ 10 "HTTP 400" 만 남아 원인을 알 수 없었음 */
export function failReason(status: number | undefined, body: unknown, fallback: string): string {
  const e = (body as { error?: { type?: unknown; message?: unknown } } | null)?.error;
  const type = typeof e?.type === "string" ? e.type.slice(0, 40) : null;
  const msg = typeof e?.message === "string" ? e.message.replace(/sk-[A-Za-z0-9_-]{8,}/g, "sk-…").replace(/\s+/g, " ").slice(0, 160) : null;
  const head = status ? `HTTP ${status}` : fallback.slice(0, 80);
  return [head, type, msg].filter(Boolean).join(" · ");
}

/** 처음 몇 질문이 요청 자체의 문제(400 · 401 · 403 · 404)로 연달아 실패하면 나머지는 묻지 않음 — 매일 같은 실패를 반복하지 않게 */
export function shouldStop(statuses: (number | undefined)[], first = 3): boolean {
  return statuses.length >= first && statuses.slice(0, first).every((s) => s === 400 || s === 401 || s === 403 || s === 404);
}

/** 세션 측정 결과 파일 한 개 → 저장할 줄 (작업 0149)
 *  API 크레딧 대신 사용자가 말하면 Claude Code 세션이 질문을 직접 웹 검색해 apps/api/data/geo-answers/날짜.json 으로 PR → 머지되면 저장
 *  모르는 질문 번호 · 이상한 값은 버림 (지어낸 값이 들어가지 않게 모양만 받음) */
export function sessionRows(json: unknown, known: (id: string) => boolean): AnswerRow[] {
  const j = json as { day?: unknown; engine?: unknown; results?: unknown };
  if (typeof j?.day !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(j.day)) return [];
  if (!ENGINES.includes(j.engine as Engine)) return [];
  const out: AnswerRow[] = [];
  for (const r of Array.isArray(j.results) ? j.results : []) {
    const x = r as { question?: unknown; found?: unknown; cited?: unknown };
    if (typeof x.question !== "string" || !known(x.question) || typeof x.found !== "boolean" || typeof x.cited !== "boolean") continue;
    out.push({ day: j.day, engine: j.engine as Engine, question: x.question, status: "ok", cited: x.cited, found: x.found || x.cited });
  }
  return out;
}
