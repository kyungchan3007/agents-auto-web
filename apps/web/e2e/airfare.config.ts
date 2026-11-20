// 작업 0234 — 항공권 달력 e2e 를 크롬 · 사파리(WebKit) 엔진 둘로 (R8: 고른 날 표시 위치가 사파리에서 16px 어긋났던 문제)
//   실행: AIRFARE_FIXTURE=1 npx playwright test -c e2e/airfare.config.ts   (고정 자료로 빌드한 out 이 있을 때 · fixture-api.mjs 머리말 참고)
//   WebKit 은 Playwright 가 받은 것을 씀 — npx playwright install webkit (이 기기에 없으면 사파리 프로젝트는 실행되지 않음)
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: /airfare-calendar\.spec\.ts/,
  timeout: 45_000,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:4399",
    trace: "off",
    storageState: { cookies: [], origins: [{ origin: "http://127.0.0.1:4399", localStorage: [{ name: "flapfx:intro-off", value: "1" }] }] },
  },
  projects: [
    { name: "크롬", use: { ...devices["Desktop Chrome"], channel: "chrome" } },
    { name: "사파리", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: { command: "node serve.mjs", url: "http://127.0.0.1:4399/", reuseExistingServer: true, timeout: 20_000 },
});
