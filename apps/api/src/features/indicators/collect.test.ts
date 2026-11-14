// 작업 0163 — 과세환율 수집 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//
// builder 가 만들 것 — apps/api/src/features/indicators/collect.ts
//   export type IndicatorPoint = { series: string; period: string; value: number; source: "kcs" | "kosis" | "ecos"; fetchedAt: string }
//   export interface IndicatorStore {
//     startRun(source: string, startedAt: string): Promise<number>          // 기존 db/runs.ts runLog 와 같은 모양 (fetch_runs)
//     finishRun(id: number, r: { source: string; status: "ok" | "empty" | "error"; rows: number; message: string | null; finishedAt: string }): Promise<void>
//     savePoints(rows: IndicatorPoint[]): Promise<number>                  // 같은 (series, period) 는 덮어씀
//     hasPeriod(series: string, period: string): Promise<boolean>          // 그 주가 이미 저장됐는지
//   }
//   export type CustomsResult = { status: "ok" | "empty" | "error" | "skipped" | "already"; rows: number; message: string | null }
//   export async function collectCustomsRates(store: IndicatorStore, opts: { key?: string; today: string /* 한국 날짜 YYYY-MM-DD */; fetcher?: typeof fetch; now?: () => Date }): Promise<CustomsResult>
//   규칙
//     - series = `kcs-import:${통화}` (예 kcs-import:USD) · period = 응답의 적용 시작일 YYYY-MM-DD · value = 1단위당 원 · source "kcs"
//     - 요청: GET KCS_URL?serviceKey=<key>&aplyBgnDt=<today YYYYMMDD>&weekFxrtTpcd=2 (수입)
//     - key 없음 → skipped · 호출 · 저장 · 실행 기록 모두 없음
//     - 이번 주(today 가 속한 일요일 시작 주)가 이미 저장돼 있으면(hasPeriod("kcs-import:USD", 그 일요일)) already · 호출 · 실행 기록 없음
//     - 성공 → startRun("kcs") · finishRun(status ok · rows) · 저장
//     - 오류(resultCode ≠ 00 · 게이트웨이 오류 · HTTP 오류 · 네트워크 오류 · 저장 오류) → 절대 던지지 않고 status "error" · 아무것도 저장하지 않음 · 실행 기록은 error
//     - message 와 실행 기록에 인증키 값을 남기지 않음 (AGENTS 규칙 6)
import { describe, expect, it } from "vitest";
import { type CustomsResult, type IndicatorPoint, type IndicatorStore, collectCustomsRates } from "./collect";
import { DIRTY_XML, EMPTY_XML, GATEWAY_ERROR_XML, LAST_WEEK_XML, THIS_WEEK_XML, errorXml } from "./fixtures/kcs-xml";

const NOW = () => new Date("2026-11-18T03:00:00Z"); // 수요일 12:00 KST
const TODAY = "2026-11-18"; // 이 주 일요일 시작 = 2026-11-15
const KEY = "S3cr3t+Key/with==chars";

function memoryStore(already: string[] = []) {
  const runs: Record<number, Record<string, unknown>> = {};
  const saved: IndicatorPoint[] = [];
  const asked: string[] = [];
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
      saved.push(...rows);
      return rows.length;
    },
    async hasPeriod(series, period) {
      asked.push(`${series}|${period}`);
      return already.includes(`${series}|${period}`);
    },
  };
  return { store, runs, saved, asked };
}

const xml = (body: string, status = 200) => new Response(body, { status, headers: { "content-type": "application/xml" } });
const spyFetch = (respond: () => Response | Promise<Response>) => {
  const urls: URL[] = [];
  const fetcher: typeof fetch = async (u) => (urls.push(new URL(String(u))), respond());
  return { fetcher, urls };
};
// 키를 안 넘기면 KEY · undefined 를 넘기면 그대로 undefined (기본값 매개변수는 undefined 를 KEY 로 바꿔서 쓰지 않음)
const run = (store: IndicatorStore, fetcher: typeof fetch, ...k: [key?: string | undefined]): Promise<CustomsResult> => collectCustomsRates(store, { key: k.length > 0 ? k[0] : KEY, today: TODAY, fetcher, now: NOW });

