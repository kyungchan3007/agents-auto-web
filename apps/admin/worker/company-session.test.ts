// 작업 0403 — 회사 링크(owner 가 아닌 세션)는 GEO 측정(/geo) · 만드는 방식(/how) 두 화면만 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   worker(apps/admin/worker/index.ts · gate/gate.ts · host.ts) 약속
//     회사 세션 = 로그인한 이름이 OWNER_NAME 이 아닌 세션(리뷰어 토큰)
//     막힌 화면 경로 /log · /marketing · /traffic · /instagram — 하위 · 끝 슬래시 · .html · .txt(RSC) · index 변형 · ?_rsc 모두 → 302 /geo (자산 · API 를 부르지 않음)
//     막힌 BFF /bff/activity · /bff/tasks · /bff/ga4 · /bff/ig → 403 (API 를 부르지 않음) · /bff/geo · /bff/status 같은 나머지는 그대로(/bff/admin-visits 는 지금처럼 404)
//     / → 302 /geo (owner 는 지금처럼 / → /log) · ?t= 로 쿠키를 심은 뒤 이동 주소: 회사 세션이고 막힌 경로 또는 / 이면 /geo · 그 밖은 ?t 만 지운 같은 주소
//     owner 는 전부 통과 · 접속 기록(처음 · 마지막 시각)은 그대로(회사 세션만 · 쿠키 심을 때 한 번 · 화면 200 일 때)
import { describe, expect, it, vi } from "vitest";
import { OWNER_NAME } from "./gate/session";
import { OWNER_TOKEN, REVIEWER_NAME, REVIEWER_TOKEN, cookieFor, gateEnv } from "./gate/test-kit";
import worker, { type Env } from "./index";

const ADMIN = "https://admin.flapfx.com";
const PREVIEW = "https://flapfx-admin.example.workers.dev";

async function setup() {
  const assets = vi.fn(async (_r: Request) => new Response("<html>page</html>", { status: 200 }));
  const api = vi.fn(async (_r: Request) => Response.json({ ok: true }));
  const env: Env = { ASSETS: { fetch: assets }, API: { fetch: api }, ...(await gateEnv()) };
  const waits: Promise<unknown>[] = [];
  const ctx = { waitUntil: (p: Promise<unknown>) => void waits.push(p) };
  const reviewer = await cookieFor(REVIEWER_NAME);
  const owner = await cookieFor(OWNER_NAME);
  const call = (who: "reviewer" | "owner", url: string, init: RequestInit = {}) =>
    worker.fetch(new Request(url, { ...init, redirect: "manual", headers: { cookie: who === "owner" ? owner : reviewer } }), env, ctx);
  const visitCalls = async () => {
    await Promise.all(waits);
    return api.mock.calls.filter(([r]) => new URL(r.url).pathname === "/admin-visits" && r.method === "POST");
  };
  return { env, assets, api, call, visitCalls };
}

const loc = (res: Response) => (res.headers.get("location") ? new URL(res.headers.get("location") as string) : null);

/** 막힌 화면 하나당 변형 — 끝 슬래시 · .html · .txt(RSC) · index · ?_rsc · 하위 */
const variants = (base: string) => [
  base,
  `${base}/`,
  `${base}.html`,
  `${base}.txt`,
  `${base}/index.html`,
  `${base}/index.txt`,
  `${base}?_rsc=abc12`,
  `${base}/?_rsc=abc12`,
  `${base}/sub`,
  `${base}/sub/deep.txt`,
  `${base}?x=1&y=2`,
];
const BLOCKED_PAGES = ["/log", "/marketing", "/traffic", "/instagram"];
const BLOCKED_BFF = ["/bff/activity", "/bff/tasks", "/bff/ga4", "/bff/ig"];

