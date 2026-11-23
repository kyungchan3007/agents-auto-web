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
import { OWNER, addEntry, hashToken, hasVersionsFlag, linkFor, listRows, newToken, notDeployedHelp, removeEntry, secretPayload, secretPutArgs, secretPutFailure, versionsPutNotice, wranglerFailureText } from "../../../../scripts/admin-token-lib";
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

// 작업 0329 — 비밀값 넣기가 "최신 버전이 배포되지 않음"으로 실패할 때 이유 · 해결을 한국어로 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   배경: Workers Builds 가 develop 푸시 때 새 버전을 올리기만(미리보기) 하면 최신 버전이 운영에 배포되지 않은 상태 — 이때 wrangler secret put 이 실패하는데 지금은 오류 끝 세 줄만 보여 줌(11-23 init 실패)
//   builder 가 만들 것 — scripts/admin-token-lib.ts 에 순수 함수 · scripts/admin-token.mjs 는 이것을 불러 출력만
//     export type SecretFailure = "not-deployed" | "other"
//     export function secretPutFailure(output: string): SecretFailure
//        wrangler 오류 글(표준 오류 · 표준 출력) → 종류. "not-deployed" = 최신 버전이 운영에 배포되지 않았다는 뜻의 여러 표현(대소문자 무시):
//          "the latest version of your Worker isn't currently deployed" · "latest version ... is not deployed" · "not fully deployed" · "gradual deployment" · 오류 번호 10215
//        그 밖(인증 · 네트워크 · 이름 충돌 · 알 수 없는 글 · 빈 글)은 "other". 주의: wrangler 는 업데이트 안내("update to the latest version of wrangler")도 같은 글에 찍음 — 배포와 관계없으니 "other"
//     export function notDeployedHelp(opts: { config: string; versionId?: string }): string
//        한국어 안내 — 이유(최신 버전이 운영에 배포되지 않음) + 해결 두 가지(1. 배포 뒤 다시 실행: `wrangler versions deploy <버전> --config <설정>` · 2. --versions 로 새 버전에 비밀값을 넣고 그 버전을 배포) · versionId 를 알면 그 값으로, 모르면 <버전> 자리표시
//     export function wranglerFailureText(args: string[], output: string, config: string): string
//        실패 한 줄 — other 면 지금 그대로 `wrangler ${args 앞 3개} 실패 — ${출력 끝 3줄을 공백으로}` · not-deployed 면 같은 앞머리 + notDeployedHelp
//     export function secretPutArgs(name: string, config: string, opts: { versions: boolean }): string[]
//        기본 ["secret","put",name,"--config",config] · versions 면 ["versions","secret","put",name,"--config",config] (새 버전만 만들고 배포하지 않음)
//     export function versionsPutNotice(config: string): string       --versions 로 넣은 뒤 출력 — 새 버전을 만들었을 뿐 배포하지 않았으니 배포하라는 안내(wrangler versions deploy · 설정)
//     export function hasVersionsFlag(argv: string[]): boolean         명령 인자에 정확히 --versions 가 있으면 true
describe("secretPutFailure — wrangler 오류 글의 종류 (작업 0329)", () => {
  const REAL =
    "✘ [ERROR] Secret edit failed. You attempted to modify a secret, but the latest version of your Worker isn't currently deployed. Please ensure that the latest version of your Worker is fully deployed (https://developers.cloudflare.com/workers/configuration/versions-and-deployments/#create-a-deployment) before modifying secrets. Alternatively, you can use the Cloudflare dashboard to modify secrets and deploy the version. [code: 10215]";

  it("실제 wrangler 문구(최신 버전이 배포되지 않음) → not-deployed", () => {
    expect(secretPutFailure(REAL)).toBe("not-deployed");
  });

  it("여러 표현을 넓게 — latest version · not deployed · not fully deployed · gradual deployment · 오류 번호 10215 (대소문자 · 줄바꿈 · 앞뒤 글 무시)", () => {
    for (const text of [
      "The latest version of your Worker is not deployed",
      "THE LATEST VERSION OF YOUR WORKER ISN'T CURRENTLY DEPLOYED",
      "Please ensure the latest version is fully deployed before modifying secrets. The Worker is not fully deployed.",
      "Cannot edit secrets while a gradual deployment is in progress",
      "A request to the Cloudflare API (/accounts/abc/workers/scripts/flapfx-admin/secrets) failed. [code: 10215]",
      "line 1\nline 2\n✘ ERROR  the latest version of your worker is not deployed\nline 4",
      "Worker version is not deployed to 100% of traffic (gradual deployment)",
    ]) expect(secretPutFailure(text), text.slice(0, 50)).toBe("not-deployed");
  });

  it("다른 오류는 그대로 other — 인증 · 네트워크 · 이름 충돌 · 권한 · 알 수 없는 글", () => {
    for (const text of [
      "✘ [ERROR] A request to the Cloudflare API failed. Authentication error [code: 10000]",
      "fetch failed: getaddrinfo ENOTFOUND api.cloudflare.com",
      "Secret edit failed. Binding name 'ADMIN_TOKENS' already in use. [code: 10053]",
      "You are not logged in. Please run `wrangler login`",
      "Missing entry-point to Worker script",
      "something went wrong",
    ]) expect(secretPutFailure(text), text.slice(0, 50)).toBe("other");
  });

  it("wrangler 업데이트 안내의 'latest version' 만으로는 not-deployed 가 아님 — 다른 오류는 other", () => {
    const update = "▲ [WARNING] The version of Wrangler you are using is now out-of-date.\n  Please update to the latest version to prevent bugs and unexpected behavior.\n✘ [ERROR] Authentication error [code: 10000]";
    expect(secretPutFailure(update)).toBe("other");
    expect(secretPutFailure("Update available: the latest version of wrangler is 4.99.0")).toBe("other");
  });

  it("빈 글 · 공백 · 아주 긴 글도 던지지 않음 — 빈 글은 other", () => {
    for (const text of ["", " ", "\n\n"]) expect(secretPutFailure(text)).toBe("other");
    expect(secretPutFailure(`${"x".repeat(100_000)} gradual deployment`)).toBe("not-deployed");
  });
});

