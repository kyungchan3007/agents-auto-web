// 작업 0326 — 어드민 입구: Worker 가 모든 요청 앞에서 판정 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   worker.fetch(request, env, ctx) 의 응답만 봄 — 판정 함수의 이름은 정하지 않음(내부 구조는 builder 몫) · 쿠키 · 토큰은 test-kit.ts 가 만듦
//   env(비밀값): ADMIN_TOKENS(목록 JSON · 해시) · ADMIN_SESSION_SECRET(서명 열쇠) · ADMIN_API_KEY(API 에 보여 줄 열쇠) — Env 에 선택 항목으로 더함
//   순서: robots.txt 는 로그인 없이 그대로(전부 막음 글) → 그 밖은 모두 판정이 먼저(주소 나누기 · 방문자 주소 301 보다 앞) → 통과하면 지금처럼
//   응답 약속
//     ?t=토큰 이 맞음           303 · 이동 주소 = ?t 만 지운 같은 주소(다른 쿼리는 남김) · Set-Cookie(__Host-admin) · 자산 · API 를 부르지 않음
//     쿠키 없음(페이지 · 자산)   401 HTML ① 막는 화면 — 링크로만 들어올 수 있다는 글 · 접힌 <details> 안에 POST /login 양식(칸 이름 token) · 공개 화면 링크
//     ?t 가 틀림 · 지움 · 기한 지남 · 쿠키가 무효   401 HTML ③ "사용할 수 없는 링크" — 어느 경우든 본문이 완전히 같음(구분하지 않음)
//     /bff/*  쿠키 없음 · 무효    401 JSON({error}) · API 를 부르지 않음
//     POST /login (form: token)  맞으면 ?t 와 같은 303 + 쿠키(이동 주소 /) · 틀리면 ③
//     /logout                    쿠키를 Max-Age=0 으로 지움(303 · 이동 주소 /) · 로그인 없이도 됨
//     GET /session               쿠키가 맞으면 {name} JSON · 아니면 401
//     모든 응답                  x-robots-tag: noindex, nofollow · HTML 에는 <meta name="robots" content="noindex…">
//   접속 기록: API 서비스 바인딩으로 POST /admin-visits {"name": 토큰 이름} (x-admin-key 머리글) — 쿠키를 심을 때 · 로그인한 페이지(HTML) 요청 때 · owner 는 보내지 않음 · 자산 · /bff · /session 요청은 보내지 않음 · 기록이 실패해도 화면은 그대로
import { describe, expect, it, vi } from "vitest";
import worker, { type Env } from "../index";
import { COOKIE_NAME, OWNER_NAME } from "./session";
import { API_KEY, EXPIRED_NAME, EXPIRED_TOKEN, OWNER_TOKEN, REMOVED_TOKEN, REVIEWER_NAME, REVIEWER_TOKEN, SECRET, cookieFor, gateEnv, tokenList } from "./test-kit";

const ORIGIN = "https://admin.flapfx.com";

async function setup(opts: { env?: Partial<Env>; apiFails?: boolean } = {}) {
  const assets = vi.fn(async () => new Response("<html><body>page</body></html>", { status: 200, headers: { "content-type": "text/html; charset=utf-8" } }));
  const calls: Request[] = [];
  const api = vi.fn(async (r: Request) => {
    calls.push(r.clone());
    if (opts.apiFails && new URL(r.url).pathname === "/admin-visits") throw new Error("api down");
    return Response.json({ ok: true });
  });
  const env = { ASSETS: { fetch: assets }, API: { fetch: api }, ...(await gateEnv()), ...opts.env } as Env;
  const pending: Promise<unknown>[] = [];
  const ctx = { waitUntil: (p: Promise<unknown>) => void pending.push(p.catch(() => undefined)) };
  const call = async (url: string, init?: RequestInit) => {
    const res = await worker.fetch(new Request(url, init), env, ctx);
    await Promise.all(pending);
    return res;
  };
  const visits = async () => {
    const out: { method: string; key: string | null; body: unknown; cookie: string | null }[] = [];
    for (const r of calls) if (new URL(r.url).pathname === "/admin-visits") out.push({ method: r.method, key: r.headers.get("x-admin-key"), body: r.method === "POST" ? await r.clone().json().catch(() => null) : null, cookie: r.headers.get("cookie") });
    return out.filter((v) => v.method === "POST");
  };
  return { env, assets, api, call, visits, calls };
}
const abs = (loc: string | null, base = `${ORIGIN}/`) => new URL(loc ?? "", base).href;
const cookiePair = (res: Response) => (res.headers.get("set-cookie") ?? "").split(";")[0] ?? "";
const form = (token: string) => ({ method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ token }).toString() });

