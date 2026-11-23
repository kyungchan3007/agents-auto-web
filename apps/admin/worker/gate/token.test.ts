// 작업 0326 — 어드민 입구: 토큰 해시 · 길이 일정 비교 · 목록 읽기 · 기한 (순수 함수 · 테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   builder 가 만들 것 — apps/admin/worker/gate/token.ts
//     export type TokenEntry = { hash: string; exp?: string }            hash = 토큰 원문의 SHA-256 소문자 16진수 64자 · exp = YYYY-MM-DD(없으면 기한 없음)
//     export type TokenList = Record<string, TokenEntry>                  키 = 토큰 이름(회사 · 날짜 · 예: apply-acme-1124)
//     export async function sha256Hex(text: string): Promise<string>
//     export function timingSafeEqual(a: string, b: string): boolean     길이가 달라도 같은 만큼 훑고 false (일찍 끝내지 않음)
//     export function parseTokens(raw: string | undefined): TokenList    없음 · 깨진 글 → {} (닫힌 쪽) · hash 가 64자 16진수가 아니거나 exp 모양이 틀린 항목은 버림
//     export async function matchToken(list: TokenList, presented: string, now: Date): Promise<{ name: string } | null>
//        들어온 토큰의 SHA-256 이 목록의 해시와 같으면 그 이름 · 기한(exp)이 지났으면 null · 틀림 · 빈 글 · 없음 모두 null (구분하지 않음)
//        기한은 exp 날(한국 시간) 끝까지 — exp 다음 날 한국 시간부터 무효
import { describe, expect, it } from "vitest";
import { type TokenList, matchToken, parseTokens, sha256Hex, timingSafeEqual } from "./token";

const H = (c: string) => c.repeat(64);

describe("sha256Hex (작업 0326)", () => {
  it("알려진 값 — 'abc' 의 SHA-256 · 소문자 16진수 64자", async () => {
    expect(await sha256Hex("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    expect(await sha256Hex("")).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    expect(await sha256Hex("토큰")).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("timingSafeEqual — 길이 일정 비교 (작업 0326)", () => {
  it("같으면 true · 다르면 false · 길이가 달라도 false · 빈 글끼리는 true", () => {
    expect(timingSafeEqual("abc123", "abc123")).toBe(true);
    expect(timingSafeEqual("abc123", "abc124")).toBe(false);
    expect(timingSafeEqual("abc", "abcd")).toBe(false);
    expect(timingSafeEqual("abcd", "abc")).toBe(false);
    expect(timingSafeEqual("", "")).toBe(true);
    expect(timingSafeEqual("", "a")).toBe(false);
  });

  it("앞 글자만 같아도 · 마지막 글자만 달라도 false (일찍 끝내지 않음 — 결과만 확인)", () => {
    const a = H("a");
    expect(timingSafeEqual(a, `${a.slice(0, -1)}b`)).toBe(false);
    expect(timingSafeEqual(a, `b${a.slice(1)}`)).toBe(false);
  });
});

describe("parseTokens — ADMIN_TOKENS 읽기 (작업 0326)", () => {
  it("올바른 목록은 그대로", () => {
    const raw = JSON.stringify({ "apply-acme-1124": { hash: H("a"), exp: "2027-02-28" }, owner: { hash: H("b") } });
    expect(parseTokens(raw)).toEqual({ "apply-acme-1124": { hash: H("a"), exp: "2027-02-28" }, owner: { hash: H("b") } });
  });

  it("없음 · 빈 글 · 깨진 JSON · 객체가 아님 → 빈 목록 (아무도 못 들어옴 — 닫힌 쪽) · 던지지 않음", () => {
    for (const bad of [undefined, "", "   ", "{", "null", "[]", '"x"', "42", "true"]) expect(parseTokens(bad), String(bad)).toEqual({});
  });

  it("해시가 64자 16진수가 아닌 항목 · exp 모양이 틀린 항목 · 항목이 객체가 아닌 것은 버림 — 나머지는 남김", () => {
    const raw = JSON.stringify({
      ok: { hash: H("a") },
      short: { hash: "abc" },
      upper: { hash: H("A") },
      nothex: { hash: H("z") },
      badexp: { hash: H("c"), exp: "2027/02/28" },
      nohash: { exp: "2027-02-28" },
      str: "x",
      nul: null,
    });
    expect(parseTokens(raw)).toEqual({ ok: { hash: H("a") } });
  });

  it("토큰 원문 필드(token)가 있으면 읽지 않음 — 목록은 해시만 (원문을 비밀값에 두지 않음)", () => {
    const parsed = parseTokens(JSON.stringify({ x: { hash: H("a"), token: "plain-secret" } }));
    expect(JSON.stringify(parsed)).not.toContain("plain-secret");
  });
});

describe("matchToken — 들어온 토큰 확인 (작업 0326)", () => {
  const NOW = new Date("2026-11-23T03:00:00Z");
  const list = async (): Promise<TokenList> => ({
    "apply-acme-1124": { hash: await sha256Hex("good-token"), exp: "2027-02-28" },
    owner: { hash: await sha256Hex("owner-token") },
    "apply-old-0101": { hash: await sha256Hex("old-token"), exp: "2026-11-22" },
  });

  it("맞는 토큰 → 그 이름 (기한 없음 · 기한 안)", async () => {
    expect(await matchToken(await list(), "good-token", NOW)).toEqual({ name: "apply-acme-1124" });
    expect(await matchToken(await list(), "owner-token", NOW)).toEqual({ name: "owner" });
  });

  it("틀린 토큰 · 빈 글 · 공백 · 거의 같은 토큰 → null", async () => {
    for (const bad of ["wrong", "", " ", "good-token ", "good-toke", "GOOD-TOKEN", "owner-token\n"]) expect(await matchToken(await list(), bad, NOW), JSON.stringify(bad)).toBeNull();
  });

  it("기한이 지난 토큰은 null — 틀림 · 지움과 같은 결과(구분하지 않음)", async () => {
    expect(await matchToken(await list(), "old-token", NOW)).toBeNull();
  });

  it("기한은 exp 날 끝까지(한국 시간) — exp 날 저녁은 유효 · 그 다음 날은 무효", async () => {
    const l: TokenList = { x: { hash: await sha256Hex("t"), exp: "2026-11-23" } };
    expect(await matchToken(l, "t", new Date("2026-11-23T12:00:00Z")), "exp 날 한국 21시").toEqual({ name: "x" });
    expect(await matchToken(l, "t", new Date("2026-11-24T12:00:00Z")), "다음 날 한국 21시").toBeNull();
    expect(await matchToken(l, "t", new Date("2026-11-30T00:00:00Z"))).toBeNull();
  });

  it("빈 목록 → 항상 null · 같은 해시가 두 이름에 있어도 던지지 않음", async () => {
    expect(await matchToken({}, "good-token", NOW)).toBeNull();
    const h = await sha256Hex("dup");
    const r = await matchToken({ a: { hash: h }, b: { hash: h } }, "dup", NOW);
    expect(["a", "b"]).toContain(r?.name);
  });
});
