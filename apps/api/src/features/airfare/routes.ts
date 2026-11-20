// 항공권 출발일 달력 API — 읽기 전용 (쓰기 · 수집 경로 없음 · 수집은 예약 실행만) · 작업 0234
import type { AirfareCalendar } from "@hav/shared/airfare";
import { Hono } from "hono";
import { cached } from "../../db/cache";
import type { Env } from "../../env";
import { readAirfareCalendar } from "./store";

export const airfareRoutes = new Hono<{ Bindings: Env }>().get("/calendar", cached(), async (c) => {
  const body: AirfareCalendar = await readAirfareCalendar(c.env.DB);
  return c.json(body);
});