describe("① 막는 화면 — 쿠키 없이 주소만 (작업 0326)", () => {
  it("페이지 요청은 401 HTML · 자산 · API 를 부르지 않음 · 검색 막음", async () => {
    const s = await setup();
    for (const path of ["/", "/log", "/geo", "/how", "/marketing", "/traffic", "/instagram"]) {
      const res = await s.call(`${ORIGIN}${path}`);
      expect(res.status, path).toBe(401);
      expect(res.headers.get("content-type"), path).toMatch(/text\/html/);
      expect(res.headers.get("x-robots-tag"), path).toBe("noindex, nofollow");
      expect(res.headers.get("set-cookie"), path).toBeNull();
    }
    expect(s.assets).not.toHaveBeenCalled();
    expect(s.api).not.toHaveBeenCalled();
  });

  it("글 · 구조 — 링크로만 들어올 수 있음 · 공개 화면 링크 · 접힌 토큰 직접 입력(POST /login · 칸 token) · noindex 메타 · 쿠키 설정 없음", async () => {
    const s = await setup();
    const html = await (await s.call(`${ORIGIN}/log`)).text();
    expect(html).toContain("전용 링크로만 들어올 수 있습니다");
    expect(html).toContain("받으신 링크를 다시 눌러 주세요");
    expect(html).toMatch(/href="https:\/\/flapfx\.com\/?"/);
    expect(html).toMatch(/<meta[^>]+name="robots"[^>]+noindex/i);
    expect(html).toMatch(/<details[\s\S]*<form[^>]+action="\/login"[^>]+method="post"[\s\S]*name="token"[\s\S]*<\/form>[\s\S]*<\/details>/i);
  });

  it("정적 파일(_next · favicon)도 막음 — 자산에 닿지 않음", async () => {
    const s = await setup();
    for (const path of ["/_next/static/chunks/a.js", "/favicon.ico", "/icon.svg", "/404.html"]) expect((await s.call(`${ORIGIN}${path}`)).status, path).toBe(401);
    expect(s.assets).not.toHaveBeenCalled();
  });

  it("미리보기 주소(workers.dev)도 같은 Worker 라 함께 막힘 · 방문자 주소 301 보다 판정이 먼저", async () => {
    const s = await setup();
    expect((await s.call("https://flapfx-admin.example.workers.dev/geo")).status).toBe(401);
    expect((await s.call(`${ORIGIN}/currencies/USD`)).status, "방문자 경로도 로그인 먼저").toBe(401);
    expect(s.assets).not.toHaveBeenCalled();
  });

  it("robots.txt 는 로그인 없이 그대로 — 전부 막음 글(검색 엔진이 막힘을 알도록)", async () => {
    const s = await setup();
    const res = await s.call(`${ORIGIN}/robots.txt`);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("User-agent: *\nDisallow: /\n");
  });

  it("비밀값이 없으면(목록 · 서명 열쇠 하나라도) 아무도 못 들어옴 — ?t 가 와도 닫힌 쪽", async () => {
    for (const env of [{ ADMIN_TOKENS: undefined }, { ADMIN_SESSION_SECRET: undefined }, { ADMIN_TOKENS: "{}" }, { ADMIN_TOKENS: "깨진" }] as unknown as Partial<Env>[]) {
      const s = await setup({ env });
      const res = await s.call(`${ORIGIN}/log?t=${REVIEWER_TOKEN}`);
      expect(res.status, JSON.stringify(env)).toBe(401);
      expect(res.headers.get("set-cookie")).toBeNull();
      expect(s.assets).not.toHaveBeenCalled();
    }
  });
});