describe("회사 세션 — 막힌 화면 4개와 변형은 302 /geo", () => {
  for (const base of BLOCKED_PAGES) {
    it(`${base} · 변형 ${variants(base).length}개 → 302 /geo · 자산 · API 를 부르지 않음`, async () => {
      const s = await setup();
      for (const p of variants(base)) {
        const res = await s.call("reviewer", `${ADMIN}${p}`);
        expect(res.status, p).toBe(302);
        expect(loc(res)?.pathname, p).toBe("/geo");
        expect(loc(res)?.origin, p).toBe(ADMIN);
        expect(res.headers.get("x-robots-tag"), p).toBe("noindex, nofollow");
      }
      expect(s.assets).not.toHaveBeenCalled();
      expect(s.api).not.toHaveBeenCalled();
    });
  }

  it("미리보기 주소(workers.dev)에서도 같음 · 대소문자 · 점 조각 변형 · 비슷한 이름(/logs · /logo)은 막지 않음", async () => {
    const s = await setup();
    for (const base of BLOCKED_PAGES) {
      const res = await s.call("reviewer", `${PREVIEW}${base}`);
      expect(res.status, base).toBe(302);
      expect(loc(res)?.origin).toBe(PREVIEW);
      expect(loc(res)?.pathname).toBe("/geo");
    }
    // 점 조각 — 브라우저가 정리해 /log 로 오는 주소 (URL 정규화 뒤에도 막힘)
    for (const p of ["/geo/../log", "/./log", "/log/."]) {
      const res = await s.call("reviewer", `${ADMIN}${p}`);
      expect(res.status, p).toBe(302);
      expect(loc(res)?.pathname, p).toBe("/geo");
    }
    // 이름만 비슷한 경로는 이 막음의 대상이 아님(기존 규칙대로 — 어드민 화면이 아니라 운영 주소 301 등)
    for (const p of ["/logs", "/logo.svg", "/marketingx", "/trafficjam", "/instagrams"]) {
      const res = await s.call("reviewer", `${ADMIN}${p}`);
      expect(loc(res)?.pathname === "/geo" && res.status === 302, `${p} 는 /geo 로 보내지 않음`).toBe(false);
    }
  });
});

describe("회사 세션 — 막힌 BFF 4개는 403", () => {
  for (const p of BLOCKED_BFF) {
    it(`${p} → 403 · API 를 부르지 않음(쿼리 · 하위 변형 포함)`, async () => {
      const s = await setup();
      for (const q of [p, `${p}?x=1`, `${p}/`]) {
        const res = await s.call("reviewer", `${ADMIN}${q}`);
        expect(res.status, q).toBe(403);
        expect(res.headers.get("x-robots-tag"), q).toBe("noindex, nofollow");
      }
      expect(s.api).not.toHaveBeenCalled();
      expect(s.assets).not.toHaveBeenCalled();
    });
  }

  it("접속 기록(/bff/admin-visits)은 회사 세션에 지금처럼 404 — 403 이 아님(다른 회사 이름이 드러나지 않게)", async () => {
    const s = await setup();
    expect((await s.call("reviewer", `${ADMIN}/bff/admin-visits`)).status).toBe(404);
    expect(s.api).not.toHaveBeenCalled();
  });
});