describe("과세환율 수집 — 정상", () => {
  it("저장: series kcs-import:통화 · period 적용 시작일 · value 1단위당 원 · source kcs", async () => {
    const { store, saved, runs } = memoryStore();
    const { fetcher } = spyFetch(() => xml(THIS_WEEK_XML));
    const r = await run(store, fetcher);
    expect(r).toMatchObject({ status: "ok", rows: 2 });
    expect(saved).toEqual([
      { series: "kcs-import:AED", period: "2026-11-15", value: 302.7, source: "kcs", fetchedAt: NOW().toISOString() },
      { series: "kcs-import:ZAR", period: "2026-11-15", value: 95.93, source: "kcs", fetchedAt: NOW().toISOString() },
    ]);
    expect(runs[1]).toMatchObject({ source: "kcs", status: "ok", rows: 2 });
  });

  it("요청: 공식 주소 · serviceKey(인코딩해도 원래 값) · aplyBgnDt 는 오늘 · weekFxrtTpcd=2(수입)", async () => {
    const { store } = memoryStore();
    const { fetcher, urls } = spyFetch(() => xml(THIS_WEEK_XML));
    await run(store, fetcher);
    expect(urls).toHaveLength(1);
    expect(urls[0].origin + urls[0].pathname).toBe("https://apis.data.go.kr/1220000/retrieveTrifFxrtInfo/getRetrieveTrifFxrtInfo");
    expect(urls[0].searchParams.get("serviceKey")).toBe(KEY);
    expect(urls[0].searchParams.get("aplyBgnDt")).toBe("20261118");
    expect(urls[0].searchParams.get("weekFxrtTpcd")).toBe("2");
  });

  it("쓸 수 없는 줄(빈 값 · 숫자 아님)은 저장하지 않음", async () => {
    const { store, saved } = memoryStore();
    await run(store, spyFetch(() => xml(DIRTY_XML)).fetcher);
    expect(saved.map((p) => p.series)).toEqual(["kcs-import:AED", "kcs-import:EUR"]);
  });

  it("응답의 적용 시작일이 지난주면 그 주로 저장 (이번 주 고시가 아직 없을 때) · 이번 주는 여전히 '없음'", async () => {
    const { store, saved } = memoryStore();
    await run(store, spyFetch(() => xml(LAST_WEEK_XML)).fetcher);
    expect(saved).toEqual([{ series: "kcs-import:AED", period: "2026-11-08", value: 300.1, source: "kcs", fetchedAt: NOW().toISOString() }]);
    expect(await store.hasPeriod("kcs-import:AED", "2026-11-15")).toBe(false);
  });

  it("항목이 없으면 empty · 저장 없음 · 실행 기록 empty", async () => {
    const { store, saved, runs } = memoryStore();
    const r = await run(store, spyFetch(() => xml(EMPTY_XML)).fetcher);
    expect(r).toMatchObject({ status: "empty", rows: 0 });
    expect(saved).toEqual([]);
    expect(runs[1]).toMatchObject({ status: "empty", rows: 0 });
  });
});

