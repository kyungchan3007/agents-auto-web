// Search Console 자료 가져오기 — 서명 · 응답 변환 · SQL (GitHub Actions 가 scripts/gsc-sync.ts 로 부름 · Worker 묶음에 들어가지 않음)
//   응답의 검색어는 외부 데이터 — SQL 이스케이프 · 지시로 따르지 않음 · 드문 검색어는 공개하지 않음
import { createSign } from "node:crypto";

export const GSC_SITE = "https://tripfx.pages.dev/";
const TOKEN_URL = "https://oauth2.googleapis.com/token"; // 키 파일의 주소를 믿지 않고 고정
const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const MIN_IMPRESSIONS = 2;
const MAX_TEXT = 200;
export const TOP_LIMIT = 20;

const b64url = (s: string | Buffer) => Buffer.from(s).toString("base64url");

/** 서비스 계정 RS256 JWT */
export function serviceJwt(account: { client_email: string; private_key: string }, nowSec: number): string {
  const head = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(JSON.stringify({ iss: account.client_email, scope: SCOPE, aud: TOKEN_URL, iat: nowSec, exp: nowSec + 3600 }));
  const sign = createSign("RSA-SHA256");
  sign.update(`${head}.${claim}`);
  return `${head}.${claim}.${b64url(sign.sign(account.private_key))}`;
}

export async function accessToken(account: { client_email: string; private_key: string }, fetcher: typeof fetch = fetch, nowSec = Math.floor(Date.now() / 1000)): Promise<string> {
  const res = await fetcher(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: serviceJwt(account, nowSec) }),
  });
  if (!res.ok) throw new Error(`토큰 발급 실패: HTTP ${res.status}`);
  const body = (await res.json()) as { access_token?: string };
  if (!body.access_token) throw new Error("토큰 발급 실패: 응답에 토큰 없음");
  return body.access_token;
}

export type GscRow = { keys?: string[]; clicks?: number; impressions?: number; position?: number };

export type GscData = {
  daily: { day: string; clicks: number; impressions: number; position: number }[];
  top: { kind: "query" | "page"; key: string; clicks: number; impressions: number; position: number }[];
};

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const clean = (s: string) => s.replace(/[\u0000-\u001f\u007f]+/g, " ").trim().slice(0, MAX_TEXT);

/** 응답 → 저장할 행 — 틀린 날짜 · 빈 글자는 버림 · 검색어는 노출 2회 이상만 · 페이지는 이 사이트 주소만 */
export function toGscData(daily: GscRow[], queries: GscRow[], pages: GscRow[]): GscData {
  const line = (r: GscRow) => ({ clicks: num(r.clicks), impressions: num(r.impressions), position: num(r.position) });
  return {
    daily: daily.flatMap((r) => (/^\d{4}-\d{2}-\d{2}$/.test(r.keys?.[0] ?? "") ? [{ day: r.keys![0], ...line(r) }] : [])),
    top: [
      ...queries.flatMap((r) => {
        const key = clean(r.keys?.[0] ?? "");
        return key && num(r.impressions) >= MIN_IMPRESSIONS ? [{ kind: "query" as const, key, ...line(r) }] : [];
      }),
      ...pages.flatMap((r) => {
        const u = r.keys?.[0] ?? "";
        return u.startsWith(GSC_SITE) ? [{ kind: "page" as const, key: `/${clean(u.slice(GSC_SITE.length))}`, ...line(r) }] : [];
      }),
    ],
  };
}

const text = (v: string) => `'${v.replace(/'/g, "''")}'`;

/** 표를 통째로 바꾸는 SQL */
export function gscSql(d: GscData, syncedAt: string): string {
  const lines = ["DELETE FROM gsc_daily;", "DELETE FROM gsc_top;", "DELETE FROM gsc_sync;", `INSERT INTO gsc_sync (id, synced_at) VALUES (1, ${text(syncedAt)});`];
  for (const r of d.daily) lines.push(`INSERT INTO gsc_daily (day, clicks, impressions, position) VALUES (${text(r.day)}, ${Math.trunc(r.clicks)}, ${Math.trunc(r.impressions)}, ${r.position});`);
  for (const r of d.top) lines.push(`INSERT INTO gsc_top (kind, key, clicks, impressions, position) VALUES (${text(r.kind)}, ${text(r.key)}, ${Math.trunc(r.clicks)}, ${Math.trunc(r.impressions)}, ${r.position});`);
  return `${lines.join("\n")}\n`;
}