describe("회사 세션 — /geo · /how 와 그 BFF 는 그대로 통과", () => {
  for (const p of ["/geo", "/geo/", "/geo.html", "/geo.txt", "/geo?_rsc=a", "/how", "/how/", "/how.html", "/how.txt", "/how/index.txt"]) {
    it(`${p} → 자산 200 (리다이렉트 없음)`, async () => {
      const s = await setup();
      const res = await s.call("reviewer", `${ADMIN}${p}`);
      expect(res.status).toBe(200);
      expect(await res.text()).toBe("<html>page</html>");
      expect(s.assets).toHaveBeenCalledTimes(1);
    });
  }

  it("/bff/geo → API 로 전달(막지 않음) · 쓰기 요청 405 는 지금처럼", async () => {
    const s = await setup();
    const res = await s.call("reviewer", `${ADMIN}/bff/geo`);
    expect(res.status).toBe(200);
    expect(s.api).toHaveBeenCalledTimes(1);
    expect(new URL(s.api.mock.calls[0]![0].url).pathname).toBe("/geo");
    expect((await s.call("reviewer", `${ADMIN}/bff/geo`, { method: "POST" })).status).toBe(405);
  });

  it("정적 자산(/_next/…) · 로그아웃 · 세션 확인(/session)은 막히지 않음", async () => {
    const s = await setup();
    expect((await s.call("reviewer", `${ADMIN}/_next/static/chunk.js`)).status).toBe(200);
    const session = await s.call("reviewer", `${ADMIN}/session`);
    expect(session.status).toBe(200);
    expect(await session.json()).toEqual({ name: REVIEWER_NAME });
    expect((await s.call("reviewer", `${ADMIN}/logout`)).status).toBe(303);
  });
});

describe("회사 세션 — / 는 /geo", () => {
  it("/ → 302 /geo (admin 주소 · 미리보기 주소 · 쿼리가 있어도)", async () => {
    const s = await setup();
    for (const u of [`${ADMIN}/`, `${PREVIEW}/`, `${ADMIN}/?x=1`]) {
      const res = await s.call("reviewer", u);
      expect(res.status, u).toBe(302);
      expect(loc(res)?.pathname, u).toBe("/geo");
    }
    expect(s.assets).not.toHaveBeenCalled();
  });
});

describe("owner — 전부 통과 · / → /log", () => {
  for (const base of BLOCKED_PAGES) {
    it(`${base} · 변형은 자산으로(리다이렉트 없음)`, async () => {
      const s = await setup();
      for (const p of [base, `${base}/`, `${base}.html`, `${base}.txt`, `${base}?_rsc=abc12`, `${base}/index.txt`]) {
        const res = await s.call("owner", `${ADMIN}${p}`);
        expect(res.status, p).toBe(200);
        expect(res.headers.get("location"), p).toBeNull();
      }
      expect(s.assets).toHaveBeenCalledTimes(6);
    });
  }

  it("막힌 BFF 4개 · /bff/geo · 접속 기록 모두 API 로 전달", async () => {
    const s = await setup();
    for (const p of [...BLOCKED_BFF, "/bff/geo", "/bff/admin-visits"]) {
      const res = await s.call("owner", `${ADMIN}${p}`);
      expect(res.status, p).toBe(200);
    }
    expect(s.api).toHaveBeenCalledTimes(BLOCKED_BFF.length + 2);
  });

  it("/ → 302 /log (지금처럼) · owner 는 접속 기록을 남기지 않음", async () => {
    const s = await setup();
    for (const u of [`${ADMIN}/`, `${PREVIEW}/`]) {
      const res = await s.call("owner", u);
      expect(res.status, u).toBe(302);
      expect(loc(res)?.pathname, u).toBe("/log");
    }
    await s.call("owner", `${ADMIN}/log`);
    expect(await s.visitCalls()).toHaveLength(0);
  });
});

