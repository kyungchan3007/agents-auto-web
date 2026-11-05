// GEO 방문 분류 — 요청의 봇 이름 · 유입 주소를 종류 · 이름으로 (순수 함수 · zod 없음: Pages 함수에 들어감)
//   저장하는 것은 이 결과뿐 — IP · 전체 User-Agent · 전체 유입 주소 · 쿼리는 저장하지 않음
//   봇 목록 근거: OpenAI · Anthropic · Perplexity 공식 문서 (2026-11-05 확인) · Googlebot · bingbot 은 일반 검색 엔진

export type VisitKind = "training" | "search" | "user" | "engine" | "referral" | "test";
export type Visit = { kind: VisitKind; name: string; path: string };

const BOTS: { token: string; kind: VisitKind; name: string }[] = [
  { token: "tripfx-verify", kind: "test", name: "Tripfx-Verify" }, // 운영 확인용 — 공개 수치에서 뺌
  { token: "oai-searchbot", kind: "search", name: "OAI-SearchBot" },
  { token: "chatgpt-user", kind: "user", name: "ChatGPT-User" },
  { token: "gptbot", kind: "training", name: "GPTBot" },
  { token: "claude-searchbot", kind: "search", name: "Claude-SearchBot" },
  { token: "claude-user", kind: "user", name: "Claude-User" },
  { token: "claudebot", kind: "training", name: "ClaudeBot" },
  { token: "perplexity-user", kind: "user", name: "Perplexity-User" },
  { token: "perplexitybot", kind: "search", name: "PerplexityBot" },
  { token: "googlebot", kind: "engine", name: "Googlebot" },
  { token: "bingbot", kind: "engine", name: "bingbot" },
];

const REFERRERS: { host: RegExp; name: string }[] = [
  { host: /(^|\.)chatgpt\.com$|(^|\.)chat\.openai\.com$/, name: "ChatGPT" },
  { host: /(^|\.)claude\.ai$/, name: "Claude" },
  { host: /(^|\.)perplexity\.ai$/, name: "Perplexity" },
  { host: /(^|\.)copilot\.microsoft\.com$/, name: "Copilot" },
  { host: /(^|\.)gemini\.google\.com$/, name: "Gemini" },
];

/** 고정 목록으로 줄임 — 위조 요청이 행을 끝없이 늘리지 못하게 · 그 밖은 저장하지 않음 */
export function visitPath(pathname: string): string | null {
  const p = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
  if (/^\/currencies\/[A-Za-z]{3}$/.test(p)) return "/currencies/*";
  return ["/", "/currencies", "/prices", "/calc", "/log", "/about", "/geo", "/robots.txt", "/sitemap.xml"].includes(p) ? p : null;
}

function refererName(referer: string | null): string | null {
  if (!referer) return null;
  try {
    const host = new URL(referer).hostname.toLowerCase();
    return REFERRERS.find((r) => r.host.test(host))?.name ?? null;
  } catch {
    return null;
  }
}

/** 저장할 방문이면 그 내용 · 아니면 null (일반 방문은 저장하지 않음) */
export function classifyVisit(input: { pathname: string; userAgent: string | null; referer: string | null }): Visit | null {
  const path = visitPath(input.pathname);
  if (!path) return null;
  const ua = (input.userAgent ?? "").toLowerCase();
  const bot = BOTS.find((b) => ua.includes(b.token));
  if (bot) return { kind: bot.kind, name: bot.name, path };
  const name = refererName(input.referer);
  return name ? { kind: "referral", name, path } : null;
}
