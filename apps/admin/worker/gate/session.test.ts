// 작업 0326 — 어드민 입구: 쿠키 서명 · 검증 · 쿠키 머리글 (순수 함수 · 테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   builder 가 만들 것 — apps/admin/worker/gate/session.ts
//     export const COOKIE_NAME = "__Host-admin"
//     export const OWNER_NAME = "owner"
//     export const REVIEWER_MAX_AGE = 604800        (7일 · 초)
//     export const OWNER_MAX_AGE = 2592000          (30일 · 초)
//     export const maxAgeFor: (name: string) => number                       owner 면 30일 · 그 밖은 7일
//     export async function signSession(name: string, hash: string, expSec: number, secret: string): Promise<string>
//        값 = `${이름}.${만료(초 · 유닉스 시각)}.${서명}` — 서명 = HMAC-SHA256(열쇠, 이름 · 만료 · 그 토큰의 해시) 의 base64url · 토큰 원문은 값에 없음 · 해시도 값에 없음(서명에만 묶임)
//     export async function verifySession(value: string, list: TokenList, secret: string, nowSec: number): Promise<{ name: string } | null>
//        서명이 맞고 · 만료 전이고 · 이름이 목록에 아직 있고 · 그 이름의 해시가 서명 때와 같고 · 목록의 기한(exp)이 안 지났으면 그 이름 — 그 밖은 모두 null
//     export const sessionCookie: (value: string, maxAge: number) => string      `__Host-admin=값; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=n` (Domain 없음 — __Host- 규칙)
//     export const clearCookie: () => string                                    값 비움 · Max-Age=0 · 나머지 속성 같음
import { describe, expect, it } from "vitest";
import { COOKIE_NAME, OWNER_MAX_AGE, OWNER_NAME, REVIEWER_MAX_AGE, clearCookie, maxAgeFor, sessionCookie, signSession, verifySession } from "./session";
import { type TokenList, sha256Hex } from "./token";

const SECRET = "secret-0326-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const NOW = 1_800_000_000; // 초
const hashes = async () => ({ acme: await sha256Hex("t-acme"), owner: await sha256Hex("t-owner"), other: await sha256Hex("t-other") });
async function list(): Promise<TokenList> {
  const h = await hashes();
  return { "apply-acme-1124": { hash: h.acme, exp: "2099-12-31" }, owner: { hash: h.owner }, "apply-other-1125": { hash: h.other } };
}

describe("쿠키 약속 (작업 0326)", () => {
  it("이름 · 기간 — __Host-admin · 리뷰어 7일 · owner 30일", () => {
    expect(COOKIE_NAME).toBe("__Host-admin");
    expect(OWNER_NAME).toBe("owner");
    expect(REVIEWER_MAX_AGE).toBe(7 * 24 * 3600);
    expect(OWNER_MAX_AGE).toBe(30 * 24 * 3600);
    expect(maxAgeFor("owner")).toBe(2_592_000);
    expect(maxAgeFor("apply-acme-1124")).toBe(604_800);
  });

  it("머리글 — HttpOnly · Secure · SameSite=Lax · Path=/ · Max-Age · Domain 없음", () => {
    const c = sessionCookie("v.1.sig", 604_800);
    expect(c.startsWith("__Host-admin=v.1.sig;")).toBe(true);
    for (const part of ["Path=/", "HttpOnly", "Secure", "SameSite=Lax", "Max-Age=604800"]) expect(c.split(/;\s*/), part).toContain(part);
    expect(c).not.toMatch(/Domain=/i);
  });

  it("지우는 머리글 — 값이 비고 Max-Age=0 · 같은 속성", () => {
    const c = clearCookie();
    expect(c.startsWith("__Host-admin=;")).toBe(true);
    for (const part of ["Path=/", "HttpOnly", "Secure", "SameSite=Lax", "Max-Age=0"]) expect(c.split(/;\s*/), part).toContain(part);
    expect(c).not.toMatch(/Domain=/i);
  });
});

