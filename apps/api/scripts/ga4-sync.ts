// GitHub Actions 가 부름: GA4 Data API(runReport) → SQL (표준 출력) · 진행은 표준 오류 · 키 · 토큰은 출력하지 않음 (작업 0324)
//   GSC_SERVICE_ACCOUNT_JSON=... node --experimental-strip-types apps/api/scripts/ga4-sync.ts > .tmp/ga4.sql
//   Search Console 과 같은 서비스 계정 키를 씀(scope 만 analytics.readonly) · 최근 28일을 매일 다시 읽어 덮어씀(GA4 는 며칠 뒤 값이 바뀜)
//   403(권한 없음 · Data API 꺼짐)이면 요약에 남기고 실패 — 값을 지어내지 않음
import { clickRows, clickSnapshot, clickSql } from "../src/features/ga4/clicks.ts";
import { CLICK_EVENTS_SINCE } from "../../../packages/shared/src/domain/click-events.ts";
import { engagementRows, engagementSnapshot, engagementSql, rangeEndingOn } from "../src/features/ga4/engagement.ts";
import { dailyRows, ga4Sql, pageRows, sourceRows } from "../src/features/ga4/report.ts";
import { accessToken } from "../src/features/geo/gsc.ts";

/** GA4 속성 ID — 공개해도 되는 식별자(비밀 아님) · 계정 a417172792 · 속성 flapfx.com */
const GA4_PROPERTY_ID = "565426291";
const SCOPE = "https://www.googleapis.com/auth/analytics.readonly";

const raw = process.env.GSC_SERVICE_ACCOUNT_JSON;
if (!raw) throw new Error("GSC_SERVICE_ACCOUNT_JSON 이 없습니다");
const token = await accessToken(JSON.parse(raw), fetch, Math.floor(Date.now() / 1000), SCOPE);

async function report(label: string, dimensions: string[], metrics: string[], range = { startDate: "28daysAgo", endDate: "yesterday" }): Promise<unknown> {
  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY_ID}:runReport`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ dateRanges: [range], dimensions: dimensions.map((name) => ({ name })), metrics: metrics.map((name) => ({ name })), limit: "100000" }),
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

// 페이지별 머무름 (작업 0349) — 최근 28일(매일 덮어씀) · 시작 날 기준값은 고정 구간을 요청해 INSERT OR IGNORE 로 처음 한 번만 저장
//   기준 끝 날짜 = 이번 main 반영일(2026-11-25)의 전날 · 이 요청이 실패해도 나머지 수집은 계속(기준값만 못 저장 · 다음 날 다시 시도)
const ENGAGEMENT_METRICS = ["screenPageViews", "sessions", "engagementRate", "bounceRate", "screenPageViewsPerSession"];
const BASELINE_END = "2026-11-24";
const yesterday = new Date(Date.now() + 9 * 3600_000 - 86400_000).toISOString().slice(0, 10); // 한국 날짜 기준 어제
const current = engagementSnapshot(engagementRows(await report("페이지 머무름", ["pagePath"], ENGAGEMENT_METRICS)), rangeEndingOn(yesterday));
let baseline: ReturnType<typeof engagementSnapshot> = null;
try {
  const range = rangeEndingOn(BASELINE_END);
  baseline = engagementSnapshot(engagementRows(await report("페이지 머무름 기준값", ["pagePath"], ENGAGEMENT_METRICS, { startDate: range.from, endDate: range.to })), range);
} catch (e) {
  process.stderr.write(`기준값 요청 실패 — ${e instanceof Error ? e.message : "알 수 없는 오류"}\n`);
}

// 버튼 클릭 수 (작업 0359) — 최근 28일 · eventName 은 이벤트 표(packages/shared)로 거름 · 실패해도 나머지 수집은 계속(다음 날 다시)
const clickRange = rangeEndingOn(yesterday);
let clicks: ReturnType<typeof clickSnapshot> = null;
try {
  clicks = clickSnapshot(clickRows(await report("버튼 클릭", ["date", "eventName"], ["eventCount", "totalUsers"])), clickRange, CLICK_EVENTS_SINCE);
} catch (e) {
  process.stderr.write(`버튼 클릭 요청 실패 — ${e instanceof Error ? e.message : "알 수 없는 오류"}\n`);
}

process.stderr.write(`GA4 날짜 ${daily.length}줄 · 유입 경로 ${sources.length}줄 · 페이지 ${pages.length}줄 · 머무름 ${current ? `${current.pages.length}쪽` : "없음"} · 기준값 ${baseline ? `${baseline.pages.length}쪽` : "없음"} · 버튼 클릭 ${clicks ? `${clicks.events.length}종` : "없음"}\n`);
process.stdout.write(`${[ga4Sql({ daily, sources, pages }), engagementSql(current, new Date().toISOString(), baseline), clickSql(clicks, new Date().toISOString())].filter(Boolean).join("\n")}\n`);
