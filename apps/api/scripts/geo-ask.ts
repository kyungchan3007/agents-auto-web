// GitHub Actions 가 부름: AI 검색에 고정 질문 → 출처에 tripfx 가 나왔는지 → SQL (표준 출력) · 진행은 표준 오류 (작업 0139)
//   --from <폴더>: API 를 부르지 않고 세션 측정 결과 파일(apps/api/data/geo-answers/*.json)만 SQL 로 (작업 0149)
//   키가 있는 서비스만 측정 · 없으면 그 서비스는 기록하지 않음(측정 안 함) · 키 · 답변 본문은 출력하지 않음
//   ANTHROPIC_API_KEY=... OPENAI_API_KEY=... PERPLEXITY_API_KEY=... node --experimental-strip-types apps/api/scripts/geo-ask.ts > .tmp/geo-ask.sql
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { type AnswerRow, type Engine, type Hit, answersSql, claudeHit, failReason, openaiHit, perplexityHit, sessionRows, shouldStop } from "../src/features/geo/ask.ts";
import { QUESTIONS, questionOf } from "../src/features/geo/questions.ts";

const KEEP_DAYS = 90;
const TIMEOUT_MS = 120_000;
const kstDay = (ms: number) => new Date(ms + 9 * 3600_000).toISOString().slice(0, 10);
const day = kstDay(Date.now());

/** 사용자가 묻는 것처럼 — 측정 대상 사이트 이름을 알려 주지 않음 */
const prompt = (q: string) => `${q}\n\n한국에 사는 사용자의 질문입니다. 웹에서 찾아보고 출처를 밝혀 한국어로 짧게 답해 주세요.`;

async function askClaude(q: string): Promise<Hit> {
  const client = new Anthropic({ timeout: TIMEOUT_MS });
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: prompt(q) }];
  const content: Anthropic.Beta.BetaContentBlock[] = [];
  for (let turn = 0; turn < 3; turn++) {
    const res = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low" },
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 3, user_location: { type: "approximate", country: "KR", timezone: "Asia/Seoul" } }],
      messages,
    });
    content.push(...res.content);
    if (res.stop_reason !== "pause_turn") break;
    messages.push({ role: "assistant", content: res.content });
  }
  return claudeHit(content);
}

// 생성자 매개변수 속성(readonly status)은 node --experimental-strip-types 가 못 읽어 시작하자마자 멈춤 — 필드로 씀 (작업 0148)
class HttpError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown) {
    super(`HTTP ${status}`);
    this.status = status;
    this.body = body;
  }
}

async function postJson(url: string, key: string, body: unknown): Promise<unknown> {
  const res = await fetch(url, {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new HttpError(res.status, await res.json().catch(() => null));
  return res.json();
}

const askOpenai = async (q: string, key: string) =>
  openaiHit(
    await postJson("https://api.openai.com/v1/responses", key, {
      model: process.env.OPENAI_MODEL || "gpt-5",
      tools: [{ type: "web_search", user_location: { type: "approximate", country: "KR", timezone: "Asia/Seoul" } }],
      include: ["web_search_call.action.sources"],
      input: prompt(q),
    }),
  );

const askPerplexity = async (q: string, key: string) =>
  perplexityHit(await postJson("https://api.perplexity.ai/chat/completions", key, { model: process.env.PERPLEXITY_MODEL || "sonar", messages: [{ role: "user", content: prompt(q) }] }));

const engines: { engine: Engine; key: string | undefined; ask: (q: string, key: string) => Promise<Hit> }[] = [
  { engine: "claude", key: process.env.ANTHROPIC_API_KEY, ask: (q) => askClaude(q) },
  { engine: "openai", key: process.env.OPENAI_API_KEY, ask: askOpenai },
  { engine: "perplexity", key: process.env.PERPLEXITY_API_KEY, ask: askPerplexity },
];

const rows: AnswerRow[] = [];
const fromAt = process.argv.indexOf("--from");
if (fromAt > 0) {
  const dir = process.argv[fromAt + 1];
  const keepFrom = kstDay(Date.now() - KEEP_DAYS * 86400_000);
  for (const f of readdirSync(dir).filter((n) => /^\d{4}-\d{2}-\d{2}\.json$/.test(n) && n.slice(0, 10) >= keepFrom).sort()) {
    const got = sessionRows(JSON.parse(readFileSync(join(dir, f), "utf8")), (id) => questionOf(id) !== null);
    process.stderr.write(`${f}: ${got.length}개 질문 · 인용 ${got.filter((r) => r.cited).length} · 검색 결과에 나옴 ${got.filter((r) => r.found).length}\n`);
    rows.push(...got);
  }
  process.stdout.write(answersSql(rows, keepFrom));
  process.exit(0);
}
for (const e of engines) {
  if (!e.key) {
    process.stderr.write(`${e.engine}: 키가 없어 측정하지 않음\n`);
    continue;
  }
  let cited = 0;
  let errors = 0;
  const failed: (number | undefined)[] = []; // 처음 3개 질문의 결과 상태 (성공은 200)
  for (const q of QUESTIONS) {
    if (shouldStop(failed)) {
      errors++;
      rows.push({ day, engine: e.engine, question: q.id, status: "error", cited: false, found: false });
      continue;
    }
    try {
      const hit = await e.ask(q.text, e.key);
      rows.push({ day, engine: e.engine, question: q.id, status: "ok", ...hit });
      if (hit.cited) cited++;
      if (failed.length < 3) failed.push(200);
    } catch (err) {
      errors++;
      const status = err instanceof Anthropic.APIError || err instanceof HttpError ? err.status : undefined;
      const body = err instanceof Anthropic.APIError ? err.error : err instanceof HttpError ? err.body : null;
      const why = failReason(status, body, err instanceof Error ? err.message : "알 수 없음");
      if (failed.length < 3) failed.push(status);
      process.stderr.write(`${e.engine} ${q.id}: 실패 (${why})\n`);
      rows.push({ day, engine: e.engine, question: q.id, status: "error", cited: false, found: false });
    }
  }
  if (shouldStop(failed)) process.stderr.write(`${e.engine}: 처음 3개 질문이 요청 오류로 실패해 나머지는 묻지 않음\n`);
  process.stderr.write(`${e.engine}: 질문 ${QUESTIONS.length}개 · 인용 ${cited} · 실패 ${errors}\n`);
}

process.stdout.write(answersSql(rows, kstDay(Date.now() - KEEP_DAYS * 86400_000)));
