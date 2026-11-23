// 작업 0326 — 어드민 입구 시험 도움 (테스트 전용 열쇠 · 운영 코드에 우회 경로 없음 · 구현 전에는 FAIL 이 정상)
//   builder 가 만들 것 — apps/admin/worker/gate/token.ts · session.ts (이름 · 모양은 token.test.ts · session.test.ts 머리 주석)
//   이 파일은 시험만 가져다 씀: 토큰 목록(ADMIN_TOKENS 글) · 서명 열쇠 · 로그인한 쿠키를 만들어 줌
import { COOKIE_NAME, OWNER_NAME, REVIEWER_MAX_AGE, signSession } from "./session";
import { type TokenList, sha256Hex } from "./token";

export const SECRET = "test-session-secret-0326-0123456789abcdef";
export const API_KEY = "test-admin-api-key-0326-0123456789";

/** 시험용 토큰 원문 — 실제 값이 아님 */
export const REVIEWER_TOKEN = "reviewer-token-0326-AAAAAAAAAAAAAAAAAAAAAAAA";
export const REVIEWER_NAME = "apply-acme-1124";
export const OWNER_TOKEN = "owner-token-0326-BBBBBBBBBBBBBBBBBBBBBBBBBBBB";
export const EXPIRED_TOKEN = "expired-token-0326-CCCCCCCCCCCCCCCCCCCCCCCC";
export const EXPIRED_NAME = "apply-old-0101";
export const REMOVED_TOKEN = "removed-token-0326-DDDDDDDDDDDDDDDDDDDDDDDD";

/** ADMIN_TOKENS 의 목록 — 원문이 아니라 SHA-256 해시 */
export async function tokenList(extra: TokenList = {}): Promise<TokenList> {
  return {
    [REVIEWER_NAME]: { hash: await sha256Hex(REVIEWER_TOKEN), exp: "2099-12-31" },
    [OWNER_NAME]: { hash: await sha256Hex(OWNER_TOKEN) },
    [EXPIRED_NAME]: { hash: await sha256Hex(EXPIRED_TOKEN), exp: "2020-01-01" },
    ...extra,
  };
}

export async function gateEnv(list?: TokenList) {
  return { ADMIN_TOKENS: JSON.stringify(list ?? (await tokenList())), ADMIN_SESSION_SECRET: SECRET, ADMIN_API_KEY: API_KEY };
}

/** 로그인한 요청의 Cookie 머리글 값 — name 은 목록에 있는 이름 */
export async function cookieFor(name: string, opts: { list?: TokenList; expSec?: number; secret?: string } = {}): Promise<string> {
  const list = opts.list ?? (await tokenList());
  const entry = list[name];
  if (!entry) throw new Error(`시험 목록에 없는 이름: ${name}`);
  const exp = opts.expSec ?? Math.floor(Date.now() / 1000) + REVIEWER_MAX_AGE;
  return `${COOKIE_NAME}=${await signSession(name, entry.hash, exp, opts.secret ?? SECRET)}`;
}
