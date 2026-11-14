import { afterEach, describe, expect, it, vi } from "vitest";
import { logError, logEvent, redact } from "./log";

afterEach(() => vi.restoreAllMocks());

describe("구조화 로그 (작업 0127)", () => {
  it("인증키를 가림", () => {
    expect(redact("https://x/y?authkey=SECRET123&data=AP01")).toBe("https://x/y?authkey=***&data=AP01");
  });
  it("JSON 한 줄 · 오류는 console.error", () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => undefined);
    logError("fail", new Error("fetch authkey=SECRET failed"), { cron: "0 3" });
    const line = String(err.mock.calls[0][0]);
    expect(JSON.parse(line)).toEqual({ level: "error", event: "fail", cron: "0 3", error: "Error: fetch authkey=*** failed" });
    expect(line).not.toContain("SECRET");
  });
  it("필드 안의 인증키도 가림 · 정보는 console.log", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    logEvent("info", "run", { message: "authkey=SECRET" });
    expect(String(log.mock.calls[0][0])).not.toContain("SECRET");
  });

  it("공공데이터포털 인증키(serviceKey)도 가림 — 과세환율 주소에 들어 있음 (작업 0163)", () => {
    expect(redact("https://apis.data.go.kr/1220000/x?serviceKey=SECRET%2Bkey%3D%3D&aplyBgnDt=20261118")).toBe("https://apis.data.go.kr/1220000/x?serviceKey=***&aplyBgnDt=20261118");
    const err = vi.spyOn(console, "error").mockImplementation(() => undefined);
    logError("kcs_fail", new Error("fetch failed https://apis.data.go.kr/x?aplyBgnDt=1&serviceKey=SECRET"));
    expect(String(err.mock.calls[0][0])).not.toContain("SECRET");
  });
});
