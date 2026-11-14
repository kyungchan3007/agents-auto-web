// 작업 0163 — GET /indicators/:series?limit= (읽기 전용 · 테스트 먼저 · 구현 전에는 FAIL 이 정상)
//
// builder 가 만들 것 — apps/api/src/features/indicators/routes.ts 의 indicatorRoutes 를 index.ts 에 .route("/indicators", indicatorRoutes) 로 연결
//   GET /indicators/:series?limit=N
//     series 형식 `<소문자·숫자·하이픈>:<영문·숫자·하이픈>` (예 kcs-import:USD · kosis-cpi:air-fare) 아니면 400 (ApiError 모양 · issues 포함)
//     limit 은 정수 1 ~ 520 (기본 52) 아니면 400
//     응답 200: { series: string, points: { period: string, value: number }[] } — 오래된 것부터 · 자료가 없으면 points: []
//     cached() 사용 (응답 캐시)
//   쓰기 경로 없음 — POST 등은 404/405 (읽기 전용)
import { ApiError } from "@hav/shared/errors";
import { describe, expect, it } from "vitest";
import type { Env } from "../../env";
import { app } from "../../index";

/** indicator_points 읽기에는 rows 를 주고 나머지(캐시 등)는 비어 있는 D1 */
function dbWith(rows: unknown[]) {
  const sqls: string[] = [];
  const stmt = (sql: string): unknown => {
    sqls.push(sql);
    const results = /indicator_points/i.test(sql) ? rows : [];
    return {
      bind: () => stmt(sql),
      run: async () => ({ success: true, results: [], meta: {} }),
      all: async () => ({ success: true, results, meta: {} }),
      first: async () => null,
      raw: async () => results.map((r) => Object.values(r as object)),
    };
  };
  return { DB: { prepare: stmt } as unknown as D1Database, sqls } as { DB: D1Database; sqls: string[] } & Partial<Env>;
}
const env = (rows: unknown[] = []) => dbWith(rows) as unknown as Env;

describe("GET /indicators/:series 입력 검사", () => {
  it("limit 범위 밖 · 정수 아님 → 400", async () => {
    for (const q of ["limit=0", "limit=521", "limit=-1", "limit=abc", "limit=1.5"]) {
      expect((await app.request(`/indicators/kcs-import:USD?${q}`, {}, env())).status, q).toBe(400);
    }
  });

  it("series 형식이 틀리면 400 · 같은 ApiError 모양 + 어디가 틀렸는지", async () => {
    for (const s of ["nocolon", "UPPER:USD", "kcs-import:", ":USD", "kcs-import:US%20D", "a:b:c"]) {
      const res = await app.request(`/indicators/${s}`, {}, env());
      expect(res.status, s).toBe(400);
      expect(ApiError.parse(await res.json()).issues?.length, s).toBeGreaterThan(0);
    }
  });

  it("올바른 series · limit 은 검사 통과 (200)", async () => {
    for (const url of ["/indicators/kcs-import:USD", "/indicators/kcs-import:USD?limit=1", "/indicators/kcs-import:USD?limit=520", "/indicators/kosis-cpi:air-fare?limit=24"]) {
      expect((await app.request(url, {}, env())).status, url).toBe(200);
    }
  });
});

describe("GET /indicators/:series 응답", () => {
  it("저장된 값 → { series, points } · 오래된 것부터 · 숫자 그대로", async () => {
    const res = await app.request("/indicators/kcs-import:USD?limit=2", {}, env([{ period: "2026-11-15", value: 1400.5 }, { period: "2026-11-08", value: 1390.25 }]));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      series: "kcs-import:USD",
      points: [
        { period: "2026-11-08", value: 1390.25 },
        { period: "2026-11-15", value: 1400.5 },
      ],
    });
  });

  it("자료가 없으면 points 는 빈 배열 (지어내지 않음)", async () => {
    const res = await app.request("/indicators/kcs-import:XXX", {}, env([]));
    expect(await res.json()).toEqual({ series: "kcs-import:XXX", points: [] });
  });
});

describe("읽기 전용", () => {
  it("쓰기 · 수집 경로가 없음 — POST · PUT · DELETE 는 성공하지 않음", async () => {
    for (const method of ["POST", "PUT", "DELETE"]) {
      for (const path of ["/indicators/kcs-import:USD", "/indicators/collect", "/indicators"]) {
        const res = await app.request(path, { method, body: "{}" }, env());
        expect([404, 405], `${method} ${path}`).toContain(res.status);
      }
    }
  });
});
