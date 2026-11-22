// 어드민 Worker 설정 (작업 0312) — 이름 · 진입점 · 자산 · 바인딩 · 도메인
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");
const jsonc = (text: string) => JSON.parse(text.replace(/^\s*\/\/.*$/gm, "").replace(/,(\s*[}\]])/g, "$1"));

describe("어드민 wrangler.jsonc", () => {
  it("어드민 Worker 설정", () => {
    const cfg = jsonc(read("../wrangler.jsonc"));
    expect(cfg.name).toBe("flapfx-admin");
    expect(cfg.main).toBe("worker/index.ts");
    expect(cfg.assets).toMatchObject({ directory: "out", binding: "ASSETS", not_found_handling: "404-page", run_worker_first: true });
    expect(cfg.services[0]).toEqual({ binding: "API", service: "tripfx-api" });
    expect(cfg.routes).toEqual([{ pattern: "admin.flapfx.com", custom_domain: true }]);
    expect(cfg.d1_databases).toBeUndefined(); // 방문 기록은 운영만
  });
});