describe("notDeployedHelp — 한국어 안내 (작업 0329)", () => {
  const CONFIG = "apps/admin/wrangler.jsonc";

  it("이유 — 최신 버전이 운영에 배포되지 않아 비밀값을 넣지 못함", () => {
    const t = notDeployedHelp({ config: CONFIG });
    expect(t).toContain("최신 버전");
    expect(t).toMatch(/배포되지 않/);
    expect(t).toMatch(/비밀값/);
  });

  it("해결 두 가지 — 1. 배포 뒤 다시 실행 · 2. --versions 로 새 버전에 넣고 그 버전을 배포", () => {
    const t = notDeployedHelp({ config: CONFIG });
    expect(t).toMatch(/^\s*1[.)]/m);
    expect(t).toMatch(/^\s*2[.)]/m);
    expect(t).not.toMatch(/^\s*3[.)]/m);
    expect(t).toContain("--versions");
    expect(t).toMatch(/다시 실행/);
  });

  it("버전 배포 명령 — wrangler versions deploy <버전> --config <설정> (버전을 모르면 <버전> 자리표시 · 알면 그 값)", () => {
    expect(notDeployedHelp({ config: CONFIG })).toContain(`wrangler versions deploy <버전> --config ${CONFIG}`);
    expect(notDeployedHelp({ config: CONFIG, versionId: "abc12345-0000-4000-8000-123456789abc" })).toContain(`wrangler versions deploy abc12345-0000-4000-8000-123456789abc --config ${CONFIG}`);
    expect(notDeployedHelp({ config: "apps/api/wrangler.jsonc" })).toContain("--config apps/api/wrangler.jsonc");
  });

  it("대시보드로 배포하는 길도 알림 · 한글 글 · 'undefined' · 비밀값 글이 없음", () => {
    const t = notDeployedHelp({ config: CONFIG });
    expect(t).toMatch(/대시보드/);
    expect(t).toMatch(/[가-힣]{5,}/);
    expect(t).not.toMatch(/undefined|null|\[object/);
  });
});