describe("?t= 로 들어올 때 — 쿠키를 심은 뒤 이동 주소", () => {
  const grant = async (who: "reviewer" | "owner", path: string) => {
    const s = await setup();
    const token = who === "owner" ? OWNER_TOKEN : REVIEWER_TOKEN;
    const sep = path.includes("?") ? "&" : "?";
    const res = await worker.fetch(new Request(`${ADMIN}${path}${sep}t=${token}`, { redirect: "manual" }), s.env, { waitUntil: () => undefined });
    return { res, s };
  };

  it("회사 토큰 + 막힌 경로(주소에 /log 등이 들어 있음) → 쿠키를 심고 303 /geo", async () => {
    for (const p of ["/log", "/log/", "/log.html", "/marketing", "/traffic", "/instagram", "/log/sub?a=1", "/traffic?_rsc=1"]) {
      const { res } = await grant("reviewer", p);
      expect(res.status, p).toBe(303);
      expect(res.headers.get("set-cookie"), p).toContain("__Host-admin=");
      expect(loc(res)?.pathname, p).toBe("/geo");
      expect(loc(res)?.searchParams.has("t"), `${p}: 토큰이 주소에 남지 않음`).toBe(false);
    }
  });

  it("회사 토큰 + / → 303 /geo", async () => {
    const { res } = await grant("reviewer", "/");
    expect(res.status).toBe(303);
    expect(res.headers.get("set-cookie")).toContain("__Host-admin=");
    expect(loc(res)?.pathname).toBe("/geo");
  });

  it("회사 토큰 + /geo · /how → 그 화면 그대로(?t 만 지움 · 다른 쿼리는 남김)", async () => {
    const a = await grant("reviewer", "/geo");
    expect(loc(a.res)?.pathname).toBe("/geo");
    const b = await grant("reviewer", "/how?x=1");
    expect(loc(b.res)?.pathname).toBe("/how");
    expect(loc(b.res)?.searchParams.get("x")).toBe("1");
    expect(loc(b.res)?.searchParams.has("t")).toBe(false);
  });

  it("owner 토큰은 이동 주소를 바꾸지 않음 — 막힌 경로도 그 화면 · / 는 / (그 뒤 host 규칙으로 /log)", async () => {
    for (const p of ["/log", "/marketing", "/traffic", "/instagram"]) {
      const { res } = await grant("owner", p);
      expect(res.status, p).toBe(303);
      expect(loc(res)?.pathname, p).toBe(p);
    }
    const root = await grant("owner", "/");
    expect(loc(root.res)?.pathname).toBe("/");
  });

  it("접속 기록은 그대로 — 회사 토큰이 쿠키를 심을 때 이름만 한 번 보냄 · owner 는 안 보냄", async () => {
    const s = await setup();
    const waits: Promise<unknown>[] = [];
    const ctx = { waitUntil: (p: Promise<unknown>) => void waits.push(p) };
    await worker.fetch(new Request(`${ADMIN}/log?t=${REVIEWER_TOKEN}`, { redirect: "manual" }), s.env, ctx);
    await Promise.all(waits);
    const posts = s.api.mock.calls.filter(([r]) => new URL(r.url).pathname === "/admin-visits");
    expect(posts).toHaveLength(1);
    expect(await posts[0]![0].json()).toEqual({ name: REVIEWER_NAME });
    const s2 = await setup();
    const waits2: Promise<unknown>[] = [];
    await worker.fetch(new Request(`${ADMIN}/log?t=${OWNER_TOKEN}`, { redirect: "manual" }), s2.env, { waitUntil: (p) => void waits2.push(p) });
    await Promise.all(waits2);
    expect(s2.api).not.toHaveBeenCalled();
  });

  it("틀린 토큰은 지금처럼 안내 화면(쿠키 없음 · /geo 로 보내지 않음)", async () => {
    const s = await setup();
    const res = await worker.fetch(new Request(`${ADMIN}/log?t=wrong-token-0403`, { redirect: "manual" }), s.env, { waitUntil: () => undefined });
    expect(res.headers.get("set-cookie")).toBeNull();
    expect(res.status).not.toBe(303);
  });
});

describe("접속 기록 — 화면 200 일 때만 회사 세션 이름을 남김(그대로)", () => {
  it("/geo · /how 를 열면 한 번씩 · 막혀 302 가 된 요청은 남기지 않음", async () => {
    const s = await setup();
    await s.call("reviewer", `${ADMIN}/geo`);
    await s.call("reviewer", `${ADMIN}/how`);
    await s.call("reviewer", `${ADMIN}/log`);
    const posts = await s.visitCalls();
    expect(posts).toHaveLength(2);
    for (const [r] of posts) expect(await r.clone().json()).toEqual({ name: REVIEWER_NAME });
  });
});
