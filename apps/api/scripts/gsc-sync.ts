// GitHub Actions 가 부름: Search Console → SQL (표준 출력) · 진행은 표준 오류 · 키 · 토큰은 출력하지 않음
//   GSC_SERVICE_ACCOUNT_JSON=... node --experimental-strip-types apps/api/scripts/gsc-sync.ts > .tmp/gsc.sql
import { GSC_SITE, type GscRow, TOP_LIMIT, accessToken, gscSql, toGscData } from "../src/features/geo/gsc.ts";

const raw = process.env.GSC_SERVICE_ACCOUNT_JSON;
if (!raw) throw new Error("GSC_SERVICE_ACCOUNT_JSON 이 없습니다");
const token = await accessToken(JSON.parse(raw));

const day = (ago: number) => new Date(Date.now() - ago * 86400_000).toISOString().slice(0, 10);
const range = { startDate: day(30), endDate: day(1) };

async function query(dimensions: string[], rowLimit: number): Promise<GscRow[]> {
  const res = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(GSC_SITE)}/searchAnalytics/query`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ ...range, dimensions, rowLimit }),
  });
  if (!res.ok) throw new Error(`Search Console 조회 실패 (${dimensions.join()}): HTTP ${res.status}`);
  return ((await res.json()) as { rows?: GscRow[] }).rows ?? [];
}

const data = toGscData(await query(["date"], 40), await query(["query"], TOP_LIMIT), await query(["page"], TOP_LIMIT));
process.stderr.write(`날짜 ${data.daily.length}줄 · 검색어 · 페이지 ${data.top.length}줄\n`);
process.stdout.write(gscSql(data, new Date().toISOString()));
