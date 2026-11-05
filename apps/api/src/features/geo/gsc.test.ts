import { createVerify, generateKeyPairSync } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { accessToken, gscSql, serviceJwt, toGscData } from "./gsc";
import { searchSummary } from "./summary";

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const account = { client_email: "x@y.iam.gserviceaccount.com", private_key: privateKey.export({ type: "pkcs8", format: "pem" }).toString() };

describe("Search Console 가져오기 (작업 0130)", () => {
  it("서명이 맞고 범위는 읽기만", () => {
    const [h, c, s] = serviceJwt(account, 1000).split(".");
    const v = createVerify("RSA-SHA256");
    v.update(`${h}.${c}`);
    expect(v.verify(publicKey, Buffer.from(s, "base64url"))).toBe(true);
    const claim = JSON.parse(Buffer.from(c, "base64url").toString());
    expect(claim.scope).toBe("https://www.googleapis.com/auth/webmasters.readonly");
    expect(claim.exp - claim.iat).toBe(3600);
  });
  it("토큰 실패에 키나 응답 본문을 싣지 않음", async () => {
    const fetcher = vi.fn(async () => new Response("secret-body", { status: 400 })) as unknown as typeof fetch;
    const e = await accessToken(account, fetcher).catch((x: Error) => x.message);
    expect(e).toBe("토큰 발급 실패: HTTP 400");
  });
  it("드문 검색어 · 다른 사이트 주소 · 틀린 날짜는 버림", () => {
    const d = toGscData(
      [{ keys: ["2026-11-01"], clicks: 1, impressions: 5, position: 3.5 }, { keys: ["틀림"], clicks: 1 }],
      [{ keys: ["달러 환율"], clicks: 0, impressions: 2, position: 8 }, { keys: ["개인 이름"], impressions: 1 }, { keys: [""], impressions: 9 }],
      [{ keys: ["https://tripfx.pages.dev/calc"], clicks: 1, impressions: 3, position: 2 }, { keys: ["https://evil.example/x"], impressions: 9 }],
    );
    expect(d.daily.map((r) => r.day)).toEqual(["2026-11-01"]);
    expect(d.top.map((r) => r.key)).toEqual(["달러 환율", "/calc"]);
  });
  it("SQL 이스케이프 — 검색어는 데이터", () => {
    const sql = gscSql({ daily: [], top: [{ kind: "query", key: "x'); DROP TABLE fx_rates; --", clicks: 1, impressions: 2, position: 1.5 }] }, "2026-11-05T00:00:00.000Z");
    expect(sql).toContain("'x''); DROP TABLE fx_rates; --'");
    expect(sql.startsWith("DELETE FROM gsc_daily;")).toBe(true);
  });
});

describe("검색 요약 (작업 0130)", () => {
  it("합계 · 노출 가중 평균 순위 · 나눠 담기", () => {
    const s = searchSummary({
      syncedAt: "2026-11-05T00:00:00.000Z",
      daily: [{ day: "2026-11-01", clicks: 1, impressions: 10, position: 4 }, { day: "2026-11-02", clicks: 2, impressions: 30, position: 8 }],
      top: [{ kind: "query", key: "달러", clicks: 1, impressions: 2, position: 3 }, { kind: "page", key: "/", clicks: 2, impressions: 3, position: 2 }],
    });
    expect(s).toMatchObject({ clicks: 3, impressions: 40, position: 7, firstDay: "2026-11-01", lastDay: "2026-11-02" });
    expect(s?.queries[0].key).toBe("달러");
    expect(s?.pages[0].key).toBe("/");
  });
  it("가져온 적이 없으면 null · 가져왔는데 비면 0", () => {
    expect(searchSummary({ syncedAt: null, daily: [], top: [] })).toBeNull();
    expect(searchSummary({ syncedAt: "2026-11-05T00:00:00.000Z", daily: [], top: [] })).toMatchObject({ clicks: 0, impressions: 0, position: null, firstDay: null });
  });
});
