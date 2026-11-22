// 어드민 주소(host)로 나누기 (작업 0302 ADM-02 ~ 05 · 09 · 0312 에 운영 Worker 에서 옮김)
import { describe, expect, it } from "vitest";
import { hostRoute } from "./host";

const route = (u: string) => hostRoute(new URL(u));

describe("어드민 주소로 나누기", () => {
  it("어드민: robots 는 전부 막음 · / 는 /log 로 302", () => {
    expect(route("https://admin.flapfx.com/robots.txt")).toEqual({ kind: "robots" });
    expect(route("https://admin.flapfx.com/")).toEqual({ kind: "redirect", location: "https://admin.flapfx.com/log", status: 302 });
  });

  it("어드민: /log · /geo · /how · /marketing · /bff/* · 자산은 제공", () => {
    for (const p of ["/log", "/geo", "/geo/", "/how", "/marketing", "/bff/activity", "/bff", "/_next/static/a.js"]) {
      expect(route(`https://admin.flapfx.com${p}`), p).toEqual({ kind: "serve" });
    }
  });

  it("어드민: 방문자 페이지 · sitemap 은 flapfx.com 같은 주소로 301", () => {
    expect(route("https://admin.flapfx.com/currencies/USD?r=1")).toEqual({
      kind: "redirect",
      location: "https://flapfx.com/currencies/USD?r=1",
      status: 301,
    });
    expect(route("https://admin.flapfx.com/sitemap.xml")).toEqual({ kind: "redirect", location: "https://flapfx.com/sitemap.xml", status: 301 });
    expect(route("https://admin.flapfx.com/logs")).toEqual({ kind: "redirect", location: "https://flapfx.com/logs", status: 301 });
  });

  it("미리보기(workers.dev) · 로컬: / 는 /log 로 · 그 밖은 제공 · robots 는 막음", () => {
    expect(route("https://develop-flapfx-admin.developfff.workers.dev/")).toEqual({ kind: "redirect", location: "https://develop-flapfx-admin.developfff.workers.dev/log", status: 302 });
    expect(route("http://localhost:3001/geo")).toEqual({ kind: "serve" });
    expect(route("http://localhost:3001/robots.txt")).toEqual({ kind: "robots" });
  });
});
