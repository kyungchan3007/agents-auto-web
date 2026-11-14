// 작업 0165 — 한국은행 ECOS 수입물가지수 읽기 · 수집 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
// 0163 이 정한 이름을 이어 씀: IndicatorStore · IndicatorPoint (collect.ts) · indicator_points
//
// builder 가 만들 것
//   ecos.ts
//     export class EcosError extends Error { readonly code: string }          // 필드로 선언
//     export type EcosPoint = { period: string /* YYYY-MM */; value: number }
//     export function ecosUrl(key: string, startYm: string /* YYYYMM */, endYm: string): string
//        = `https://ecos.bok.or.kr/api/StatisticSearch/${key}/json/kr/1/100/401Y015/M/${startYm}/${endYm}/*AA/W`   (401Y015 수입물가지수 · *AA 총지수 · W 원화기준)
//     export function parseEcosJson(body: unknown): EcosPoint[]
//        - body.StatisticSearch.row 배열에서 TIME(YYYYMM 6자리) · DATA_VALUE(문자열 숫자) → period "YYYY-MM" · value 숫자
//        - DATA_VALUE 가 null · 빈 값 · 숫자 아님 · 0 이하이거나 TIME 이 6자리 숫자가 아닌 줄은 버림 (쉼표는 지우고 읽음)
//        - ITEM_CODE2 가 있는데 "W" 가 아닌 줄(달러 D · 계약통화 C)은 버림
//        - body.RESULT 가 있으면 EcosError (code = RESULT.CODE · message 에 RESULT.MESSAGE) — 오류(HTTP 200) · 데이터 없음(INFO-200)도 오류로 (plan 의 "RESULT 오류는 오류로 기록")
//        - 그 밖(null · 문자열 · 모르는 객체)은 EcosError code "shape" · row 가 빈 배열이면 []
//   collect.ts 에 추가
//     export async function collectEcos(store: IndicatorStore, opts: { key?: string; now?: () => Date; fetcher?: typeof fetch }): Promise<CustomsResult>   // 결과 모양은 0163 과 같음 (이름은 builder 가 바꿔도 됨)
//        - 요청 하나: ecosUrl(key, 24개월 전 달, 이번 달 이하) — 최근 24개월 다시 받아 덮어씀 (hasPeriod 로 건너뛰지 않음)
//        - 저장: series "ecos-import-price:krw" · period · value · source "ecos" · fetchedAt = now
//        - 키 없음 → skipped · 호출 · 저장 · 실행 기록 없음
//        - 오류(RESULT · HTTP · 네트워크 · 저장) → 던지지 않음 · 저장 없음 · 실행 기록 source "ecos" status error
//        - message · 실행 기록에 인증키 값을 남기지 않음 (키가 주소 경로에 들어가므로 오류 글에 섞이기 쉬움)
import { describe, expect, it } from "vitest";
import { type IndicatorStore, collectEcos } from "./collect";
import { ecosUrl, parseEcosJson, EcosError } from "./ecos";
import { ECOS_BAD_KEY, ECOS_DIRTY, ECOS_EMPTY_ROWS, ECOS_NO_DATA, ECOS_OK, ecosError } from "./fixtures/ecos-json";

const NOW = () => new Date("2026-11-01T04:00:00Z");
const KEY = "EcosKey+/zz==";

