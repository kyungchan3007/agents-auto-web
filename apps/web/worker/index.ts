// 운영 사이트 Worker 진입점 (작업 0189 · 0312) — Cloudflare Workers(agents-auto-web · flapfx.com)로 배포 · 예전 Pages Functions 자리
//   옛 어드민 경로 → admin.flapfx.com 301 (host.ts · 어드민은 apps/admin 이 따로 배포)
//   /bff · /bff/* → API Worker 프록시 (@hav/edge/bff · 경로표 bff-routes.ts · 서비스 바인딩 API)
//   그 밖(페이지) → 정적 자산을 그대로 돌려주고, GEO 방문 기록은 뒤에서 (src/bff/track-visit.ts · D1 DB)
//   어떤 요청이 여기를 지나는지는 routes.ts → wrangler.jsonc assets.run_worker_first
// 타입은 필요한 모양만 직접 적음 (새 의존성 없음)
import { type ApiBinding, handleBff, isBff } from "@hav/edge/bff";
import { type TrackDb, trackVisit } from "../src/bff/track-visit";
import { WEB_BFF_ROUTES } from "./bff-routes";
import { hostRoute } from "./host";

export type AssetsBinding = { fetch(request: Request): Promise<Response> };

export type Env = { ASSETS: AssetsBinding; API: ApiBinding; DB?: TrackDb };

export type ExecutionContextLike = { waitUntil(promise: Promise<unknown>): void };

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContextLike): Promise<Response> {
    const url = new URL(request.url);
    const route = hostRoute(url);
    if (route.kind === "redirect") return Response.redirect(route.location, route.status);
    if (isBff(url.pathname)) return handleBff(request, env.API, WEB_BFF_ROUTES);
    return trackVisit({
      request,
      env,
      next: () => env.ASSETS.fetch(request),
      waitUntil: (p) => ctx.waitUntil(p),
    });
  },
};
