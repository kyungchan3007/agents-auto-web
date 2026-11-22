// 주소(host)로 나누기 (작업 0302 · 0312 — 운영 Worker 는 옛 어드민 경로 301 만 · 어드민 주소는 apps/admin/worker)
import { describe, expect, it } from "vitest";
import { hostRoute } from "./host";

const route = (u: string) => hostRoute(new URL(u));

describe("주소로 나누기 (작업 0302)", () => {
  it("flapfx.com · www 의 /log · /geo(하위 · 쿼리 포함)는 어드민 같은 경로로 301", () => {
    expect(route("https://flapfx.com/log")).toEqual({ kind: "redirect", location: "https://admin.flapfx.com/log", status: 301 });
    expect(route("https://www.flapfx.com/geo?x=1")).toEqual({ kind: "redirect", location: "https://admin.flapfx.com/geo?x=1", status: 301 });
    expect(route("https://flapfx.com/log/")).toEqual({ kind: "redirect", location: "https://admin.flapfx.com/log/", status: 301 });
    expect(route("https://flapfx.com/how")).toEqual({ kind: "redirect", location: "https://admin.flapfx.com/how", status: 301 }); // 작업 0303
  });

  it("flapfx.com 의 다른 주소 · /logs 처럼 이름만 비슷한 주소는 그대로", () => {
    expect(route("https://flapfx.com/")).toEqual({ kind: "pass" });
    expect(route("https://flapfx.com/currencies/USD")).toEqual({ kind: "pass" });
    expect(route("https://flapfx.com/logs")).toEqual({ kind: "pass" });
  });

  it("admin.flapfx.com 은 운영 Worker 가 손대지 않음 — 어드민 Worker(apps/admin)가 맡음 (작업 0312)", () => {
    expect(route("https://admin.flapfx.com/log")).toEqual({ kind: "pass" });
  });

  it("미리보기(workers.dev) · 로컬은 손대지 않음", () => {
    expect(route("https://develop-agents-auto-web.developfff.workers.dev/log")).toEqual({ kind: "pass" });
    expect(route("http://localhost:3000/geo")).toEqual({ kind: "pass" });
  });
});
