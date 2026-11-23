import { createVerify, generateKeyPairSync } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { GSC_SITE, accessToken, gscSql, serviceJwt, toGscData } from "./gsc";
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
      [
        { keys: ["https://flapfx.com/calc"], clicks: 1, impressions: 3, position: 2 },
        { keys: ["https://www.flapfx.com/prices"], impressions: 2 },
        { keys: ["https://tripfx.pages.dev/geo"], impressions: 4 },
        { keys: ["https://flapfx.com.evil.example/x"], impressions: 9 },
        { keys: ["https://evil.example/x"], impressions: 9 },
      ],
    );
    expect(d.daily.map((r) => r.day)).toEqual(["2026-11-01"]);
    expect(d.top.map((r) => r.key)).toEqual(["달러 환율", "/calc", "/prices"]);
  });
  it("SQL 이스케이프 — 검색어는 데이터", () => {
    const sql = gscSql({ daily: [], top: [{ kind: "query", key: "x'); DROP TABLE fx_rates; --", clicks: 1, impressions: 2, position: 1.5 }] }, "2026-11-05T00:00:00.000Z");
    expect(sql).toContain("'x''); DROP TABLE fx_rates; --'");
    expect(sql.startsWith("DELETE FROM gsc_daily;")).toBe(true);
  });
});

it("속성은 도메인 속성 sc-domain:flapfx.com (작업 0206)", () => {
  expect(GSC_SITE).toBe("sc-domain:flapfx.com");
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

// 작업 0324 — GA4 도 같은 서비스 계정을 쓰도록 scope 를 인자로 받음 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   serviceJwt(account, nowSec, scope?) · accessToken(account, fetcher?, nowSec?, scope?) — 인자가 없으면 지금처럼 Search Console(webmasters.readonly)
describe("서비스 계정 scope 인자 (작업 0324)", () => {
  const GA4_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
  const claimOf = (jwt: string) => JSON.parse(Buffer.from(jwt.split(".")[1] ?? "", "base64url").toString());

  it("scope 를 주면 그 scope 로 서명 · 서명은 여전히 맞음 · 시간 · 발급자는 그대로", () => {
    const jwt = serviceJwt(account, 1000, GA4_SCOPE);
    const [h, c, s] = jwt.split(".");
    const v = createVerify("RSA-SHA256");
    v.update(`${h}.${c}`);
    expect(v.verify(publicKey, Buffer.from(s ?? "", "base64url"))).toBe(true);
    const claim = claimOf(jwt);
    expect(claim.scope).toBe(GA4_SCOPE);
    expect(claim.iss).toBe(account.client_email);
    expect(claim.exp - claim.iat).toBe(3600);
  });

  it("scope 를 안 주면 지금처럼 Search Console 읽기 전용 — 기존 동작 그대로", () => {
    expect(claimOf(serviceJwt(account, 1000)).scope).toBe("https://www.googleapis.com/auth/webmasters.readonly");
    expect(claimOf(serviceJwt(account, 1000, undefined)).scope).toBe("https://www.googleapis.com/auth/webmasters.readonly");
  });

  it("accessToken 도 scope 를 서명에 실어 보냄 · 안 주면 Search Console", async () => {
    const seen: string[] = [];
    const fetcher = vi.fn(async (_url: unknown, init?: { body?: unknown }) => {
      seen.push(String(new URLSearchParams(String(init?.body ?? "")).get("assertion")));
      return new Response(JSON.stringify({ access_token: "tok" }), { status: 200 });
    }) as unknown as typeof fetch;
    expect(await accessToken(account, fetcher, 1000, GA4_SCOPE)).toBe("tok");
    expect(await accessToken(account, fetcher, 1000)).toBe("tok");
    expect(claimOf(seen[0] ?? "").scope).toBe(GA4_SCOPE);
    expect(claimOf(seen[1] ?? "").scope).toBe("https://www.googleapis.com/auth/webmasters.readonly");
  });

  it("GA4 scope 로도 토큰 실패 글에 키나 응답 본문을 싣지 않음", async () => {
    const fetcher = vi.fn(async () => new Response("secret-body", { status: 403 })) as unknown as typeof fetch;
    const e = await accessToken(account, fetcher, 1000, GA4_SCOPE).catch((x: Error) => x.message);
    expect(e).toBe("토큰 발급 실패: HTTP 403");
  });
});
