// 시계열 API — 읽기 전용 (쓰기 · 수집 경로 없음 · 수집은 예약 실행만) · 작업 0163
import { IndicatorParam, IndicatorQuery, type IndicatorSeries } from "@hav/shared/indicators";
import { Hono } from "hono";
import { cached } from "../../db/cache";
import type { Env } from "../../env";
import { validate } from "../../validate";
import { recentPoints } from "./store";

export const indicatorRoutes = new Hono<{ Bindings: Env }>().get("/:series", validate("param", IndicatorParam), validate("query", IndicatorQuery), cached(), async (c) => {
  const { series } = c.req.valid("param");
  const { limit } = c.req.valid("query");
  const body: IndicatorSeries = { series, points: await recentPoints(c.env.DB, series, limit) };
  return c.json(body);
});
