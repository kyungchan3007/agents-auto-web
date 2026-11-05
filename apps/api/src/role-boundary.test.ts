// 백엔드 역할 분담 검사 (작업 0127) — 라우트는 입력 · 응답 · 조립만 · 쿼리는 store.ts
import { readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = resolve(__dirname);
const routes = readdirSync(join(SRC, "features")).map((d) => join(SRC, "features", d, "routes.ts"));
const API = resolve(SRC, "..");

describe("백엔드 역할 분담 (작업 0127)", () => {
  it("라우트에 쿼리를 쓰지 않음 — store.ts 로", () => {
    const sources = [...routes, join(SRC, "index.ts")];
    const bad = sources.filter((f) => /\.prepare\(|drizzle\(|\.select\(|from "drizzle-orm/.test(readFileSync(f, "utf8"))).map((f) => relative(SRC, f));
    expect(bad).toEqual([]);
  });

  it("생성한 바인딩 타입이 설정과 같음 — 바인딩을 바꾸면 npm run typegen", () => {
    const types = readFileSync(join(API, "worker-configuration.d.ts"), "utf8");
    const config = readFileSync(join(API, "wrangler.jsonc"), "utf8");
    for (const m of config.matchAll(/"binding":\s*"(\w+)"/g)) expect(types).toContain(`${m[1]}:`);
  });
});
