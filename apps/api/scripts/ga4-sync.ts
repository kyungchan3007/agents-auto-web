// GitHub Actions 가 부름: GA4 Data API(runReport) → SQL (표준 출력) · 진행은 표준 오류 · 키 · 토큰은 출력하지 않음 (작업 0324)
//   GSC_SERVICE_ACCOUNT_JSON=... node --experimental-strip-types apps/api/scripts/ga4-sync.ts > .tmp/ga4.sql
//   Search Console 과 같은 서비스 계정 키를 씀(scope 만 analytics.readonly) · 최근 28일을 매일 다시 읽어 덮어씀(GA4 는 며칠 뒤 값이 바뀜)
//   403(권한 없음 · Data API 꺼짐)이면 요약에 남기고 실패 — 값을 지어내지 않음
import { dailyRows, ga4Sql, pageRows, sourceRows } from "../src/features/ga4/report.ts";
import { accessToken } from "../src/features/geo/gsc.ts";

/** GA4 속성 ID — 공개해도 되는 식별자(비밀 아님) · 계정 a417172792 · 속성 flapfx.com */
const GA4_PROPERTY_ID = "565426291";
const SCOPE = "https://www.googleapis.com/auth/analytics.readonly";

const raw = process.env.GSC_SERVICE_ACCOUNT_JSON;
if (!raw) throw new Error("GSC_SERVICE_ACCOUNT_JSON 이 없습니다");
const token = await accessToken(JSON.parse(raw), fetch, Math.floor(Date.now() / 1000), SCOPE);

async function report(label: string, dimensions: string[], metrics: string[]): Promise<unknown> {
  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY_ID}:runReport`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ dateRanges: [{ startDate: "28daysAgo", endDate: "yesterday" }], dimensions: dimensions.map((name) => ({ name })), metrics: metrics.map((name) => ({ name })), limit: "100000" }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) {
    const hint = res.status === 403 ? " — 서비스 계정의 GA4 뷰어 권한 · Analytics Data API 사용 설정을 확인하세요" : "";
    throw new Error(`GA4 조회 실패 (${label}): HTTP ${res.status}${hint}`);
  }
  return res.json();
}

const daily = dailyRows(await report("날짜별", ["date"], ["activeUsers", "sessions", "screenPageViews"]));
const sources = sourceRows(await report("유입 경로", ["date", "sessionSource", "sessionMedium", "sessionCampaignName"], ["sessions", "activeUsers"]));
const pages = pageRows(await report("페이지", ["date", "pagePath"], ["screenPageViews"]));

process.stderr.write(`GA4 날짜 ${daily.length}줄 · 유입 경로 ${sources.length}줄 · 페이지 ${pages.length}줄\n`);
process.stdout.write(`${ga4Sql({ daily, sources, pages })}\n`);
