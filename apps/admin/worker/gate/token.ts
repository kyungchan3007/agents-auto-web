// 어드민 입구 — 토큰 해시 · 길이 일정 비교 · 목록 읽기 · 기한 (작업 0326 · 순수 함수 · Web Crypto 만)
//   목록(ADMIN_TOKENS)은 토큰 원문이 아니라 SHA-256 해시만 가진다

export type TokenEntry = { hash: string; exp?: string };
/** 키 = 토큰 이름(회사 · 날짜 · 예: apply-acme-1124) */
export type TokenList = Record<string, TokenEntry>;

const HEX64 = /^[0-9a-f]{64}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const KST_OFFSET_MS = 9 * 3600 * 1000;
const DAY_MS = 24 * 3600 * 1000;

export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** 길이가 달라도 긴 쪽만큼 끝까지 훑고 false — 일찍 끝내지 않음 */
export function timingSafeEqual(a: string, b: string): boolean {
  const x = new TextEncoder().encode(a);
  const y = new TextEncoder().encode(b);
  const len = Math.max(x.length, y.length);
  let diff = x.length ^ y.length;
  for (let i = 0; i < len; i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

/** 없음 · 깨진 글 → {} (아무도 못 들어옴). 모양이 틀린 항목은 버림 · token(원문) 필드는 읽지 않음 */
export function parseTokens(raw: string | undefined): TokenList {
  if (!raw || !raw.trim()) return {};
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return {};
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) return {};
  const list: TokenList = {};
  for (const [name, value] of Object.entries(data)) {
    if (!value || typeof value !== "object" || Array.isArray(value)) continue;
    const { hash, exp } = value as { hash?: unknown; exp?: unknown };
    if (typeof hash !== "string" || !HEX64.test(hash)) continue;
    if (exp === undefined) {
      list[name] = { hash };
    } else if (typeof exp === "string" && DATE.test(exp)) {
      list[name] = { hash, exp };
    }
  }
  return list;
}

/** exp 날(한국 시간) 끝까지 유효 — 다음 날 한국 0시부터 무효. exp 없음 = 기한 없음 */
export function isExpired(entry: TokenEntry, now: Date): boolean {
  if (!entry.exp) return false;
  const endMs = Date.parse(`${entry.exp}T00:00:00Z`) - KST_OFFSET_MS + DAY_MS;
  if (Number.isNaN(endMs)) return true;
  return now.getTime() >= endMs;
}

/** 들어온 토큰의 해시가 목록과 같고 기한 안이면 그 이름 · 그 밖은 모두 null(구분하지 않음) */
export async function matchToken(list: TokenList, presented: string, now: Date): Promise<{ name: string } | null> {
  const hash = await sha256Hex(presented);
  let found: string | null = null;
  for (const [name, entry] of Object.entries(list)) {
    // 모두 훑음 — 맞는 항목에서 일찍 끝내지 않음
    if (timingSafeEqual(hash, entry.hash) && !isExpired(entry, now) && found === null) found = name;
  }
  return found === null ? null : { name: found };
}
