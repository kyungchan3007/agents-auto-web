// 어드민 접속 기록 API (작업 0326) — 열쇠(x-admin-key)는 index.ts 의 adminOnlyGuard 가 앞에서 확인
import type { ApiError } from "@hav/shared/errors";
import { Hono } from "hono";
import { z } from "zod";
import type { Env } from "../../env";
import { adminVisitsReport, readVisits, recordVisit, validVisitName } from "./visits";

/** 이름만 읽음 — 다른 칸(ip · userAgent · path)이 와도 쓰지 않음 · owner 는 모양이 맞으니 통과(저장은 recordVisit 이 거름) */
const VisitIn = z.object({ name: z.string().refine((n) => n === "owner" || validVisitName(n), "토큰 이름 모양이 아닙니다") });

export const adminVisitRoutes = new Hono<{ Bindings: Env }>()
  .post("/", async (c) => {
    const parsed = VisitIn.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) {
      const body: ApiError = { error: "입력값이 올바르지 않습니다", issues: parsed.error.issues.map((i) => ({ path: i.path.join(".") || "json", message: i.message })) };
      return c.json(body, 400);
    }
    await recordVisit(c.env.DB, parsed.data.name, new Date().toISOString());
    return c.body(null, 204);
  })
  .get("/", async (c) => c.json(adminVisitsReport(await readVisits(c.env.DB))));