describe("지원 링크 ?t= — 아무것도 입력하지 않고 들어옴 (작업 0326)", () => {
  it("맞는 토큰 → 303 · ?t 를 지운 주소 · 쿠키(HttpOnly · Secure · SameSite=Lax · 7일) · 자산 · API 를 부르지 않음", async () => {
    const s = await setup();
    const res = await s.call(`${ORIGIN}/?t=${REVIEWER_TOKEN}`);
    expect(res.status).toBe(303);
    expect(abs(res.headers.get("location"))).toBe(`${ORIGIN}/geo`); // 작업 0403: 회사 세션의 첫 화면은 /geo
    const c = res.headers.get("set-cookie") ?? "";
    expect(c.startsWith(`${COOKIE_NAME}=`)).toBe(true);
    for (const part of ["Path=/", "HttpOnly", "Secure", "SameSite=Lax", "Max-Age=604800"]) expect(c.split(/;\s*/), part).toContain(part);
    expect(c).not.toMatch(/Domain=/i);
    expect(res.headers.get("x-robots-tag")).toBe("noindex, nofollow");
    expect(s.assets).not.toHaveBeenCalled();
    expect((await s.visits()).length, "기록 외에 API 를 부르지 않음").toBe(s.calls.length);
  });

  it("다른 쿼리는 남기고 t 만 지움 — /geo?x=1&t=…", async () => {
    const s = await setup();
    const res = await s.call(`${ORIGIN}/geo?x=1&t=${REVIEWER_TOKEN}&y=2`);
    expect(res.status).toBe(303);
    expect(abs(res.headers.get("location"))).toBe(`${ORIGIN}/geo?x=1&y=2`);
  });

  it("토큰 원문이 이동 주소 · 쿠키 · 본문 · 머리글 어디에도 남지 않음", async () => {
    const s = await setup();
    const res = await s.call(`${ORIGIN}/?t=${REVIEWER_TOKEN}`);
    const dump = JSON.stringify([...res.headers.entries()]) + (await res.text());
    expect(dump).not.toContain(REVIEWER_TOKEN);
  });

  it("owner 토큰 → 쿠키 30일", async () => {
    const s = await setup();
    const res = await s.call(`${ORIGIN}/?t=${OWNER_TOKEN}`);
    expect(res.status).toBe(303);
    expect((res.headers.get("set-cookie") ?? "").split(/;\s*/)).toContain("Max-Age=2592000");
  });

  it("받은 쿠키로 다음 요청은 통과 — 페이지는 자산에서 · 토큰이 다시 필요 없음", async () => {
    const s = await setup();
    const grant = await s.call(`${ORIGIN}/?t=${REVIEWER_TOKEN}`);
    const res = await s.call(`${ORIGIN}/geo`, { headers: { cookie: cookiePair(grant) } });
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("page");
    expect(res.headers.get("x-robots-tag")).toBe("noindex, nofollow");
    expect(s.assets).toHaveBeenCalledTimes(1);
  });

  it("쿠키가 이미 맞아도 ?t 가 오면 ?t 를 처리해 지움(주소에 토큰이 남지 않게)", async () => {
    const s = await setup();
    const res = await s.call(`${ORIGIN}/geo?t=${REVIEWER_TOKEN}`, { headers: { cookie: await cookieFor(REVIEWER_NAME) } });
    expect(res.status).toBe(303);
    expect(abs(res.headers.get("location"))).toBe(`${ORIGIN}/geo`);
  });
});

