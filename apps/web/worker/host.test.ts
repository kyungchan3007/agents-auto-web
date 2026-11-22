// 주소(host)로 나누기 (작업 0302 · ADM-02 ~ 05 · 09)
import { describe, expect, it } from "vitest";
import { hostRoute } from "./host";

const route = (u: string) => hostRoute(new URL(u));

describe("주소로 나누기 (작업 0302)", () => {
  it("flapfx.com · www 의 /log · /geo(하위 · 쿼리 포함)는 어드민 같은 경로로 301", () => {
    expect(route("https://flapfx.com/log")).toEqual({ kind: "redirect", location: "https://admin.flapfx.com/log", status: 301 });
    expect(route("https://www.flapfx.com/geo?x=1")).toEqual({ kind: "redirect", location: "https://admin.flapfx.com/geo?x=1", status: 301 });
    expect(route("https://flapfx.com/log/")).toEqual({ kind: "redirect", location: "https://admin.flapfx.com/log/", status: 301 });
  });

  it("flapfx.com 의 다른 주소 · /logs 처럼 이름만 비슷한 주소는 그대로", () => {
    expect(route("https://flapfx.com/")).toEqual({ kind: "pass" });
    expect(route("https://flapfx.com/currencies/USD")).toEqual({ kind: "pass" });
    expect(route("https://flapfx.com/logs")).toEqual({ kind: "pass" });
  });

  it("어드민: robots 는 전부 막음 · / 는 /log 로 302", () => {
    expect(route("https://admin.flapfx.com/robots.txt")).toEqual({ kind: "robots" });
    expect(route("https://admin.flapfx.com/")).toEqual({ kind: "redirect", location: "https://admin.flapfx.com/log", status: 302 });
  });

  it("어드민: /log · /geo · /bff/* 는 제공", () => {
    for (const p of ["/log", "/geo", "/geo/", "/bff/activity", "/bff"]) expect(route(`https://admin.flapfx.com${p}`)).toEqual({ kind: "admin" });
  });

  it("어드민: 방문자 페이지 · sitemap 은 flapfx.com 같은 주소로 301", () => {
    expect(route("https://admin.flapfx.com/currencies/USD?r=1")).toEqual({
      kind: "redirect",
      location: "https://flapfx.com/currencies/USD?r=1",
      status: 301,
    });
    expect(route("https://admin.flapfx.com/sitemap.xml")).toEqual({ kind: "redirect", location: "https://flapfx.com/sitemap.xml", status: 301 });
  });

  it("미리보기(workers.dev) · 로컬은 손대지 않음", () => {
    expect(route("https://develop-agents-auto-web.developfff.workers.dev/log")).toEqual({ kind: "pass" });
    expect(route("http://localhost:3000/geo")).toEqual({ kind: "pass" });
  });
});
