// 운영 BFF 경로표 — 환율 · 신호 · 물가 · 시계열만 열고 어드민 경로는 닫음 (작업 0312)
import { describe, expect, it } from "vitest";
import { WEB_BFF_ROUTES } from "./bff-routes";

const open = (path: string) => WEB_BFF_ROUTES.some(([re]) => re.test(path));

describe("운영 BFF 경로표", () => {
  it("운영 화면 자료 경로는 열림", () => {
    for (const p of ["/fx/latest", "/fx/usd/history", "/signal", "/signal/JPY", "/prices/levels", "/indicators/kcs-import:USD"]) expect(open(p), p).toBe(true);
  });
  it("어드민 경로(작업 · 상태 · GEO · 작업 기록)와 관리 경로는 닫힘", () => {
    for (const p of ["/tasks", "/status", "/geo", "/activity", "/fx/collect", "/prices/collect"]) expect(open(p), p).toBe(false);
  });
});
