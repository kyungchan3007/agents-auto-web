// 구조화 로그 — JSON 한 줄 (Workers Logs 에서 검색 · 근거: Cloudflare Workers Best Practices)
//   비밀값은 남기지 않음 (AGENTS 규칙 6) — 수출입은행 주소의 authkey · 공공데이터포털(과세환율) 주소의 serviceKey · KOSIS 주소의 apiKey 가 오류 글에 섞일 수 있어 가림
const SECRET = /((?:authkey|servicekey|apikey)=)[^&\s"']+/gi;

// 한국은행 ECOS 는 인증키가 주소 경로에 들어감 (/StatisticSearch/<키>/...)
const ECOS_PATH = /(\/StatisticSearch\/)[^/\s"']+/gi;

export const redact = (text: string) => text.replace(SECRET, "$1***").replace(ECOS_PATH, "$1***");

const errorText = (e: unknown) => redact(e instanceof Error ? `${e.name}: ${e.message}` : String(e));

export function logEvent(level: "info" | "warn" | "error", event: string, fields: Record<string, unknown> = {}) {
  const line = redact(JSON.stringify({ level, event, ...fields }));
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logError = (event: string, e: unknown, fields: Record<string, unknown> = {}) => logEvent("error", event, { ...fields, error: errorText(e) });
