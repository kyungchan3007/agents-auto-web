// 어드민 전용 경로 열쇠 확인 (작업 0326) — 어드민 Worker(@hav/edge BFF)만 x-admin-key 를 붙임
//   ADMIN_API_KEY 가 없으면 닫힘 · 운영 사이트 경로 · 에이전트 훅(POST /activity)은 이 열쇠와 상관없음
//   tripfx-api 의 ADMIN_TOKEN(단수 · 관리 쓰기 경로)과 다른 값
import type { ApiError } from "@hav/shared/errors";
import type { MiddlewareHandler } from "hono";
import { sameToken } from "../../admin";
import type { Env } from "../../env";

export const requireAdminKey: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  const key = c.env.ADMIN_API_KEY;
  if (!key || !sameToken(c.req.header("x-admin-key") ?? "", key)) {
    const body: ApiError = { error: "인증 실패" };
    return c.json(body, 401);
  }
  await next();
};

/** 어드민 전용 경로 — 운영 BFF 가 쓰지 않는 읽기 경로 + 접속 기록(읽기 · 쓰기 모두) · /tasks 는 공개 저장소 PR 제목 자료라 뺌 */
const READ_ONLY_PATHS = /^\/(activity|geo|ga4|ig|status)(\/|$)/;
const VISITS_PATH = /^\/admin-visits(\/|$)/;

/** 모든 경로 앞에 한 번 — 어드민 전용 경로만 열쇠를 요구 (POST /activity 는 ACTIVITY_TOKEN 그대로) */
export const adminOnlyGuard: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  const path = c.req.path;
  const read = c.req.method === "GET" || c.req.method === "HEAD";
  if (VISITS_PATH.test(path) || (read && READ_ONLY_PATHS.test(path))) return requireAdminKey(c, next);
  await next();
};
