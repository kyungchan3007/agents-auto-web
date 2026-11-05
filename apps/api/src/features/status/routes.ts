// 사이트 상태 API — 작업실 페이지 점검판 (작업 0105)
//   계산 한 번에 D1 약 45줄 · 열어 둔 화면마다 받으면 사람 수만큼 늘어서 5분 구간 캐시 (구간마다 한 번만 계산 · 나머지는 한 줄)
//   새 환율을 저장하면 캐시가 비워져 바로 반영 · 실패한 수집은 최대 5분 늦게 보임
import type { SiteStatus } from "@hav/shared/status";
import { kstDate } from "@hav/shared/date";
import { Hono } from "hono";
import { cached } from "../../db/cache";
import type { Env } from "../../env";
import { type Slot, siteStatus } from "./status";
import { statusRows } from "./store";

export const STATUS_BUCKET_MS = 5 * 60_000;

export const statusRoutes = (slots: Slot[]) =>
  new Hono<{ Bindings: Env }>().get("/", cached({ bucketMs: STATUS_BUCKET_MS }), async (c) => {
    const now = new Date();
    const r = await statusRows(c.env.DB, kstDate(now));
    const body: SiteStatus = siteStatus({ now, slots, ...r });
    return c.json(body);
  });
