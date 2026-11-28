// 작업 0403 — owner 응답에만 <html data-viewer="owner"> · HTML 응답은 Vary: Cookie (worker/viewer.ts · withViewer)
//   HTMLRewriter 는 Workers 전역이라 단위 테스트에서는 만드는 쪽(make)을 주입 — 진짜 변환은 Workers 에서만
//   약속: HTML 200 에만 손댐(다른 종류 · 다른 상태는 그대로) · 회사 세션은 Vary 만 · owner 는 Vary + html 요소에 data-viewer="owner" · 이미 있는 Vary 는 지우지 않고 더함 · 변환 도구가 없으면 표시 없이 그대로
import { afterEach, describe, expect, it, vi } from "vitest";
import { OWNER_NAME } from "./gate/session";
import { REVIEWER_NAME, cookieFor, gateEnv } from "./gate/test-kit";
import worker, { type Env } from "./index";
import { type RewriterFactory, withViewer } from "./viewer";

const HTML = '<!DOCTYPE html><html lang="ko"><head><title>x</title></head><body>page</body></html>';
const htmlRes = (init: ResponseInit & { status?: number } = {}) => new Response(HTML, { status: 200, ...init, headers: { "content-type": "text/html; charset=utf-8", ...(init.headers as Record<string, string> | undefined) } });

/** 주입용 가짜 변환 도구 — on(선택자).transform(응답) 이 불린 선택자 · 속성을 기록하고 html 글에 속성을 실제로 붙임 */
function fakeRewriter() {
  const calls: { selector: string; attrs: [string, string][] }[] = [];
  const make: RewriterFactory = () => {
    let selector = "";
    let handler: { element(el: { setAttribute(n: string, v: string): void }): void } | null = null;
    const self = {
      on(sel: string, h: { element(el: { setAttribute(n: string, v: string): void }): void }) {
        selector = sel;
        handler = h;
        return self;
      },
      transform(res: Response) {
        const attrs: [string, string][] = [];
        handler?.element({ setAttribute: (n, v) => attrs.push([n, v]) });
        calls.push({ selector, attrs });
        const out = new ReadableStream<Uint8Array>({
          async start(c) {
            const text = await res.text();
            c.enqueue(new TextEncoder().encode(selector === "html" ? text.replace("<html", `<html ${attrs.map(([n, v]) => `${n}="${v}"`).join(" ")}`) : text));
            c.close();
          },
        });
        return new Response(out, res);
      },
    };
    return self;
  };
  return { make, calls };
}

describe("withViewer — owner 에게만 data-viewer 표시", () => {
  it("owner + HTML 200 → html 요소에 data-viewer=owner · Vary: Cookie", async () => {
    const f = fakeRewriter();
    const res = withViewer(htmlRes(), true, f.make);
    expect(f.calls).toEqual([{ selector: "html", attrs: [["data-viewer", "owner"]] }]);
    expect(await res.text()).toContain('<html data-viewer="owner" lang="ko">');
    expect(res.headers.get("vary")).toContain("Cookie");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
  });

  it("회사 세션(owner 아님) + HTML 200 → 변환 도구를 쓰지 않음 · 본문 그대로 · Vary: Cookie 만", async () => {
    const f = fakeRewriter();
    const res = withViewer(htmlRes(), false, f.make);
    expect(f.calls).toEqual([]);
    expect(await res.text()).toBe(HTML);
    expect(res.headers.get("vary")).toContain("Cookie");
  });

  it("HTML 이 아닌 응답(스크립트 · JSON · RSC .txt) · 200 이 아닌 응답(301 · 304 · 404 · 500)은 owner 여도 그대로 — 표시도 Vary 도 안 붙임", async () => {
    const f = fakeRewriter();
    for (const [type, status] of [["application/javascript", 200], ["application/json", 200], ["text/plain; charset=utf-8", 200], ["text/html", 404], ["text/html", 301], ["text/html", 304], ["text/html", 500]] as const) {
      const src = new Response(status === 304 ? null : HTML, { status, headers: { "content-type": type } });
      const res = withViewer(src, true, f.make);
      expect(res, `${type} ${status}`).toBe(src);
      expect(res.headers.get("vary") ?? "", `${type} ${status}`).not.toContain("Cookie");
    }
    expect(f.calls).toEqual([]);
  });

  it("이미 있는 Vary 는 지우지 않고 Cookie 를 더함(Accept-Encoding 이 남음)", () => {
    for (const owner of [true, false]) {
      const res = withViewer(htmlRes({ headers: { vary: "Accept-Encoding" } }), owner, fakeRewriter().make);
      const vary = (res.headers.get("vary") ?? "").toLowerCase();
      expect(vary).toContain("accept-encoding");
      expect(vary).toContain("cookie");
    }
  });

  it("변환 도구가 없으면(Workers 밖) owner 여도 표시 없이 본문 그대로 · Vary 는 붙음", async () => {
    const res = withViewer(htmlRes(), true, null);
    expect(await res.text()).toBe(HTML);
    expect(res.headers.get("vary")).toContain("Cookie");
  });

  it("owner 가 보는 HTML 과 회사가 보는 HTML 이 서로 다름 — 같은 정적 파일에서 owner 쪽만 표시", async () => {
    const f = fakeRewriter();
    const own = await withViewer(htmlRes(), true, f.make).text();
    const co = await withViewer(htmlRes(), false, f.make).text();
    expect(own).toContain('data-viewer="owner"');
    expect(co).not.toContain("data-viewer");
  });
});

