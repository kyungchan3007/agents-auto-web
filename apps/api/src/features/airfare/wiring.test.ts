// 작업 0234 R9 · R11 · R12 — 연결 · 비밀값 · 보호 파일 두 곳 점검 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   보호 파일(schema.ts · deploy-api.yml)은 builder 가 못 고침 — 사람 승인 뒤 고치게 되며, 그 전에는 이 점검이 FAIL 로 남는 것이 정상
//   R12 의 나머지(PR 설명에 이유 · 승인 대기 · harness-approved 라벨 안 붙임)는 lead 가 PR 에서 — trace.md
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "../../../../..");
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

describe("env · 연결 (R9 · R11)", () => {
  it("env.ts 에 SERPAPI_KEY?: string — 이름만 · 값 없음", () => {
    expect(read("apps/api/src/env.ts")).toMatch(/SERPAPI_KEY\?:\s*string/);
  });
  it("index.ts: airfareRoutes 를 /airfare 에 연결 · scheduled 에서 collectAirfare · 새 cron 없음", () => {
    const src = read("apps/api/src/index.ts");
    expect(src).toMatch(/\.route\(\s*["']\/airfare["']\s*,\s*airfareRoutes\s*\)/);
    expect(src).toMatch(/collectAirfare\(/);
  });
  it("wrangler.jsonc 는 바뀌지 않음 — cron 이 기존 네 개 그대로 (보호 파일을 세 번째로 건드리지 않음)", () => {
    const w = read("apps/api/wrangler.jsonc");
    expect((w.match(/"crons"\s*:\s*\[([^\]]*)\]/)?.[1].match(/"[^"]+"/g) ?? []).length).toBe(4);
  });
  it("BFF 허용 목록에 /airfare 를 넣지 않음 (빌드 때만 읽음)", () => {
    expect(read("apps/web/src/bff/proxy.ts")).not.toMatch(/airfare/);
  });
});

describe("보호 파일 두 곳 (R12 — 사람 승인 필요)", () => {
  it("schema.ts 에 airfare_calendar 표 + 새 마이그레이션 0011 (기존 파일 수정 없음)", () => {
    expect(read("apps/api/src/db/schema.ts")).toMatch(/airfare_calendar/);
    const mig = readdirSync(join(ROOT, "apps/api/drizzle/migrations")).filter((n) => /^0011_.*\.sql$/.test(n));
    expect(mig).toHaveLength(1);
    const sql = read(`apps/api/drizzle/migrations/${mig[0]}`);
    expect(sql).toMatch(/CREATE TABLE\s+`?airfare_calendar`?/i);
    for (const col of ["airport", "fetched_on", "depart", "return_date", "price", "fetched_at"]) expect(sql, col).toContain(col);
    expect(sql).toMatch(/PRIMARY KEY/i);
    expect(sql).not.toMatch(/DROP TABLE|ALTER TABLE/i); // 새 표 추가만
  });
  it("deploy-api.yml: env 에 SERPAPI_KEY 를 Secrets 에서 · 비밀값 넘김 반복 목록에도 추가", () => {
    const y = read(".github/workflows/deploy-api.yml");
    expect(y).toMatch(/SERPAPI_KEY:\s*\$\{\{\s*secrets\.SERPAPI_KEY\s*\}\}/);
    expect(y).toMatch(/for name in [^;\n]*\bSERPAPI_KEY\b/);
  });
});

describe("비밀값을 코드 · 문서에 쓰지 않음 (R11 · AGENTS 6)", () => {
  it("airfare 슬라이스 · 고정 자료에 api_key 값 · 검색 주소가 없음 (이름만)", () => {
    const dir = join(ROOT, "apps/api/src/features/airfare");
    if (!existsSync(dir)) throw new Error("features/airfare 가 아직 없음");
    for (const f of walk(dir).filter((p) => !p.endsWith("wiring.test.ts"))) {
      const t = readFileSync(f, "utf8");
      expect(t, f).not.toMatch(/api_key=[A-Za-z0-9]{8,}/);
      expect(t, f).not.toMatch(/\b[a-f0-9]{48,64}\b/); // SerpApi 키 모양(긴 16진수)
      expect(t, f).not.toMatch(/https:\/\/serpapi\.com\/search\.json\?[^"'`\s]*api_key=/);
    }
  });
  it("고정 자료가 있음 — SerpApi 를 반복 호출하지 않고 테스트 (R11)", () => {
    for (const f of ["calendar.json", "serpapi-nrt.json"]) expect(existsSync(join(ROOT, "apps/api/src/features/airfare/fixtures", f)), f).toBe(true);
    expect(read("apps/api/src/features/airfare/fixtures/serpapi-nrt.json")).not.toMatch(/api_key|serpapi_link|search_url/i);
  });
});
