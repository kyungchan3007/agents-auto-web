// Pages Functions — 페이지 요청마다 GEO 방문 기록 · 로직은 apps/web/src/bff/track-visit.ts (테스트 있음)
// 어떤 경로가 여기를 지나는지는 apps/web/public/_routes.json (이미지 · 스크립트는 지나지 않음)
import { type TrackDb, trackVisit } from "../apps/web/src/bff/track-visit";

type Context = { request: Request; next: () => Promise<Response>; env: { DB?: TrackDb }; waitUntil: (p: Promise<unknown>) => void };

export const onRequest = (ctx: Context) => trackVisit(ctx);