describe("③ 사용할 수 없는 링크 — 틀림 · 지움 · 기한 지남은 같은 화면 (작업 0326)", () => {
  it("틀린 토큰 · 지운 토큰 · 기한 지난 토큰 · 빈 값 · 아주 긴 값 → 401 · 본문이 완전히 같음 · 쿠키 없음 · 자산 · API 에 닿지 않음", async () => {
    const s = await setup();
    const bodies: string[] = [];
    for (const t of ["wrong-token", REMOVED_TOKEN, EXPIRED_TOKEN, "", "x".repeat(5000), "%00%01"]) {
      const res = await s.call(`${ORIGIN}/log?t=${t}`);
      expect(res.status, t.slice(0, 20)).toBe(401);
      expect(res.headers.get("set-cookie"), t.slice(0, 20)).toBeNull();
      expect(res.headers.get("x-robots-tag")).toBe("noindex, nofollow");
      bodies.push(await res.text());
    }
    expect(new Set(bodies).size, "어떤 경우든 같은 본문").toBe(1);
    expect(bodies[0]).toContain("사용할 수 없는 링크");
    expect(bodies[0]).toContain("이 링크는 더 이상 쓸 수 없습니다");
    expect(bodies[0]).toMatch(/<meta[^>]+name="robots"[^>]+noindex/i);
    expect(bodies[0]).toMatch(/href="https:\/\/flapfx\.com\/?"/);
    expect(s.assets).not.toHaveBeenCalled();
    expect(s.api).not.toHaveBeenCalled();
  });

  it("틀린 토큰 글을 화면에 되비치지 않음 (스크립트 주입 방지)", async () => {
    const s = await setup();
    const html = await (await s.call(`${ORIGIN}/?t=${encodeURIComponent('<script>alert(1)</script>')}`)).text();
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).not.toContain("alert(1)");
  });

  it("쿠키가 있는데 무효(서명 틀림 · 지운 이름 · 기한 지남 · 해시가 바뀜) → ③ 같은 본문 · 자산에 닿지 않음", async () => {
    const s = await setup();
    const invalidLink = await (await s.call(`${ORIGIN}/log?t=wrong`)).text();
    const list = await tokenList();
    const cookies = [
      await cookieFor(REVIEWER_NAME, { secret: `${SECRET}-other` }), // 다른 열쇠로 서명
      await cookieFor(REVIEWER_NAME, { expSec: Math.floor(Date.now() / 1000) - 10 }), // 만료
      await cookieFor(REVIEWER_NAME, { list: { ...list, [REVIEWER_NAME]: { hash: "f".repeat(64) } } }), // 목록의 해시가 달라짐(다시 만듦)
      `${COOKIE_NAME}=garbage`,
    ];
    for (const cookie of cookies) {
      const res = await s.call(`${ORIGIN}/log`, { headers: { cookie } });
      expect(res.status, cookie.slice(0, 30)).toBe(401);
      expect(await res.text(), "같은 본문").toBe(invalidLink);
    }
    // 목록에서 지운 이름
    const gone = await setup({ env: { ADMIN_TOKENS: JSON.stringify({ ...list, [REVIEWER_NAME]: undefined }) } });
    const goneCookie = await cookieFor(REVIEWER_NAME);
    const res = await gone.call(`${ORIGIN}/log`, { headers: { cookie: goneCookie } });
    expect(res.status).toBe(401);
    expect(await res.text()).toBe(invalidLink);
    expect(gone.assets).not.toHaveBeenCalled();
    expect(s.assets).not.toHaveBeenCalled();
  });

  it("기한이 지난 토큰의 쿠키도 무효 (전형이 끝난 토큰은 쿠키로도 못 들어옴)", async () => {
    const s = await setup();
    const res = await s.call(`${ORIGIN}/log`, { headers: { cookie: await cookieFor(EXPIRED_NAME) } });
    expect(res.status).toBe(401);
    expect(s.assets).not.toHaveBeenCalled();
  });
});

