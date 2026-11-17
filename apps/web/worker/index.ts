// 사이트 Worker 진입점 (작업 0189) — Cloudflare Workers(flapfx)로 배포할 때 Pages Functions(functions/) 자리를 대신함
//   /bff · /bff/* → API Worker 프록시 (src/bff/proxy.ts · 서비스 바인딩 API)
//   그 밖(페이지) → 정적 자산을 그대로 돌려주고, GEO 방문 기록은 뒤에서 (src/bff/track-visit.ts · D1 DB)
//   어떤 요청이 여기를 지나는지는 routes.ts → wrangler.jsonc assets.run_worker_first
// 타입은 필요한 모양만 직접 적음 (새 의존성 없음)
import { type ApiBinding, BFF_PREFIX, handleBff } from "../src/bff/proxy";
import { type TrackDb, trackVisit } from "../src/bff/track-visit";

export type AssetsBinding = { fetch(request: Request): Promise<Response> };

export type Env = { ASSETS: AssetsBinding; API: ApiBinding; DB?: TrackDb };

export type ExecutionContextLike = { waitUntil(promise: Promise<unknown>): void };

const isBff = (pathname: string) => pathname === BFF_PREFIX || pathname.startsWith(`${BFF_PREFIX}/`);

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContextLike): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (isBff(pathname)) return handleBff(request, env.API);
    return trackVisit({
      request,
      env,
      next: () => env.ASSETS.fetch(request),
      waitUntil: (p) => ctx.waitUntil(p),
    });
  },
};
