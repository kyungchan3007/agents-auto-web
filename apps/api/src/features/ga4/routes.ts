// GA4 유입 API — 읽기만 · 1시간 구간 캐시 (보는 사람 수와 상관없이 D1 은 구간마다 한 번 · 작업 0324)
import { kstDate } from "@hav/shared/date";
import { Hono } from "hono";
import { cached } from "../../db/cache";
import type { Env } from "../../env";
import { engagementSnapshots, ga4Rows } from "./store";
import { ga4Report } from "./summary";

const DAYS = 40; // 매일 읽는 28일 + 여유

export const ga4Routes = new Hono<{ Bindings: Env }>().get("/", cached({ bucketMs: 3600_000 }), async (c) => {
  const since = kstDate(new Date(Date.now() - DAYS * 86400_000));
  const [r, snapshots] = await Promise.all([ga4Rows(c.env.DB, since), engagementSnapshots(c.env.DB)]);
  return c.json(ga4Report(r.daily, r.sources, r.pages, snapshots));
});
