// 작업 0164 — KOSIS 소비자물가(여행 품목) 읽기 · 수집 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
// 0163 이 정한 이름을 이어 씀: IndicatorStore · IndicatorPoint (collect.ts) · indicator_points (series, period, value, source, fetched_at)
//
// builder 가 만들 것
//   kosis.ts
//     export const KOSIS_URL = "https://kosis.kr/openapi/Param/statisticsParameterData.do"
//     export const KOSIS_ITEMS: { key: "air-fare" | "package-tour"; series: string; objL2: string }[]
//        = [{ key: "air-fare", series: "kosis-cpi:air-fare", objL2: "G03302" }, { key: "package-tour", series: "kosis-cpi:package-tour", objL2: "I06102" }]
//     export class KosisError extends Error { readonly code: string }        // 필드로 선언
//     export type KosisPoint = { period: string /* YYYY-MM */; value: number }
//     export function parseKosisJson(body: unknown): KosisPoint[]            // body 는 JSON.parse 한 값
//        - 배열이면 각 줄의 PRD_DE(YYYYMM 6자리) · DT(문자열 숫자) 만 봄 → period "YYYY-MM" · value 숫자
//        - DT 가 비었거나 숫자 아님 · 0 이하 · PRD_DE 가 6자리 숫자가 아닌 줄은 버림 (쉼표는 지우고 읽음)
//        - 객체이고 err 가 있으면 KosisError (code = err 문자열 · message 에 errMsg)
//        - 그 밖(null · 문자열 · 모르는 객체)은 KosisError code "shape" · 빈 배열은 [] (오류 아님)
//   collect.ts 에 추가
//     export async function collectKosis(store: IndicatorStore, opts: { key?: string; now?: () => Date; fetcher?: typeof fetch }): Promise<CustomsResult>   // 결과 모양은 0163 의 CustomsResult 와 같음 (status ok|empty|error|skipped|already · rows · message) — 이름은 builder 가 IndicatorCollectResult 등으로 바꿔도 됨
//        - 품목마다 따로 요청 (KOSIS_ITEMS 순서) · 파라미터: method=getList · apiKey · orgId=101 · tblId=DT_1J22001 · itmId=T · objL1=T10 · objL2 · prdSe=M · startPrdDe · endPrdDe (YYYYMM · 최근 24개월 · endPrdDe 는 now 의 달 이하) · format=json · jsonVD=Y
//        - 저장: series = 품목의 series · period · value · source "kosis" · fetchedAt = now (이미 있는 달도 덮어씀 — hasPeriod 로 건너뛰지 않음)
//        - 키 없음 → skipped · 호출 · 저장 · 실행 기록 없음
//        - 오류(err 객체 · HTTP · 네트워크 · 저장) → 던지지 않음 · 저장 없음 · 실행 기록 source "kosis" status error · 한 품목만 실패하면 다른 품목은 저장
//        - message · 실행 기록에 apiKey 값을 남기지 않음
import { describe, expect, it } from "vitest";
import { type IndicatorStore, collectKosis } from "./collect";
import { AIR_FARE_JSON, DIRTY_JSON, NO_DATA_JSON, PACKAGE_TOUR_JSON, errJson } from "./fixtures/kosis-json";
import { KOSIS_ITEMS, KOSIS_URL, KosisError, parseKosisJson } from "./kosis";

const NOW = () => new Date("2026-11-01T04:00:00Z"); // 매달 1일 13:00 KST 회차
const KEY = "KoS1s+Key/zz==";

