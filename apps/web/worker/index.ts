// 사이트 Worker 진입점 (작업 0189) — Cloudflare Workers(agents-auto-web · flapfx.com · admin.flapfx.com)로 배포 · 예전 Pages Functions 자리
//   주소(host)로 먼저 나눔 (host.ts · 작업 0302) — 어드민 주소 · 옛 /log · /geo 넘기기
//   /bff · /bff/* → API Worker 프록시 (src/bff/proxy.ts · 서비스 바인딩 API)
//   그 밖(페이지) → 정적 자산을 그대로 돌려주고, GEO 방문 기록은 뒤에서 (src/bff/track-visit.ts · D1 DB) · 어드민 주소는 기록 안 함
//   어떤 요청이 여기를 지나는지는 routes.ts → wrangler.jsonc assets.run_worker_first
// 타입은 필요한 모양만 직접 적음 (새 의존성 없음)
import { type ApiBinding, BFF_PREFIX, handleBff } from "../src/bff/proxy";
import { type TrackDb, trackVisit } from "../src/bff/track-visit";
import { ADMIN_ROBOTS, hostRoute, NOINDEX, withNoindex } from "./host";

export type AssetsBinding = { fetch(request: Request): Promise<Response> };

export type Env = { ASSETS: AssetsBinding; API: ApiBinding; DB?: TrackDb };

export type ExecutionContextLike = { waitUntil(promise: Promise<unknown>): void };

const isBff = (pathname: string) => pathname === BFF_PREFIX || pathname.startsWith(`${BFF_PREFIX}/`);

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContextLike): Promise<Response> {
    const url = new URL(request.url);
    const route = hostRoute(url);
    if (route.kind === "redirect") return Response.redirect(route.location, route.status);
    if (route.kind === "robots") {
      return new Response(ADMIN_ROBOTS, { headers: { "content-type": "text/plain; charset=utf-8", "X-Robots-Tag": NOINDEX } });
    }
    if (route.kind === "admin") {
      const res = isBff(url.pathname) ? await handleBff(request, env.API) : await env.ASSETS.fetch(request);
      return withNoindex(res);
    }
    if (isBff(url.pathname)) return handleBff(request, env.API);
    return trackVisit({
      request,
      env,
      next: () => env.ASSETS.fetch(request),
      waitUntil: (p) => ctx.waitUntil(p),
    });
  },
};