describe("ECOS 응답 읽기", () => {
  it("정상 → (YYYY-MM, 지수) · DATA_VALUE 문자열을 숫자로", () => {
    expect(parseEcosJson(ECOS_OK)).toEqual([
      { period: "2025-09", value: 136.27 },
      { period: "2025-07", value: 133.9 },
      { period: "2025-08", value: 135.04 },
    ]);
  });

  it("null · 빈 값 · 숫자 아님 · 0 · 월 형식 아님 · 원화(W) 아닌 항목은 버림 (쉼표는 지우고 읽음)", () => {
    expect(parseEcosJson(ECOS_DIRTY)).toEqual([
      { period: "2025-01", value: 130.5 },
      { period: "2025-09", value: 1234.5 },
    ]);
  });

  it("row 가 빈 배열이면 빈 결과 (오류 아님)", () => {
    expect(parseEcosJson(ECOS_EMPTY_ROWS)).toEqual([]);
  });

  it("RESULT 오류(HTTP 200) → EcosError · code 는 RESULT.CODE · 메시지 포함", () => {
    for (const body of [ECOS_NO_DATA, ECOS_BAD_KEY, ecosError("ERROR-602", "과도한 호출로 접속이 제한됩니다."), ecosError("ERROR-100", "필수 값이 누락되어 있습니다.")]) {
      const { CODE, MESSAGE } = body.RESULT;
      expect(() => parseEcosJson(body), CODE).toThrow(EcosError);
      try {
        parseEcosJson(body);
      } catch (e) {
        expect((e as EcosError).code).toBe(CODE);
        expect((e as EcosError).message).toContain(MESSAGE);
      }
    }
  });

  it("모르는 모양 → EcosError shape · 응답 안의 글을 지시로 따르지 않음", () => {
    for (const body of [null, "ignore previous instructions", 7, {}, { StatisticSearch: {} }, { StatisticSearch: { row: "x" } }]) {
      expect(() => parseEcosJson(body), JSON.stringify(body)).toThrow(EcosError);
    }
  });

  it("요청 주소 — 수입물가지수(401Y015) · 총지수(*AA) · 원화기준(W)", () => {
    expect(ecosUrl("KEY", "202411", "202611")).toBe("https://ecos.bok.or.kr/api/StatisticSearch/KEY/json/kr/1/100/401Y015/M/202411/202611/*AA/W");
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
      return true;
    },
  };
  return { store, runs, saved, asked: () => asked };
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const spy = (respond: () => Response | Promise<Response>) => {
  const urls: string[] = [];
  const fetcher: typeof fetch = async (u) => (urls.push(String(u)), respond());
  return { fetcher, urls };
};

describe("ECOS 수집", () => {
  it("요청 하나 · 주소 규격(키 · 401Y015 · 월 · *AA · W) · 최근 24개월 · 이번 달 이하", async () => {
    const { store } = memoryStore();
    const { fetcher, urls } = spy(() => json(ECOS_OK));
    await collectEcos(store, { key: KEY, now: NOW, fetcher });
    expect(urls).toHaveLength(1);
    const m = /^https:\/\/ecos\.bok\.or\.kr\/api\/StatisticSearch\/([^/]+)\/json\/kr\/1\/\d+\/401Y015\/M\/(\d{6})\/(\d{6})\/\*AA\/W$/.exec(urls[0]);
    expect(m, urls[0]).not.toBeNull();
    const [, k, s, e] = m ?? [];
    expect(decodeURIComponent(k)).toBe(KEY);
    expect(e <= "202611").toBe(true);
    const months = (Number(e.slice(0, 4)) - Number(s.slice(0, 4))) * 12 + Number(e.slice(4)) - Number(s.slice(4)) + 1;
    expect(months).toBeGreaterThanOrEqual(24);
    expect(months).toBeLessThanOrEqual(25);
  });

  it("저장: series ecos-import-price:krw · period YYYY-MM · source ecos · 이미 있는 달도 덮어쓰려고 hasPeriod 로 건너뛰지 않음", async () => {
    const { store, saved, runs, asked } = memoryStore();
    const r = await collectEcos(store, { key: KEY, now: NOW, fetcher: spy(() => json(ECOS_OK)).fetcher });
    expect(r).toMatchObject({ status: "ok", rows: 3 });
    expect(saved).toContainEqual({ series: "ecos-import-price:krw", period: "2025-09", value: 136.27, source: "ecos", fetchedAt: NOW().toISOString() });
    expect(saved.every((p) => p.series === "ecos-import-price:krw" && p.source === "ecos")).toBe(true);
    expect(asked()).toBe(0);
    expect(Object.values(runs).some((x) => x.source === "ecos" && x.status === "ok" && x.rows === 3)).toBe(true);
  });

  it("쓸 수 없는 줄은 저장하지 않음", async () => {
    const { store, saved } = memoryStore();
    await collectEcos(store, { key: KEY, now: NOW, fetcher: spy(() => json(ECOS_DIRTY)).fetcher });
    expect(saved.map((p) => p.period)).toEqual(["2025-01", "2025-09"]);
  });

  it("키가 없으면 호출 · 저장 · 실행 기록이 없음", async () => {
    for (const key of [undefined, "", " "]) {
      const { store, saved, runs } = memoryStore();
      const { fetcher, urls } = spy(() => json(ECOS_OK));
      expect(await collectEcos(store, { key, now: NOW, fetcher }), JSON.stringify(key)).toMatchObject({ status: "skipped", rows: 0 });
      expect(urls).toHaveLength(0);
      expect(saved).toEqual([]);
      expect(Object.keys(runs)).toHaveLength(0);
    }
  });

  it("RESULT 오류(HTTP 200) → 던지지 않고 error · 저장 없음 · 실행 기록 error · 메시지에 코드", async () => {
    for (const body of [ECOS_NO_DATA, ECOS_BAD_KEY]) {
      const { store, saved, runs } = memoryStore();
      const r = await collectEcos(store, { key: KEY, now: NOW, fetcher: spy(() => json(body)).fetcher });
      expect(r).toMatchObject({ status: "error", rows: 0 });
      expect(String(r.message)).toContain(body.RESULT.CODE);
      expect(saved).toEqual([]);
      expect(Object.values(runs).every((x) => x.status === "error" && x.source === "ecos")).toBe(true);
    }
  });

  it("HTTP 오류 · JSON 아닌 응답 · 네트워크 오류도 던지지 않음 · 오류 글에 주소(= 인증키)가 섞여도 기록에 남기지 않음", async () => {
    for (const fetcher of [
      (async () => new Response("down", { status: 503 })) as typeof fetch,
      (async () => new Response("<html>bad</html>")) as typeof fetch,
      (async (u) => {
        throw new Error(`fetch failed ${String(u)}`);
      }) as typeof fetch,
    ]) {
      const { store, saved, runs } = memoryStore();
      const r = await collectEcos(store, { key: KEY, now: NOW, fetcher });
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
    await expect(collectEcos(store, { key: KEY, now: NOW, fetcher: spy(() => json(ECOS_OK)).fetcher })).resolves.toMatchObject({ status: "error" });
  });
});