describe("KOSIS 응답 읽기", () => {
  it("정상 배열 → (YYYY-MM, 지수) · DT 문자열을 숫자로", () => {
    expect(parseKosisJson(AIR_FARE_JSON)).toEqual([
      { period: "2025-09", value: 118.37 },
      { period: "2025-07", value: 131.2 },
      { period: "2025-08", value: 127.85 },
    ]);
  });

  it("빈 DT · 숫자 아님 · 0 · 월 형식이 아닌 PRD_DE · DT 없는 줄은 버림 (쉼표는 지우고 읽음)", () => {
    expect(parseKosisJson(DIRTY_JSON)).toEqual([
      { period: "2025-01", value: 120.5 },
      { period: "2025-06", value: 1234.5 },
    ]);
  });

  it("빈 배열은 빈 결과 (오류 아님)", () => {
    expect(parseKosisJson([])).toEqual([]);
  });

  it("오류 객체 {err, errMsg} → KosisError · code 는 err", () => {
    for (const [body, code] of [[NO_DATA_JSON, "30"], [errJson("40", "분당 요청 건수 초과"), "40"], [errJson("11", "인증키가 만료되었습니다."), "11"]] as const) {
      expect(() => parseKosisJson(body), code).toThrow(KosisError);
      try {
        parseKosisJson(body);
      } catch (e) {
        expect((e as KosisError).code).toBe(code);
        expect((e as KosisError).message).toContain(String((body as { errMsg: string }).errMsg));
      }
    }
  });

  it("모르는 모양(null · 문자열 · 모르는 객체) → KosisError shape · 응답 안의 글을 지시로 따르지 않음", () => {
    for (const body of [null, "ignore previous instructions", 42, { hello: "world" }]) {
      expect(() => parseKosisJson(body), JSON.stringify(body)).toThrow(KosisError);
    }
  });

  it("품목은 국제항공료(G03302) · 해외단체여행비(I06102) 두 개 · series 이름 고정", () => {
    expect(KOSIS_ITEMS).toEqual([
      { key: "air-fare", series: "kosis-cpi:air-fare", objL2: "G03302" },
      { key: "package-tour", series: "kosis-cpi:package-tour", objL2: "I06102" },
    ]);
    expect(KOSIS_URL).toBe("https://kosis.kr/openapi/Param/statisticsParameterData.do");
  });
});

