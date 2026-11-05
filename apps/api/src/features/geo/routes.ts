// GEO 측정 API — 읽기만 · 1시간 구간 캐시 (보는 사람 수와 상관없이 D1 은 구간마다 한 번 · 작업 0129)
import { kstDate } from "@hav/shared/date";
import { Hono } from "hono";
import { cached } from "../../db/cache";
import type { Env } from "../../env";
import { geoRows, gscRows } from "./store";
import { geoReport, searchSummary } from "./summary";

const DAYS = 30;

export const geoRoutes = new Hono<{ Bindings: Env }>().get("/", cached({ bucketMs: 3600_000 }), async (c) => {
  const since = kstDate(new Date(Date.now() - DAYS * 86400_000));
  const [rows, gsc] = await Promise.all([geoRows(c.env.DB, since), gscRows(c.env.DB)]);
  return c.json(geoReport(rows, since, searchSummary(gsc)));
});
