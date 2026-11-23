// 작업 0326 — 관리 명령(scripts/admin-token.mjs)의 순수 부분 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   builder 가 만들 것 — scripts/admin-token-lib.ts (node: 가져오기 없이 Web Crypto 만 · admin-token.mjs 가 이것을 불러 add · remove · list · init 을 함 · 사용자가 자기 맥에서 돌림)
//     export const OWNER = "owner"
//     export type TokenEntry = { hash: string; exp?: string }  ·  export type TokenList = Record<string, TokenEntry>
//     export function newToken(): string                                              32바이트 무작위 → base64url(43자 · A-Z a-z 0-9 _ -) · 부를 때마다 다름
//     export async function hashToken(token: string): Promise<string>                 SHA-256 소문자 16진수 64자 — Worker 의 sha256Hex 와 같은 값
//     export function addEntry(list: TokenList, name: string, hash: string, exp?: string): TokenList
//         새 목록을 돌려줌(입력은 안 바뀜) · 이름은 영문 소문자 · 숫자 · 하이픈(63자 이하 · 하이픈으로 시작 안 함) · exp 는 있으면 실제 날짜 YYYY-MM-DD · 이미 있는 리뷰어 이름은 던짐(다른 토큰을 조용히 무효로 만들지 않음) · owner 는 이미 있어도 해시를 바꿔 다시 만듦(예전 링크 · 쿠키 무효) · owner 에 exp 는 못 줌(기한 없음)
//     export function removeEntry(list: TokenList, name: string): TokenList            새 목록 · owner 는 던짐(본인이 잠기지 않게) · 없는 이름은 던짐
//     export function listRows(list: TokenList, today: string): { name: string; exp: string | null; status: "유효" | "기한 지남"; owner: boolean }[]
//         이름 글자순 · 해시 · 토큰은 싣지 않음 · today 는 YYYY-MM-DD(exp 날까지 유효)
//     export const linkFor: (token: string, base?: string) => string                   `${base}/?t=${token}` · base 기본 https://admin.flapfx.com
//     export const secretPayload: (list: TokenList) => string                          wrangler secret put ADMIN_TOKENS 로 올릴 JSON — Worker 의 parseTokens 가 그대로 읽음
//   원칙: 토큰 원문은 새 링크로 한 번 출력할 뿐 — 로컬 목록(.tmp/admin-tokens.json)에도 비밀값 목록에도 해시만
import { describe, expect, it } from "vitest";
import { OWNER, addEntry, hashToken, linkFor, listRows, newToken, removeEntry, secretPayload } from "../../../../scripts/admin-token-lib";
import { matchToken, parseTokens, sha256Hex } from "./token";

const H = (c: string) => c.repeat(64);

describe("newToken · hashToken (작업 0326)", () => {
  it("무작위 32바이트 — base64url 43자 · 부를 때마다 다름", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const t = newToken();
      expect(t).toMatch(/^[A-Za-z0-9_-]{43}$/);
      seen.add(t);
    }
    expect(seen.size).toBe(50);
  });

  it("해시는 SHA-256 소문자 16진수 64자 — Worker 의 sha256Hex 와 같은 값", async () => {
    for (const t of ["abc", "", newToken(), "토큰"]) {
      expect(await hashToken(t)).toMatch(/^[0-9a-f]{64}$/);
      expect(await hashToken(t)).toBe(await sha256Hex(t));
    }
  });
});

describe("addEntry (작업 0326)", () => {
  it("새 목록을 돌려줌 — 입력은 안 바뀜 · 항목은 해시와 기한", () => {
    const before = { owner: { hash: H("a") } };
    const after = addEntry(before, "apply-acme-1124", H("b"), "2027-02-28");
    expect(after).toEqual({ owner: { hash: H("a") }, "apply-acme-1124": { hash: H("b"), exp: "2027-02-28" } });
    expect(before).toEqual({ owner: { hash: H("a") } });
    expect(addEntry({}, "x", H("c"))).toEqual({ x: { hash: H("c") } }); // 기한 없음 → exp 칸이 없음
    expect("exp" in (addEntry({}, "x", H("c")).x ?? {})).toBe(false);
  });

  it("이름 규칙 — 영문 소문자 · 숫자 · 하이픈 · 63자 이하 · 하이픈으로 시작 안 함 · 그 밖은 던짐", () => {
    for (const ok of ["a", "apply-acme-1124", "x".repeat(63), "0a"]) expect(() => addEntry({}, ok, H("a")), ok).not.toThrow();
    for (const bad of ["", "ACME", "a b", "a_b", "a.b", "-a", "x".repeat(64), "회사", "a'b", "a/b"]) expect(() => addEntry({}, bad, H("a")), JSON.stringify(bad)).toThrow();
  });

  it("해시 모양이 틀리면 던짐 · exp 가 실제 날짜가 아니면 던짐", () => {
    expect(() => addEntry({}, "x", "abc")).toThrow();
    expect(() => addEntry({}, "x", H("Z"))).toThrow();
    for (const bad of ["2027-13-01", "2027-02-30", "tomorrow", "2027/02/28", "27-02-28", ""]) expect(() => addEntry({}, "x", H("a"), bad), bad).toThrow();
    expect(() => addEntry({}, "x", H("a"), "2028-02-29")).not.toThrow(); // 윤년
  });

  it("이미 있는 리뷰어 이름은 던짐 — 다른 토큰을 조용히 무효로 만들지 않음", () => {
    expect(() => addEntry({ "apply-acme-1124": { hash: H("a") } }, "apply-acme-1124", H("b"))).toThrow();
  });

  it("owner 는 다시 만들 수 있음 — 해시가 바뀜(예전 링크 · 쿠키 무효) · 기한은 못 줌", () => {
    const l = addEntry({ owner: { hash: H("a") }, x: { hash: H("c") } }, OWNER, H("b"));
    expect(l.owner).toEqual({ hash: H("b") });
    expect(l.x).toEqual({ hash: H("c") });
    expect(() => addEntry({}, OWNER, H("a"), "2027-02-28")).toThrow();
  });
});

