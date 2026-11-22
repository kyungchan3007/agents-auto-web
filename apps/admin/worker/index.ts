// 어드민 Worker 진입점 (작업 0312) — Cloudflare Workers(flapfx-admin · admin.flapfx.com)
//   모든 요청이 여기를 지남(wrangler.jsonc run_worker_first: true) — 모든 응답에 검색 막음 머리글 · 방문 기록은 하지 않음
//   주소 나누기 host.ts · /bff/* → API Worker 프록시 (@hav/edge/bff · 경로표 bff-routes.ts · 서비스 바인딩 API)
import { type ApiBinding, handleBff, isBff } from "@hav/edge/bff";
import { robotsDisallowAll, withNoindex } from "@hav/edge/noindex";
import { ADMIN_BFF_ROUTES } from "./bff-routes";
import { hostRoute } from "./host";

export type AssetsBinding = { fetch(request: Request): Promise<Response> };

export type Env = { ASSETS: AssetsBinding; API: ApiBinding };

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const route = hostRoute(url);
    if (route.kind === "robots") return robotsDisallowAll();
    if (route.kind === "redirect") return withNoindex(Response.redirect(route.location, route.status));
    const res = isBff(url.pathname) ? await handleBff(request, env.API, ADMIN_BFF_ROUTES) : await env.ASSETS.fetch(request);
    return withNoindex(res);
  },
};
