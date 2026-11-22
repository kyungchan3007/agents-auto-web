// 작업 0234 R9 · R10 — 사이트가 빌드 때 읽는 api.airfareCalendar (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   builder 가 만들 것 — apps/web/src/shared/api.ts 에 airfareCalendar: (o?) => getJson("/airfare/calendar", AirfareCalendar, o)  (AirfareCalendar = @hav/shared/airfare)
import { describe, expect, it } from "vitest";
import { api } from "@hav/shared/api";
import fixture from "../../e2e/fixtures/airfare-calendar.json";

const json = (body: unknown, status = 200) => async () => new Response(JSON.stringify(body), { status });
const quick = { retryDelayMs: 0 };

describe("api.airfareCalendar (빌드 때 받기)", () => {
  it("정상 응답(도시 4곳) → ok · 스키마로 검사된 값", async () => {
    const r = await api.airfareCalendar({ fetcher: json(fixture) });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.cities).toHaveLength(4);
  });
  it("자료가 없는 응답 { fetchedOn: null, cities: [] } 도 ok (구역은 '아직 받지 못했습니다')", async () => {
    const r = await api.airfareCalendar({ fetcher: json({ fetchedOn: null, cities: [] }) });
    expect(r).toMatchObject({ ok: true, data: { fetchedOn: null, cities: [] } });
  });
  it("모양이 다르면 ok false (지어낸 값이 화면에 안 나감) · HTTP 오류 · 연결 실패도 던지지 않음", async () => {
    const bad = await api.airfareCalendar({ fetcher: json({ fetchedOn: "2026-11-19", cities: [{ id: "NRT", city: "도쿄", airport: "NRT", fetchedOn: "2026-11-19", days: [{ depart: "2026-11-20", return: "2026-11-27", price: -1 }] }] }) });
    expect(bad.ok).toBe(false);
    expect(await api.airfareCalendar({ fetcher: json({}, 503), ...quick })).toEqual({ ok: false, reason: "HTTP 503" });
    const down: typeof fetch = async () => { throw new TypeError("fetch failed"); };
    expect(await api.airfareCalendar({ fetcher: down, ...quick })).toEqual({ ok: false, reason: "연결 실패" });
  });
  it("경로는 /airfare/calendar", async () => {
    const seen: string[] = [];
    const f: typeof fetch = async (u) => { seen.push(String(u)); return new Response(JSON.stringify({ fetchedOn: null, cities: [] }), { status: 200 }); };
    await api.airfareCalendar({ fetcher: f, base: "https://example.test" });
    expect(seen[0]).toBe("https://example.test/airfare/calendar");
  });
});
