// 작업 목록 API — 읽기만 (쓰기는 GitHub Actions 가 D1 에 바로) · 모양은 @hav/shared/tasks
import { Hono } from "hono";
import type { Env } from "../../env";
import { taskRows } from "./store";
import { summarize } from "./summary";

export const taskRoutes = new Hono<{ Bindings: Env }>().get("/", async (c) => {
  const { rows, snagRows } = await taskRows(c.env.DB);
  c.header("cache-control", "public, max-age=60");
  return c.json(summarize(rows, snagRows));
});
