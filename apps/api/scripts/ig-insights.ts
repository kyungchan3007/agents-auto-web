// GitHub Actions 가 부름: 인스타 Graph API → SQL (표준 출력) · 진행은 표준 오류 · 토큰은 출력하지 않음 (작업 0323)
//   IG_USER_ID=... IG_ACCESS_TOKEN=... node --experimental-strip-types apps/api/scripts/ig-insights.ts > .tmp/ig.sql
//   받지 못한 지표(오류 · 값 없음)는 행을 만들지 않음 · 오류 문구에서는 토큰을 지움
import { type AccountRow, type MediaInfo, type MediaRow, accountRows, insightsSql, mediaInfoSql, mediaRows, pruneSql, scrubToken } from "../src/features/ig/insights.ts";

const userId = process.env.IG_USER_ID;
const token = process.env.IG_ACCESS_TOKEN;
if (!userId || !token) throw new Error("IG_USER_ID · IG_ACCESS_TOKEN 이 없습니다");

const GRAPH = "https://graph.facebook.com/v23.0";
const MEDIA_METRICS = "reach,likes,saved,shares,views";
const ACCOUNT_METRICS = "reach,views,profile_views,website_clicks,accounts_engaged";
const KEEP_DAYS = 90;
const MEDIA_LIMIT = 50;

const kst = (ms: number) => new Date(ms + 9 * 3600_000).toISOString().slice(0, 10);
const today = kst(Date.now());
const log = (s: string) => process.stderr.write(`${scrubToken(s, token)}\n`);

/** 한 번 읽기 — 토큰은 머리글로 보냄(주소에 남지 않게) · 실패해도 던지지 않고 null (그 지표는 빈 값) */
async function get(path: string, params: Record<string, string>): Promise<unknown> {
  try {
    const res = await fetch(`${GRAPH}${path}?${new URLSearchParams(params)}`, { headers: { authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(20_000) });
    const body: unknown = await res.json().catch(() => null);
    if (!res.ok) log(`${path} HTTP ${res.status}`);
    return body;
  } catch (e) {
    log(`${path} 실패: ${e instanceof Error ? e.message : "알 수 없음"}`);
    return null;
  }
}

// ① 최근 게시물 목록
const list = (await get(`/${userId}/media`, { fields: "id,timestamp,permalink,media_product_type,media_type", limit: String(MEDIA_LIMIT) })) as { data?: { id?: string; timestamp?: string; permalink?: string; media_type?: string }[] } | null;
const media: MediaInfo[] = (list?.data ?? []).flatMap((m) => (m.id && m.timestamp && m.permalink ? [{ mediaId: m.id, postedAt: m.timestamp, permalink: m.permalink, kind: m.media_type ?? "" }] : []));

// ② 게시물마다 성과 (게시 뒤 시간이 지나며 늘어나 매일 다시 읽어 날짜별로 쌓음)
const mediaOut: MediaRow[] = [];
for (const m of media) mediaOut.push(...mediaRows(today, m.mediaId, await get(`/${m.mediaId}/insights`, { metric: MEDIA_METRICS })));

// ③ 계정 지표 — 어제 하루로 좁혀 부름
const since = Math.floor((Date.now() - 86400_000) / 1000);
const until = Math.floor(Date.now() / 1000);
const accountOut: AccountRow[] = accountRows(kst(Date.now() - 86400_000), await get(`/${userId}/insights`, { metric: ACCOUNT_METRICS, metric_type: "total_value", period: "day", since: String(since), until: String(until) }));

log(`게시물 ${media.length}개 · 게시물 값 ${mediaOut.length}줄 · 계정 값 ${accountOut.length}줄`);
process.stdout.write([mediaInfoSql(media), insightsSql([...mediaOut, ...accountOut]), pruneSql(kst(Date.now() - KEEP_DAYS * 86400_000))].filter(Boolean).join("\n") + "\n");
