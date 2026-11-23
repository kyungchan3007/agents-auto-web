// GA4 측정 태그 (작업 0322) — 운영 주소에서만 불러옴 · 순수 함수 하나(hostname → boolean) · 측정 ID 는 상수 한 곳
import { describe, expect, it } from "vitest";
import { GA_MEASUREMENT_ID } from "../site";
import { analyticsEnabled } from "./analytics";

describe("analyticsEnabled — 운영 hostname 만 true (작업 0322)", () => {
  it("요구 1: 운영 주소 flapfx.com · www.flapfx.com 은 true", () => {
    expect(analyticsEnabled("flapfx.com")).toBe(true);
    expect(analyticsEnabled("www.flapfx.com")).toBe(true);
  });

  it("요구 2: 어드민 · 미리보기(*.workers.dev) · 로컬 · 빈 값은 false", () => {
    for (const h of ["admin.flapfx.com", "agents-auto-web.workers.dev", "hav-web.example.workers.dev", "localhost", "127.0.0.1", "0.0.0.0", "", " "]) {
      expect(analyticsEnabled(h), `'${h}'`).toBe(false);
    }
  });

  it("요구 2: 이름이 비슷한 다른 주소도 false — 끝이 같거나 앞이 같아도 정확히 두 주소만", () => {
    for (const h of ["flapfx.com.evil.com", "evilflapfx.com", "xflapfx.com", "flapfx.co", "flapfx.com.", "preview.flapfx.com", "staging.flapfx.com", "www.flapfx.com.workers.dev", "flapfx"]) {
      expect(analyticsEnabled(h), h).toBe(false);
    }
  });

  it("요구 3: 순수 함수 — 같은 입력이면 같은 결과 · 문자열만 받아 true/false", () => {
    expect(analyticsEnabled("flapfx.com")).toBe(analyticsEnabled("flapfx.com"));
    expect(typeof analyticsEnabled("localhost")).toBe("boolean");
  });
});

describe("측정 ID 상수 (작업 0322 요구 4)", () => {
  it("G-9B9FLT5S9X — GA4 측정 ID 모양(G- + 영문 대문자 · 숫자 10자)", () => {
    expect(GA_MEASUREMENT_ID).toBe("G-9B9FLT5S9X");
    expect(GA_MEASUREMENT_ID).toMatch(/^G-[A-Z0-9]{10}$/);
  });
});
