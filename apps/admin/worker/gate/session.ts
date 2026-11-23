// 어드민 입구 — 쿠키 서명 · 검증 · 쿠키 머리글 (작업 0326 · 순수 함수 · Web Crypto 만)
//   값 = `이름.만료(초).서명` · 서명 = HMAC-SHA256(열쇠, 이름 · 만료 · 토큰 해시) — 토큰 원문 · 해시는 값에 없음
import { type TokenList, isExpired, timingSafeEqual } from "./token";

export const COOKIE_NAME = "__Host-admin";
export const OWNER_NAME = "owner";
export const REVIEWER_MAX_AGE = 7 * 24 * 3600;
export const OWNER_MAX_AGE = 30 * 24 * 3600;

export const maxAgeFor = (name: string): number => (name === OWNER_NAME ? OWNER_MAX_AGE : REVIEWER_MAX_AGE);

const toBase64Url = (bytes: Uint8Array): string => {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toBase64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message))));
}

export async function signSession(name: string, hash: string, expSec: number, secret: string): Promise<string> {
  if (!secret) throw new Error("서명 열쇠가 없습니다");
  return `${name}.${expSec}.${await hmac(secret, `${name}\n${expSec}\n${hash}`)}`;
}

export async function verifySession(value: string, list: TokenList, secret: string, nowSec: number): Promise<{ name: string } | null> {
  if (!secret || !value) return null;
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [name, expText, sig] = parts as [string, string, string];
  if (!name || !sig || !/^\d+$/.test(expText)) return null;
  const expSec = Number(expText);
  if (nowSec >= expSec) return null;
  const entry = Object.hasOwn(list, name) ? list[name] : undefined;
  if (!entry || isExpired(entry, new Date(nowSec * 1000))) return null;
  const expected = await hmac(secret, `${name}\n${expSec}\n${entry.hash}`);
  return timingSafeEqual(sig, expected) ? { name } : null;
}

const ATTRS = "Path=/; HttpOnly; Secure; SameSite=Lax";
export const sessionCookie = (value: string, maxAge: number): string => `${COOKIE_NAME}=${value}; ${ATTRS}; Max-Age=${maxAge}`;
export const clearCookie = (): string => `${COOKIE_NAME}=; ${ATTRS}; Max-Age=0`;
