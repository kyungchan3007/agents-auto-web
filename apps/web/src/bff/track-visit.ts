// GEO 방문 기록 — Pages 함수(functions/_middleware.ts)가 부름 · 응답을 먼저 만들고 기록은 뒤에서 (작업 0129)
//   실패해도 페이지는 그대로 · 일반 방문은 저장하지 않음 · 저장하는 것은 classifyVisit 결과뿐
import { kstDate } from "@hav/shared/kst";
import { classifyVisit } from "@hav/shared/geo-visit";

const UPSERT = "insert into geo_hits (day, kind, name, path, hits) values (?, ?, ?, ?, 1) on conflict (day, kind, name, path) do update set hits = hits + 1";

export type TrackDb = { prepare(sql: string): { bind(...v: unknown[]): { run(): Promise<unknown> } } };

export async function trackVisit(ctx: { request: Request; next: () => Promise<Response>; env: { DB?: TrackDb }; waitUntil: (p: Promise<unknown>) => void }, now: Date = new Date()): Promise<Response> {
  const res = await ctx.next();
  try {
    const { request, env } = ctx;
    if (!env.DB || !res.ok || (request.method !== "GET" && request.method !== "HEAD")) return res;
    const visit = classifyVisit({ pathname: new URL(request.url).pathname, userAgent: request.headers.get("user-agent"), referer: request.headers.get("referer") });
    if (visit) {
      const write = env.DB.prepare(UPSERT).bind(kstDate(now), visit.kind, visit.name, visit.path).run();
      ctx.waitUntil(write.catch(() => undefined));
    }
  } catch {
    // 기록 실패는 응답에 영향을 주지 않음
  }
  return res;
}