describe("어드민 Worker 를 거친 응답 — 세션에 따라 표시 (HTMLRewriter 는 가짜 전역)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  async function run(who: "owner" | "reviewer", path: string, contentType = "text/html; charset=utf-8") {
    // 가짜 HTMLRewriter 전역 — 진짜와 같은 모양(on · transform)
    vi.stubGlobal(
      "HTMLRewriter",
      class {
        private attrs: [string, string][] = [];
        on(_sel: string, h: { element(el: { setAttribute(n: string, v: string): void }): void }) {
          h.element({ setAttribute: (n, v) => this.attrs.push([n, v]) });
          return this;
        }
        transform(res: Response) {
          const attrs = this.attrs;
          return new Response(
            new ReadableStream<Uint8Array>({
              async start(c) {
                c.enqueue(new TextEncoder().encode((await res.text()).replace("<html", `<html ${attrs.map(([n, v]) => `${n}="${v}"`).join(" ")}`)));
                c.close();
              },
            }),
            res,
          );
        }
      },
    );
    const assets = vi.fn(async (_r: Request) => new Response(HTML, { status: 200, headers: { "content-type": contentType } }));
    const env: Env = { ASSETS: { fetch: assets }, API: { fetch: vi.fn(async () => Response.json({})) }, ...(await gateEnv()) };
    const cookie = await cookieFor(who === "owner" ? OWNER_NAME : REVIEWER_NAME);
    return worker.fetch(new Request(`https://admin.flapfx.com${path}`, { headers: { cookie } }), env, { waitUntil: () => undefined });
  }

  it("owner 가 /geo 를 열면 html 에 data-viewer=owner · Vary: Cookie · 검색 막음 머리글도 그대로", async () => {
    const res = await run("owner", "/geo");
    expect(await res.text()).toContain('data-viewer="owner"');
    expect(res.headers.get("vary")).toContain("Cookie");
    expect(res.headers.get("x-robots-tag")).toBe("noindex, nofollow");
  });

  it("owner 가 막힌 4개 화면(/log · /marketing · /traffic · /instagram)을 열어도 표시가 붙음", async () => {
    for (const p of ["/log", "/marketing", "/traffic", "/instagram"]) expect(await (await run("owner", p)).text(), p).toContain('data-viewer="owner"');
  });

  it("회사 세션이 /geo · /how 를 열면 표시 없음 · Vary: Cookie 는 붙음(브라우저 캐시가 세션을 섞지 않게)", async () => {
    for (const p of ["/geo", "/how"]) {
      const res = await run("reviewer", p);
      const body = await res.text();
      expect(body, p).not.toContain("data-viewer");
      expect(res.headers.get("vary") ?? "", p).toContain("Cookie");
    }
  });

  it("HTML 이 아닌 정적 파일(/_next 스크립트 · RSC .txt)은 owner 여도 표시 없음", async () => {
    const js = await run("owner", "/_next/static/chunk.js", "application/javascript");
    expect(await js.text()).not.toContain("data-viewer");
    const txt = await run("owner", "/how/index.txt", "text/plain; charset=utf-8");
    expect(await txt.text()).not.toContain("data-viewer");
  });
});