describe("signSession · verifySession (작업 0326)", () => {
  it("값 모양 — 이름.만료.서명 · 토큰 원문 · 해시가 값에 없음", async () => {
    const h = await hashes();
    const v = await signSession("apply-acme-1124", h.acme, NOW + 100, SECRET);
    const parts = v.split(".");
    expect(parts).toHaveLength(3);
    expect(parts[0]).toBe("apply-acme-1124");
    expect(parts[1]).toBe(String(NOW + 100));
    expect(parts[2]).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(v).not.toContain("t-acme");
    expect(v).not.toContain(h.acme);
  });

  it("맞는 값 → 그 이름 (같은 입력은 같은 서명)", async () => {
    const h = await hashes();
    const v = await signSession("apply-acme-1124", h.acme, NOW + 100, SECRET);
    expect(await verifySession(v, await list(), SECRET, NOW)).toEqual({ name: "apply-acme-1124" });
    expect(await signSession("apply-acme-1124", h.acme, NOW + 100, SECRET)).toBe(v);
  });

  it("만료 — 지났으면 null · 정확히 만료 시각도 null", async () => {
    const h = await hashes();
    const v = await signSession("apply-acme-1124", h.acme, NOW + 100, SECRET);
    expect(await verifySession(v, await list(), SECRET, NOW + 100)).toBeNull();
    expect(await verifySession(v, await list(), SECRET, NOW + 101)).toBeNull();
    expect(await verifySession(v, await list(), SECRET, NOW + 99)).toEqual({ name: "apply-acme-1124" });
  });

  it("서명이 틀림 — 글자 하나 바꿈 · 다른 열쇠 · 이름 바꿔치기 · 만료 늘리기 → null", async () => {
    const h = await hashes();
    const v = await signSession("apply-acme-1124", h.acme, NOW + 100, SECRET);
    const [n, e, s] = v.split(".") as [string, string, string];
    const flip = `${s.slice(0, -1)}${s.endsWith("A") ? "B" : "A"}`;
    expect(await verifySession(`${n}.${e}.${flip}`, await list(), SECRET, NOW)).toBeNull();
    expect(await verifySession(v, await list(), `${SECRET}x`, NOW)).toBeNull();
    expect(await verifySession(`owner.${e}.${s}`, await list(), SECRET, NOW), "이름 바꿔치기").toBeNull();
    expect(await verifySession(`${n}.${NOW + 999_999}.${s}`, await list(), SECRET, NOW), "만료 늘리기").toBeNull();
  });

  it("목록에서 지운 이름 → null (쿠키도 바로 무효)", async () => {
    const h = await hashes();
    const v = await signSession("apply-acme-1124", h.acme, NOW + 100, SECRET);
    const l = await list();
    delete l["apply-acme-1124"];
    expect(await verifySession(v, l, SECRET, NOW)).toBeNull();
    expect(await verifySession(v, {}, SECRET, NOW)).toBeNull();
  });

  it("해시가 바뀐 이름(owner 를 다시 만듦) → 예전 쿠키 무효 · 새 해시로 서명한 쿠키는 유효", async () => {
    const h = await hashes();
    const old = await signSession("owner", h.owner, NOW + 100, SECRET);
    const renewed: TokenList = { ...(await list()), owner: { hash: await sha256Hex("t-owner-NEW") } };
    expect(await verifySession(old, renewed, SECRET, NOW)).toBeNull();
    const fresh = await signSession("owner", await sha256Hex("t-owner-NEW"), NOW + 100, SECRET);
    expect(await verifySession(fresh, renewed, SECRET, NOW)).toEqual({ name: "owner" });
  });

  it("목록의 기한(exp)이 지난 토큰의 쿠키는 무효 — 전형이 끝나 기한이 지나면 쿠키도 못 씀", async () => {
    const h = await hashes();
    const l: TokenList = { "apply-acme-1124": { hash: h.acme, exp: "2020-01-01" } };
    const v = await signSession("apply-acme-1124", h.acme, NOW + 100, SECRET);
    expect(await verifySession(v, l, SECRET, NOW)).toBeNull();
  });

  it("깨진 값 · 빈 값 → null · 던지지 않음", async () => {
    for (const bad of ["", ".", "..", "a.b", "a.b.c", "a.b.c.d", "apply-acme-1124.notanumber.sig", "apply-acme-1124.1800000100.", ".1800000100.sig", "%%%"]) {
      expect(await verifySession(bad, await list(), SECRET, NOW), JSON.stringify(bad)).toBeNull();
    }
  });

  it("열쇠가 비어 있으면 검증은 항상 null — 닫힌 쪽", async () => {
    const h = await hashes();
    const v = await signSession("apply-acme-1124", h.acme, NOW + 100, SECRET);
    expect(await verifySession(v, await list(), "", NOW)).toBeNull();
    // 빈 열쇠로 만든 값도 통과하지 않음
    const weak = await signSession("apply-acme-1124", h.acme, NOW + 100, "").catch(() => "");
    expect(await verifySession(weak, await list(), "", NOW)).toBeNull();
  });
});