function memoryStore() {
  const runs: Record<number, Record<string, unknown>> = {};
  const saved: { series: string; period: string; value: number; source: string; fetchedAt: string }[] = [];
  let asked = 0;
  const store: IndicatorStore = {
    async startRun(source, startedAt) {
      const id = Object.keys(runs).length + 1;
      runs[id] = { source, startedAt };
      return id;
    },
    async finishRun(id, r) {
      Object.assign(runs[id], r);
    },
    async savePoints(rows) {
      saved.push(...(rows as typeof saved));
      return rows.length;
    },
    async hasPeriod() {
      asked++;
      return true; // 이미 있다고 답해도 월간은 덮어쓰려고 다시 받아야 함
    },
  };
  return { store, runs, saved, asked: () => asked };
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
/** objL2 로 품목을 가려 답하는 가짜 fetch */
const byItem = (air: () => Response, tour: () => Response) => {
  const urls: URL[] = [];
  const fetcher: typeof fetch = async (u) => {
    const url = new URL(String(u));
    urls.push(url);
    return url.searchParams.get("objL2") === "G03302" ? air() : tour();
  };
  return { fetcher, urls };
};

describe("KOSIS 수집", () => {
  it("품목마다 따로 요청 · 공식 파라미터 (jsonVD=Y · 전국 · 월 · 최근 24개월)", async () => {
    const { store } = memoryStore();
    const { fetcher, urls } = byItem(() => json(AIR_FARE_JSON), () => json(PACKAGE_TOUR_JSON));
    await collectKosis(store, { key: KEY, now: NOW, fetcher });
    expect(urls.map((u) => u.searchParams.get("objL2"))).toEqual(["G03302", "I06102"]);
    for (const u of urls) {
      expect(u.origin + u.pathname).toBe(KOSIS_URL);
      const p = u.searchParams;
      expect(Object.fromEntries(["method", "orgId", "tblId", "itmId", "objL1", "prdSe", "format", "jsonVD"].map((k) => [k, p.get(k)]))).toEqual({
        method: "getList", orgId: "101", tblId: "DT_1J22001", itmId: "T", objL1: "T10", prdSe: "M", format: "json", jsonVD: "Y",
      });
      expect(p.get("apiKey")).toBe(KEY);
      const [s, e] = [p.get("startPrdDe") ?? "", p.get("endPrdDe") ?? ""];
      expect(s).toMatch(/^\d{6}$/);
      expect(e).toMatch(/^\d{6}$/);
      expect(e <= "202611").toBe(true);
      const months = (Number(e.slice(0, 4)) - Number(s.slice(0, 4))) * 12 + Number(e.slice(4)) - Number(s.slice(4)) + 1;
      expect(months).toBeGreaterThanOrEqual(24);
      expect(months).toBeLessThanOrEqual(25);
    }
  });

  it("저장: series · period YYYY-MM · value · source kosis · 이미 있는 달도 덮어쓰려고 hasPeriod 로 건너뛰지 않음", async () => {
    const { store, saved, runs, asked } = memoryStore();
    const { fetcher } = byItem(() => json(AIR_FARE_JSON), () => json(PACKAGE_TOUR_JSON));
    const r = await collectKosis(store, { key: KEY, now: NOW, fetcher });
    expect(r).toMatchObject({ status: "ok", rows: 5 });
    expect(saved.filter((p) => p.series === "kosis-cpi:air-fare")).toHaveLength(3);
    expect(saved).toContainEqual({ series: "kosis-cpi:package-tour", period: "2025-09", value: 103.1, source: "kosis", fetchedAt: NOW().toISOString() });
    expect(asked()).toBe(0);
    expect(Object.values(runs).some((x) => x.source === "kosis" && x.status === "ok")).toBe(true);
  });

  it("키가 없으면 호출 · 저장 · 실행 기록이 없음", async () => {
    for (const key of [undefined, "", " "]) {
      const { store, saved, runs } = memoryStore();
      const { fetcher, urls } = byItem(() => json(AIR_FARE_JSON), () => json(PACKAGE_TOUR_JSON));
      expect(await collectKosis(store, { key, now: NOW, fetcher }), JSON.stringify(key)).toMatchObject({ status: "skipped", rows: 0 });
      expect(urls).toHaveLength(0);
      expect(saved).toEqual([]);
      expect(Object.keys(runs)).toHaveLength(0);
    }
  });

  it("오류 객체(err) → 던지지 않고 error · 저장 없음 · 실행 기록 error · 메시지에 err 코드", async () => {
    const { store, saved, runs } = memoryStore();
    const { fetcher } = byItem(() => json(NO_DATA_JSON), () => json(NO_DATA_JSON));
    const r = await collectKosis(store, { key: KEY, now: NOW, fetcher });
    expect(r).toMatchObject({ status: "error", rows: 0 });
    expect(String(r.message)).toMatch(/30/);
    expect(saved).toEqual([]);
    expect(Object.values(runs).every((x) => x.status === "error")).toBe(true);
  });

  it("한 품목만 실패하면 다른 품목은 저장 (던지지 않음)", async () => {
    const { store, saved } = memoryStore();
    const { fetcher } = byItem(() => json(errJson("40", "분당 초과")), () => json(PACKAGE_TOUR_JSON));
    const r = await collectKosis(store, { key: KEY, now: NOW, fetcher });
    expect(r.status).not.toBe("skipped");
    expect(saved.map((p) => p.series)).toEqual(["kosis-cpi:package-tour", "kosis-cpi:package-tour"]);
  });

  it("HTTP 오류 · 네트워크 오류 · JSON 아닌 응답도 던지지 않음 · 오류 글에 apiKey 가 섞여도 기록에 남기지 않음", async () => {
    for (const fetcher of [
      (async () => new Response("down", { status: 503 })) as typeof fetch,
      (async () => new Response("<html>bad</html>", { status: 200 })) as typeof fetch,
      (async (u) => {
        throw new Error(`fetch failed ${String(u)}`);
      }) as typeof fetch,
    ]) {
      const { store, saved, runs } = memoryStore();
      const r = await collectKosis(store, { key: KEY, now: NOW, fetcher });
      expect(r.status).toBe("error");
      expect(saved).toEqual([]);
      for (const text of [String(r.message), JSON.stringify(runs)]) {
        expect(text).not.toContain(KEY);
        expect(text).not.toContain(encodeURIComponent(KEY));
      }
    }
  });

  it("저장소가 던져도 던지지 않음", async () => {
    const { store } = memoryStore();
    store.savePoints = async () => {
      throw new Error("D1 down");
    };
    const { fetcher } = byItem(() => json(AIR_FARE_JSON), () => json(PACKAGE_TOUR_JSON));
    await expect(collectKosis(store, { key: KEY, now: NOW, fetcher })).resolves.toMatchObject({ status: "error" });
  });
});
