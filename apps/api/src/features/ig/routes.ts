// 인스타 성과 API — 읽기만 · 1시간 구간 캐시 (보는 사람 수와 상관없이 D1 은 구간마다 한 번 · 작업 0323)
import { kstDate } from "@hav/shared/date";
import { Hono } from "hono";
import { cached } from "../../db/cache";
import type { Env } from "../../env";
import { igRows } from "./store";
import { igReport } from "./summary";

const DAYS = 90;

export const igRoutes = new Hono<{ Bindings: Env }>().get("/", cached({ bucketMs: 3600_000 }), async (c) => {
  const since = kstDate(new Date(Date.now() - DAYS * 86400_000));
  const r = await igRows(c.env.DB, since);
  return c.json(igReport(r.media, r.mediaInsights, r.accountInsights));
});