describe("/bff/* — 쿠키 없으면 401 (작업 0326)", () => {
  it("쿠키 없음 · 무효 → 401 JSON · API 를 부르지 않음", async () => {
    const s = await setup();
    for (const cookie of [undefined, `${COOKIE_NAME}=garbage`, await cookieFor(REVIEWER_NAME, { secret: "other-secret-0326" })]) {
      const res = await s.call(`${ORIGIN}/bff/activity`, { headers: cookie ? { cookie } : {} });
      expect(res.status).toBe(401);
      expect(res.headers.get("content-type")).toMatch(/json/);
      expect(await res.json()).toHaveProperty("error");
    }
    expect(s.api).not.toHaveBeenCalled();
  });

  it("쿠키가 맞으면 API 로 — 어드민 열쇠(x-admin-key)가 붙고 쿠키는 넘기지 않음", async () => {
    const s = await setup();
    const res = await s.call(`${ORIGIN}/bff/geo`, { headers: { cookie: await cookieFor(REVIEWER_NAME) } });
    expect(res.status).toBe(200);
    expect(s.api).toHaveBeenCalledTimes(1);
    const sent = s.calls[0]!;
    expect(new URL(sent.url).pathname).toBe("/geo");
    expect(sent.headers.get("x-admin-key")).toBe(API_KEY);
    expect(sent.headers.get("cookie")).toBeNull();
  });

  it("어드민 열쇠가 없으면(ADMIN_API_KEY 미등록) 머리글을 붙이지 않음 — 빈 값을 보내지 않음", async () => {
    const s = await setup({ env: { ADMIN_API_KEY: undefined } });
    await s.call(`${ORIGIN}/bff/geo`, { headers: { cookie: await cookieFor(REVIEWER_NAME) } });
    expect(s.calls[0]?.headers.get("x-admin-key")).toBeNull();
  });
});

describe("POST /login — 접힌 토큰 직접 입력 (작업 0326)", () => {
  it("맞는 토큰 → ?t 와 같은 303 · 이동 주소 / · 쿠키", async () => {
    const s = await setup();
    const res = await s.call(`${ORIGIN}/login`, form(REVIEWER_TOKEN));
    expect(res.status).toBe(303);
    expect(abs(res.headers.get("location"))).toBe(`${ORIGIN}/`);
    const c = res.headers.get("set-cookie") ?? "";
    expect(c.startsWith(`${COOKIE_NAME}=`)).toBe(true);
    expect(c.split(/;\s*/)).toContain("Max-Age=604800");
    expect(JSON.stringify([...res.headers.entries()])).not.toContain(REVIEWER_TOKEN);
  });

  it("틀린 · 지운 · 기한 지난 · 빈 토큰 → ③ 같은 본문 · 쿠키 없음", async () => {
    const s = await setup();
    const link = await (await s.call(`${ORIGIN}/?t=wrong`)).text();
    for (const t of ["wrong", REMOVED_TOKEN, EXPIRED_TOKEN, ""]) {
      const res = await s.call(`${ORIGIN}/login`, form(t));
      expect(res.status, t).toBe(401);
      expect(res.headers.get("set-cookie")).toBeNull();
      expect(await res.text()).toBe(link);
    }
  });

  it("form 이 아닌 본문 · token 칸이 없음 → ③ · 던지지 않음", async () => {
    const s = await setup();
    for (const init of [{ method: "POST", body: "x" }, { method: "POST", headers: { "content-type": "application/json" }, body: '{"token":"' + REVIEWER_TOKEN + '"}' }, { method: "POST" }] as RequestInit[]) {
      const res = await s.call(`${ORIGIN}/login`, init);
      expect(res.status).toBe(401);
      expect(res.headers.get("set-cookie")).toBeNull();
    }
  });

  it("owner 토큰 직접 입력 → 쿠키 30일", async () => {
    const s = await setup();
    const res = await s.call(`${ORIGIN}/login`, form(OWNER_TOKEN));
    expect((res.headers.get("set-cookie") ?? "").split(/;\s*/)).toContain("Max-Age=2592000");
  });
});