describe("wranglerFailureText — 실패 한 줄 (작업 0329)", () => {
  const CONFIG = "apps/admin/wrangler.jsonc";
  const ARGS = ["secret", "put", "ADMIN_TOKENS", "--config", CONFIG];

  it("다른 오류는 지금 그대로 — 'wrangler secret put ADMIN_TOKENS 실패 — ' + 출력 끝 세 줄을 공백으로", () => {
    const out = "l1\nl2\nl3\n✘ Authentication error\nl5";
    expect(wranglerFailureText(ARGS, out, CONFIG)).toBe("wrangler secret put ADMIN_TOKENS 실패 — l3 ✘ Authentication error l5");
    expect(wranglerFailureText(ARGS, "  one line  \n", CONFIG)).toBe("wrangler secret put ADMIN_TOKENS 실패 — one line");
  });

  it("배포되지 않음 오류 → 같은 앞머리 + 한국어 안내(이유 · 해결 두 가지 · 배포 명령) · 영어 오류 끝 세 줄만 던지지 않음", () => {
    const out = "✘ [ERROR] Secret edit failed. You attempted to modify a secret, but the latest version of your Worker isn't currently deployed. [code: 10215]";
    const t = wranglerFailureText(ARGS, out, CONFIG);
    expect(t.startsWith("wrangler secret put ADMIN_TOKENS 실패")).toBe(true);
    expect(t).toContain(notDeployedHelp({ config: CONFIG }));
    expect(t).toContain(`wrangler versions deploy <버전> --config ${CONFIG}`);
  });

  it("출력에 토큰 · 열쇠 값이 있어도 그 글을 되비치지 않음 — 안내만", () => {
    const out = "Secret edit failed ... the latest version of your Worker isn't currently deployed. value=SUPER-SECRET-0329";
    expect(wranglerFailureText(ARGS, out, CONFIG)).not.toContain("SUPER-SECRET-0329");
  });
});

describe("secretPutArgs · versionsPutNotice · hasVersionsFlag (작업 0329)", () => {
  const CONFIG = "apps/admin/wrangler.jsonc";

  it("기본은 지금 그대로 — secret put <이름> --config <설정>", () => {
    expect(secretPutArgs("ADMIN_TOKENS", CONFIG, { versions: false })).toEqual(["secret", "put", "ADMIN_TOKENS", "--config", CONFIG]);
  });

  it("--versions 면 wrangler versions secret put — 새 버전만 만들고 배포하지 않는 길", () => {
    expect(secretPutArgs("ADMIN_TOKENS", CONFIG, { versions: true })).toEqual(["versions", "secret", "put", "ADMIN_TOKENS", "--config", CONFIG]);
  });

  it("넣은 뒤 안내 — 새 버전을 만들었을 뿐 배포하지 않았음 · 배포 명령(설정 포함)", () => {
    const t = versionsPutNotice(CONFIG);
    expect(t).toMatch(/새 버전/);
    expect(t).toMatch(/배포하지 않/);
    expect(t).toContain(`wrangler versions deploy`);
    expect(t).toContain(`--config ${CONFIG}`);
    expect(t).toMatch(/[가-힣]{5,}/);
  });

  it("hasVersionsFlag — 정확히 --versions 만 · 비슷한 글 · 값으로 든 글은 아님", () => {
    expect(hasVersionsFlag(["init", "--versions"])).toBe(true);
    expect(hasVersionsFlag(["--versions", "add", "apply-acme-1124"])).toBe(true);
    expect(hasVersionsFlag(["init"])).toBe(false);
    expect(hasVersionsFlag(["add", "x", "--exp", "2027-01-01"])).toBe(false);
    expect(hasVersionsFlag(["init", "--versionsx"])).toBe(false);
    expect(hasVersionsFlag(["init", "--version"])).toBe(false);
    expect(hasVersionsFlag([])).toBe(false);
  });
});
