// 작업 0346 — 환율을 못 받는 고정 자료 빌드 전용 e2e 설정 (airfare.config.ts 와 같은 방식 · 작업 0234)
//   실행: EMPTY_FIXTURE=1 npx playwright test -c e2e/empty.config.ts   (환율을 못 받게 만든 빌드 out 이 있을 때 · empty-states.spec.ts 머리말 참고)
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: /empty-states\.spec\.ts/,
  timeout: 30_000,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:4399",
    trace: "off",
    storageState: { cookies: [], origins: [{ origin: "http://127.0.0.1:4399", localStorage: [{ name: "flapfx:intro-off", value: "1" }] }] },
  },
  projects: [
    { name: "넓은 화면", use: { ...devices["Desktop Chrome"], channel: "chrome" } },
    { name: "휴대폰", use: { ...devices["Pixel 7"], channel: "chrome" } },
  ],
  webServer: { command: "node serve.mjs", url: "http://127.0.0.1:4399/", reuseExistingServer: true, timeout: 20_000 },
});