describe("/logout · /session (작업 0326)", () => {
  it("/logout — 쿠키를 Max-Age=0 으로 지움 · 303 · 이동 주소 / · 로그인 없이도", async () => {
    const s = await setup();
    for (const headers of [{ cookie: await cookieFor(REVIEWER_NAME) }, {}] as Record<string, string>[]) {
      const res = await s.call(`${ORIGIN}/logout`, { headers });
      expect(res.status).toBe(303);
      expect(abs(res.headers.get("location"))).toBe(`${ORIGIN}/`);
      const c = res.headers.get("set-cookie") ?? "";
      expect(c.startsWith(`${COOKIE_NAME}=;`)).toBe(true);
      expect(c.split(/;\s*/)).toContain("Max-Age=0");
      expect(res.headers.get("x-robots-tag")).toBe("noindex, nofollow");
    }
    expect(s.assets).not.toHaveBeenCalled();
  });

  it("/session — 쿠키가 맞으면 {name} · owner 도 · 자산 · API 를 부르지 않음", async () => {
    const s = await setup();
    for (const name of [REVIEWER_NAME, OWNER_NAME]) {
      const res = await s.call(`${ORIGIN}/session`, { headers: { cookie: await cookieFor(name) } });
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toMatch(/json/);
      expect(res.headers.get("cache-control")).toMatch(/no-store|private/);
      expect(await res.json()).toEqual({ name });
    }
    expect(s.assets).not.toHaveBeenCalled();
    expect(s.api).not.toHaveBeenCalled();
  });

  it("/session — 쿠키 없음 · 무효 → 401 JSON · name 을 알려 주지 않음", async () => {
    const s = await setup();
    for (const headers of [{}, { cookie: `${COOKIE_NAME}=garbage` }, { cookie: await cookieFor(EXPIRED_NAME) }] as Record<string, string>[]) {
      const res = await s.call(`${ORIGIN}/session`, { headers });
      expect(res.status).toBe(401);
      expect(await res.json()).not.toHaveProperty("name");
    }
  });
});

describe("접속 기록 — 남기지 않음 (작업 0403 추가 지시: '열람 기록이 남지 않도록' · 0326 의 기록은 없어짐)", () => {
  it("쿠키를 심을 때도 API 를 부르지 않음(이름 · IP · 기기 · 경로 어느 것도 안 보냄)", async () => {
    const s = await setup();
    const res = await s.call(`${ORIGIN}/?t=${REVIEWER_TOKEN}`, { headers: { "user-agent": "Mozilla/5.0 test", "cf-connecting-ip": "203.0.113.9" } });
    expect(res.status).toBe(303);
    expect(await s.visits()).toEqual([]);
    expect(s.calls).toHaveLength(0);
  });

  it("로그인한 페이지(HTML) 요청 때도 부르지 않음", async () => {
    const s = await setup();
    await s.call(`${ORIGIN}/geo`, { headers: { cookie: await cookieFor(REVIEWER_NAME) } });
    await s.call(`${ORIGIN}/how`, { headers: { cookie: await cookieFor(REVIEWER_NAME) } });
    expect(await s.visits()).toEqual([]);
    expect(s.calls).toHaveLength(0);
  });

  it("자산 · /bff · /session 요청은 기록하지 않음", async () => {
    const s = await setup();
    const cookie = await cookieFor(REVIEWER_NAME);
    for (const path of ["/_next/static/chunks/a.js", "/favicon.ico", "/bff/activity", "/session"]) await s.call(`${ORIGIN}${path}`, { headers: { cookie } });
    expect(await s.visits()).toEqual([]);
  });

  it("막힌 요청(쿠키 없음 · 무효 · 틀린 토큰)은 기록하지 않음", async () => {
    const s = await setup();
    await s.call(`${ORIGIN}/geo`);
    await s.call(`${ORIGIN}/geo`, { headers: { cookie: `${COOKIE_NAME}=garbage` } });
    await s.call(`${ORIGIN}/?t=wrong`);
    await s.call(`${ORIGIN}/login`, form("wrong"));
    expect(await s.visits()).toEqual([]);
  });

  it("owner 도 기록하지 않음 — 쿠키를 심을 때도 페이지 요청 때도", async () => {
    const s = await setup();
    await s.call(`${ORIGIN}/?t=${OWNER_TOKEN}`);
    await s.call(`${ORIGIN}/geo`, { headers: { cookie: await cookieFor(OWNER_NAME) } });
    expect(await s.visits()).toEqual([]);
  });

  it("API 가 오류여도 화면 · 쿠키는 그대로(기록을 부르지 않으니 영향 없음)", async () => {
    const s = await setup({ apiFails: true });
    const grant = await s.call(`${ORIGIN}/?t=${REVIEWER_TOKEN}`);
    expect(grant.status).toBe(303);
    expect(grant.headers.get("set-cookie")).toContain(COOKIE_NAME);
    const page = await s.call(`${ORIGIN}/geo`, { headers: { cookie: cookiePair(grant) } });
    expect(page.status).toBe(200);
  });
});
