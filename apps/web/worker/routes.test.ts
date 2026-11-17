// Worker 를 먼저 지나는 경로가 세 곳에서 같은지 (작업 0189)
//   worker/routes.ts(원본) · wrangler.jsonc assets.run_worker_first(Workers) · public/_routes.json(Pages, 전환 기간)
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { WORKER_FIRST_ROUTES } from "./routes";

const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");
// jsonc → json: 줄 주석만 지움 (문자열 안에 // 가 없음 — 주소는 "/..." 로 시작)
const jsonc = (text: string) => JSON.parse(text.replace(/^\s*\/\/.*$/gm, "").replace(/,(\s*[}\]])/g, "$1"));

describe("Worker 먼저 지나는 경로 (작업 0189)", () => {
  it("wrangler.jsonc assets.run_worker_first 와 같음", () => {
    const cfg = jsonc(read("../wrangler.jsonc"));
    expect(cfg.assets.run_worker_first).toEqual([...WORKER_FIRST_ROUTES]);
  });

  it("Pages _routes.json include 와 같음 (전환 기간 동안 두 배포가 같은 기준으로 집계)", () => {
    const routes = JSON.parse(read("../public/_routes.json"));
    expect(routes.include).toEqual([...WORKER_FIRST_ROUTES]);
  });

  it("wrangler.jsonc 는 사이트 Worker 설정 (이름 · 진입점 · 자산 · 바인딩)", () => {
    const cfg = jsonc(read("../wrangler.jsonc"));
    expect(cfg.name).toBe("flapfx");
    expect(cfg.main).toBe("worker/index.ts");
    expect(cfg.assets).toMatchObject({ directory: "out", binding: "ASSETS", not_found_handling: "404-page" });
    expect(cfg.d1_databases[0]).toMatchObject({ binding: "DB", database_name: "hav-db" });
    expect(cfg.services[0]).toEqual({ binding: "API", service: "tripfx-api" });
  });
});
