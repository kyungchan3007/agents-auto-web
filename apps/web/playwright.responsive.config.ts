import { defineConfig, devices } from "@playwright/test";

// 반응형 점검 — 운영 사이트(또는 RESP_BASE)를 세 엔진으로 (작업 0110)
//   CI(.github/workflows/responsive.yml)는 기기 Chrome + Playwright 가 받은 Firefox · WebKit 을 씀
//   이 기기(macOS)에서는 Playwright Firefox 가 "Could not find profile folder" 로 안 켜져 CI 에서 봄
const RESP_BASE = process.env.RESP_BASE ?? "https://flapfx.com";

export default defineConfig({
  testDir: "e2e-responsive",
  timeout: 45_000,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  // 작업 0185: 공항 인트로(데스크톱 홈 덮개)는 반응형 점검에서 끔 — 끄기 스위치 localStorage flapfx:intro-off=1
  use: {
    baseURL: RESP_BASE,
    trace: "off",
    storageState: { cookies: [], origins: [{ origin: new URL(RESP_BASE).origin, localStorage: [{ name: "flapfx:intro-off", value: "1" }] }] },
  },
  projects: [
    { name: "크롬", use: { ...devices["Desktop Chrome"], channel: "chrome" } }, // 기기 Chrome (GitHub 러너에도 있음)
    { name: "파이어폭스", use: { ...devices["Desktop Firefox"] } },
    { name: "사파리", use: { ...devices["Desktop Safari"] } },
  ],
});