describe("과세환율 수집 — 키 없음 · 이미 받은 주는 건너뜀", () => {
  it("키가 없으면(undefined · 빈 글) 호출 · 저장 · 실행 기록 모두 없음", async () => {
    for (const key of [undefined, "", "  "]) {
      const { store, saved, runs } = memoryStore();
      const { fetcher, urls } = spyFetch(() => xml(THIS_WEEK_XML));
      const r = await run(store, fetcher, key);
      expect(r, JSON.stringify(key)).toMatchObject({ status: "skipped", rows: 0 });
      expect(urls).toHaveLength(0);
      expect(saved).toEqual([]);
      expect(Object.keys(runs)).toHaveLength(0);
    }
  });

  it("이번 주(일요일 2026-11-15 시작)가 이미 저장돼 있으면 호출하지 않음", async () => {
    const { store, saved, runs, asked } = memoryStore(["kcs-import:USD|2026-11-15"]);
    const { fetcher, urls } = spyFetch(() => xml(THIS_WEEK_XML));
    const r = await run(store, fetcher);
    expect(r).toMatchObject({ status: "already", rows: 0 });
    expect(asked).toContain("kcs-import:USD|2026-11-15"); // today 가 속한 주의 일요일로 물음 (수요일 → 11-15)
    expect(urls).toHaveLength(0);
    expect(saved).toEqual([]);
    expect(Object.keys(runs)).toHaveLength(0);
  });

  it("지난주만 저장돼 있으면 새로 받음", async () => {
    const { store } = memoryStore(["kcs-import:USD|2026-11-08"]);
    const { fetcher, urls } = spyFetch(() => xml(THIS_WEEK_XML));
    expect(await run(store, fetcher)).toMatchObject({ status: "ok" });
    expect(urls).toHaveLength(1);
  });

  it("일요일에 불러도 그 날이 주의 시작 (오늘 2026-11-15 → 11-15 · 토요일 2026-11-21 → 11-15)", async () => {
    for (const today of ["2026-11-15", "2026-11-21"]) {
      const { store, asked } = memoryStore();
      await collectCustomsRates(store, { key: KEY, today, fetcher: spyFetch(() => xml(THIS_WEEK_XML)).fetcher, now: NOW });
      expect(asked[0], today).toBe("kcs-import:USD|2026-11-15");
    }
  });
});

describe("과세환율 수집 — 실패해도 던지지 않고 저장하지 않음", () => {
  const cases: [string, () => Response | Promise<Response>, RegExp][] = [
    ["resultCode 03", () => xml(errorXml("03", "인증에 실패하였습니다.")), /03/],
    ["게이트웨이 오류 30", () => xml(GATEWAY_ERROR_XML), /30/],
    ["HTTP 401 (키 없음 응답)", () => xml("<OpenAPI_ServiceResponse/>", 401), /401|http/i],
    ["HTTP 500", () => xml("oops", 500), /500|http/i],
    ["XML 아닌 응답", () => xml("<html>bad gateway</html>"), /shape|형식|응답/i],
  ];
  for (const [name, respond, msg] of cases) {
    it(`${name} → status error · 저장 없음 · 실행 기록 error`, async () => {
      const { store, saved, runs } = memoryStore();
      const r = await run(store, spyFetch(respond).fetcher);
      expect(r.status).toBe("error");
      expect(r.rows).toBe(0);
      expect(String(r.message)).toMatch(msg);
      expect(saved).toEqual([]);
      expect(runs[1]).toMatchObject({ source: "kcs", status: "error", rows: 0 });
    });
  }

  it("네트워크 오류(fetch 가 던짐)도 던지지 않음 · 오류 글에 인증키가 섞여도 기록에 남기지 않음", async () => {
    const { store, saved, runs } = memoryStore();
    const fetcher: typeof fetch = async (u) => {
      throw new Error(`fetch failed: ${String(u)}`); // 주소(= 인증키 포함)가 오류 글에 섞임
    };
    const r = await run(store, fetcher);
    expect(r.status).toBe("error");
    expect(saved).toEqual([]);
    for (const text of [String(r.message), JSON.stringify(runs)]) {
      expect(text).not.toContain(KEY);
      expect(text).not.toContain(encodeURIComponent(KEY));
    }
  });

  it("저장소가 던져도 던지지 않음 (savePoints 실패 → error)", async () => {
    const { store } = memoryStore();
    store.savePoints = async () => {
      throw new Error("D1 down");
    };
    const r = await run(store, spyFetch(() => xml(THIS_WEEK_XML)).fetcher);
    expect(r).toMatchObject({ status: "error", rows: 0 });
    expect(String(r.message)).toMatch(/D1 down/);
  });

  it("실행 기록 시작이 실패해도 던지지 않음 (환율 수집에 번지지 않게)", async () => {
    const { store } = memoryStore();
    store.startRun = async () => {
      throw new Error("fetch_runs down");
    };
    await expect(run(store, spyFetch(() => xml(THIS_WEEK_XML)).fetcher)).resolves.toMatchObject({ status: "error" });
  });
});
