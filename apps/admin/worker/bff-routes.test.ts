// 어드민 BFF 경로표 — 작업 · 상태 · GEO · 작업 기록만 열고 운영 · 관리 경로는 닫음 (작업 0312)
import { describe, expect, it } from "vitest";
import { ADMIN_BFF_ROUTES } from "./bff-routes";

const open = (path: string) => ADMIN_BFF_ROUTES.some(([re]) => re.test(path));

describe("어드민 BFF 경로표", () => {
  it("어드민 화면 자료 경로는 열림", () => {
    for (const p of ["/activity", "/tasks", "/geo", "/status"]) expect(open(p), p).toBe(true);
  });
  it("운영 자료 · 관리 경로는 닫힘", () => {
    for (const p of ["/fx/latest", "/signal", "/prices/levels", "/fx/collect", "/activity/1"]) expect(open(p), p).toBe(false);
  });
});
