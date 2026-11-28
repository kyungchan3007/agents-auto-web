// 어드민 Worker 진입점 (작업 0312 · 0326) — Cloudflare Workers(flapfx-admin · admin.flapfx.com)
//   모든 요청이 여기를 지남(wrangler.jsonc run_worker_first: true)
//   0326: robots.txt 말고는 입구 판정(gate/gate.ts · 토큰 쿠키)이 먼저 — 통과하면 주소 나누기 host.ts · /bff/* → API Worker (@hav/edge/bff · 어드민 열쇠 붙임)
//   모든 응답에 검색 막음 머리글 · 접속 기록은 토큰 이름의 처음 · 마지막 시각만(owner 제외)
//   0403: 회사 링크는 owner 전용 화면 · 자료를 못 엶(gate/owner-only.ts 한 표) · / → /geo
//   0339: 접속 기록 읽기(/bff/admin-visits)는 owner 만 · 다른 토큰은 404(다른 회사 이름이 드러나지 않게)
import { type ApiBinding, handleBff, isBff } from "@hav/edge/bff";
import { robotsDisallowAll, withNoindex } from "@hav/edge/noindex";
import { ADMIN_BFF_ROUTES } from "./bff-routes";
import { type GateEnv, runGate } from "./gate/gate";
import { COMPANY_HOME, isOwnerOnlyBff, isOwnerOnlyPage } from "./gate/owner-only";
import { OWNER_NAME } from "./gate/session";
import { hostRoute, isAsset } from "./host";

/** 본인만 읽는 BFF 경로 — 접속 기록 */
const OWNER_ONLY_BFF = "/bff/admin-visits";

export type AssetsBinding = { fetch(request: Request): Promise<Response> };

export type Env = { ASSETS: AssetsBinding; API: ApiBinding } & GateEnv;
export type Ctx = { waitUntil(promise: Promise<unknown>): void };

/** 접속 기록 — 이름만 보냄(IP · 기기 · 경로 · 쿠키 없음) · 실패해도 화면은 그대로 */
function recordVisit(env: Env, ctx: Ctx | undefined, name: string): void {
  const key = env.ADMIN_API_KEY;
  if (name === OWNER_NAME || !key) return;
  const task = Promise.resolve()
    .then(() => env.API.fetch(new Request("https://api/admin-visits", { method: "POST", headers: { "content-type": "application/json", "x-admin-key": key }, body: JSON.stringify({ name }) })))
    .catch(() => undefined);
  ctx?.waitUntil(task);
}

export default {
  async fetch(request: Request, env: Env, ctx?: Ctx): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/robots.txt") return robotsDisallowAll();

    const gate = await runGate(request, url, env, (name) => recordVisit(env, ctx, name));
    if (gate.response) return withNoindex(gate.response);

    // 회사 링크(owner 아님): 첫 화면 → /geo · 막힌 화면 → 302 /geo · 막힌 BFF → 403 (경로 표: gate/owner-only.ts · 작업 0403)
    if (gate.name !== OWNER_NAME) {
      if (url.pathname === "/" || isOwnerOnlyPage(url.pathname)) return withNoindex(Response.redirect(`${url.origin}${COMPANY_HOME}`, 302));
      if (isOwnerOnlyBff(url.pathname)) return withNoindex(new Response(null, { status: 403 }));
    }

    const route = hostRoute(url);
    if (route.kind === "robots") return robotsDisallowAll();
    if (route.kind === "redirect") return withNoindex(Response.redirect(route.location, route.status));
    if (url.pathname === OWNER_ONLY_BFF && gate.name !== OWNER_NAME) return withNoindex(new Response(null, { status: 404 }));
    if (isBff(url.pathname)) return withNoindex(await handleBff(request, env.API, ADMIN_BFF_ROUTES, { apiKey: env.ADMIN_API_KEY }));
    const res = await env.ASSETS.fetch(request);
    if (res.status === 200 && !isAsset(url.pathname)) recordVisit(env, ctx, gate.name);
    return withNoindex(res);
  },
};
