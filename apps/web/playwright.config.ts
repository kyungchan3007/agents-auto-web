import { defineConfig, devices } from "@playwright/test";

// e2e — 빌드한 정적 사이트(out)를 기기 Chrome 으로 (브라우저를 따로 받지 않음 · GitHub 러너에도 Chrome 이 있음) (작업 0101)
//   게이트 Full 루프가 build 다음에 test:e2e 로 돌림
export default defineConfig({
  testDir: "e2e",
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  // 작업 0238 후보 1: CI 에서 일꾼 4개 (로컬은 기본 그대로) — 파일 단위 병렬
  workers: process.env.CI ? 4 : undefined,
  reporter: [["list"]],
  // 작업 0185: 홈 위를 덮는 공항 인트로를 기본 꺼 둠(끄기 스위치 localStorage flapfx:intro-off=1) — 다른 e2e 는 홈 첫 화면이 바로 보인다고 가정 · e2e/intro.spec.ts 만 켬
  use: {
    baseURL: "http://127.0.0.1:4399",
    channel: "chrome",
    trace: "off",
    storageState: { cookies: [], origins: [{ origin: "http://127.0.0.1:4399", localStorage: [{ name: "flapfx:intro-off", value: "1" }] }] },
  },
  projects: [
    { name: "넓은 화면", use: { ...devices["Desktop Chrome"], channel: "chrome" } },
    { name: "휴대폰", use: { ...devices["Pixel 7"], channel: "chrome" } },
  ],
  webServer: { command: "node e2e/serve.mjs", url: "http://127.0.0.1:4399/", reuseExistingServer: !process.env.CI, timeout: 20_000 },
});