describe("removeEntry (작업 0326)", () => {
  it("이름을 뺀 새 목록 · 입력은 안 바뀜", () => {
    const before = { owner: { hash: H("a") }, "apply-acme-1124": { hash: H("b") } };
    expect(removeEntry(before, "apply-acme-1124")).toEqual({ owner: { hash: H("a") } });
    expect(Object.keys(before)).toHaveLength(2);
  });

  it("owner 는 던짐 — 실수로 본인이 잠기지 않게 · 없는 이름도 던짐", () => {
    expect(() => removeEntry({ owner: { hash: H("a") } }, OWNER)).toThrow();
    expect(() => removeEntry({ owner: { hash: H("a") } }, "nope")).toThrow();
  });
});

describe("listRows · linkFor · secretPayload (작업 0326)", () => {
  const list = { owner: { hash: H("a") }, "apply-b-1124": { hash: H("b"), exp: "2027-02-28" }, "apply-a-1101": { hash: H("c"), exp: "2026-11-22" } };

  it("이름 글자순 · 기한 · 상태(exp 날까지 유효) · owner 표시 · 해시 · 토큰을 싣지 않음", () => {
    const rows = listRows(list, "2026-11-23");
    expect(rows).toEqual([
      { name: "apply-a-1101", exp: "2026-11-22", status: "기한 지남", owner: false },
      { name: "apply-b-1124", exp: "2027-02-28", status: "유효", owner: false },
      { name: "owner", exp: null, status: "유효", owner: true },
    ]);
    expect(JSON.stringify(rows)).not.toMatch(/a{64}|b{64}|c{64}/);
    expect(listRows(list, "2026-11-22")[0]?.status, "exp 날 당일은 유효").toBe("유효");
  });

  it("새 링크 — 기본 https://admin.flapfx.com/?t=토큰 · base 를 바꿀 수 있음", () => {
    expect(linkFor("abc123")).toBe("https://admin.flapfx.com/?t=abc123");
    expect(linkFor("abc123", "http://localhost:8787")).toBe("http://localhost:8787/?t=abc123");
  });

  it("secretPayload — Worker 의 parseTokens 가 그대로 읽음 · 해시와 기한만(토큰 원문 없음)", async () => {
    const token = newToken();
    const l = addEntry({}, "apply-acme-1124", await hashToken(token), "2027-02-28");
    const payload = secretPayload(l);
    expect(parseTokens(payload)).toEqual(l);
    expect(payload).not.toContain(token);
    expect(JSON.parse(payload)["apply-acme-1124"]).toEqual({ hash: await hashToken(token), exp: "2027-02-28" });
  });

  it("관리 명령으로 만든 토큰이 Worker 에서 맞음 · 기한 지나면 · 지우면 못 들어옴 (명령 ↔ Worker 약속이 같음)", async () => {
    const token = newToken();
    const now = new Date("2026-11-23T03:00:00Z");
    let l = addEntry({}, "apply-acme-1124", await hashToken(token), "2027-02-28");
    expect(await matchToken(parseTokens(secretPayload(l)), token, now)).toEqual({ name: "apply-acme-1124" });
    expect(await matchToken(parseTokens(secretPayload(l)), token, new Date("2027-03-02T00:00:00Z"))).toBeNull();
    l = removeEntry(l, "apply-acme-1124");
    expect(await matchToken(parseTokens(secretPayload(l)), token, now)).toBeNull();
  });

  it("owner 를 다시 만들면 예전 토큰은 무효 · 새 토큰은 유효", async () => {
    const oldT = newToken();
    const newT = newToken();
    const now = new Date("2026-11-23T03:00:00Z");
    const first = addEntry({}, OWNER, await hashToken(oldT));
    const second = addEntry(first, OWNER, await hashToken(newT));
    expect(await matchToken(parseTokens(secretPayload(second)), oldT, now)).toBeNull();
    expect(await matchToken(parseTokens(secretPayload(second)), newT, now)).toEqual({ name: OWNER });
  });

  it("로컬 목록(해시만 저장)에 토큰 원문이 없음 — 목록 글에는 해시가 있고 토큰은 없음", async () => {
    const token = newToken();
    const l = addEntry({}, "apply-acme-1124", await hashToken(token));
    const local = JSON.stringify(l);
    expect(local).not.toContain(token);
    expect(local).toContain(await hashToken(token));
  });
});
