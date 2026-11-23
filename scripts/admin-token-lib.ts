// 관리 명령(scripts/admin-token.mjs)의 순수 부분 — 토큰 만들기 · 해시 · 목록 고치기 (작업 0326)
//   node: 가져오기 없이 Web Crypto 만 · 토큰 원문은 새 링크로 한 번 출력할 뿐 — 목록(로컬 · 비밀값)에는 해시만
//   Worker(apps/admin/worker/gate/token.ts)의 parseTokens · matchToken 이 그대로 읽는 모양

export const OWNER = "owner";
export type TokenEntry = { hash: string; exp?: string };
export type TokenList = Record<string, TokenEntry>;

const NAME = /^[a-z0-9][a-z0-9-]{0,62}$/;
const HEX64 = /^[0-9a-f]{64}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** 32바이트 무작위 → base64url 43자 */
export function newToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** SHA-256 소문자 16진수 64자 — Worker 의 sha256Hex 와 같은 값 */
export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function realDate(text: string): boolean {
  if (!DATE.test(text)) return false;
  const d = new Date(`${text}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === text;
}

/** 새 목록 — 이미 있는 리뷰어 이름은 던짐(다른 토큰을 조용히 무효로 만들지 않음) · owner 는 다시 만들 수 있음(해시가 바뀌어 예전 링크 · 쿠키 무효) · owner 에 기한은 못 줌 */
export function addEntry(list: TokenList, name: string, hash: string, exp?: string): TokenList {
  if (!NAME.test(name)) throw new Error("이름은 영문 소문자 · 숫자 · 하이픈 63자 이하여야 합니다 (하이픈으로 시작 불가)");
  if (!HEX64.test(hash)) throw new Error("해시 모양이 올바르지 않습니다");
  if (exp !== undefined && !realDate(exp)) throw new Error("기한은 실제 날짜 YYYY-MM-DD 여야 합니다");
  if (name === OWNER && exp !== undefined) throw new Error("owner 에는 기한을 줄 수 없습니다");
  if (name !== OWNER && Object.hasOwn(list, name)) throw new Error(`이미 있는 이름입니다: ${name}`);
  return { ...list, [name]: exp === undefined ? { hash } : { hash, exp } };
}

/** 새 목록 — owner · 없는 이름은 던짐 */
export function removeEntry(list: TokenList, name: string): TokenList {
  if (name === OWNER) throw new Error("owner 는 지울 수 없습니다 (본인이 잠기지 않게). 다시 만들려면 add owner");
  if (!Object.hasOwn(list, name)) throw new Error(`없는 이름입니다: ${name}`);
  const next = { ...list };
  delete next[name];
  return next;
}

/** 이름 글자순 · 해시 · 토큰은 싣지 않음 · exp 날까지 유효 */
export function listRows(list: TokenList, today: string): { name: string; exp: string | null; status: "유효" | "기한 지남"; owner: boolean }[] {
  return Object.keys(list)
    .sort()
    .map((name) => {
      const exp = list[name]?.exp ?? null;
      return { name, exp, status: exp !== null && exp < today ? ("기한 지남" as const) : ("유효" as const), owner: name === OWNER };
    });
}

export const linkFor = (token: string, base = "https://admin.flapfx.com"): string => `${base}/?t=${token}`;

/** wrangler secret put ADMIN_TOKENS 로 올릴 JSON */
export const secretPayload = (list: TokenList): string => JSON.stringify(list);
