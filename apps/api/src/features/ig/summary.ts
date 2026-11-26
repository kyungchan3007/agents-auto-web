// GET /ig 응답 만들기 — D1 에서 읽은 행 → 날짜별 계정 값 · 게시물별 값 (순수 함수 · 작업 0323)
//   받지 못한 값은 null(0 아님) · 받은 0 은 0 · 게시물은 지표마다 가장 최근 날 값 · 목록에 없는 지표 · 게시물은 싣지 않음
import type { IgReport } from "@hav/shared/ig";

export type IgMediaInfo = { mediaId: string; postedAt: string; permalink: string; kind: string };
export type IgMediaInsightRow = { day: string; mediaId: string; metric: string; value: number };
export type IgAccountInsightRow = { day: string; metric: string; value: number };

/** 계정 지표 이름(D1) → 화면용 이름 */
type AccountKey = "reach" | "views" | "profileViews" | "websiteClicks" | "accountsEngaged" | "followers";
const ACCOUNT_METRICS: Record<string, AccountKey | undefined> = { reach: "reach", views: "views", profile_views: "profileViews", website_clicks: "websiteClicks", accounts_engaged: "accountsEngaged", followers_count: "followers" };
const MEDIA_METRICS = ["reach", "likes", "saved", "shares", "views"] as const;
type MediaMetric = (typeof MEDIA_METRICS)[number];
const isMediaMetric = (m: string): m is MediaMetric => (MEDIA_METRICS as readonly string[]).includes(m);

function accountLines(rows: IgAccountInsightRow[]): IgReport["account"] {
  const byDay = new Map<string, IgReport["account"][number]>();
  for (const r of rows) {
    const key = ACCOUNT_METRICS[r.metric];
    if (!key) continue;
    const line = byDay.get(r.day) ?? { day: r.day, reach: null, views: null, profileViews: null, websiteClicks: null, accountsEngaged: null, followers: null };
    line[key] = r.value;
    byDay.set(r.day, line);
  }
  return [...byDay.values()].sort((a, b) => (a.day < b.day ? 1 : -1));
}

function mediaLines(media: IgMediaInfo[], rows: IgMediaInsightRow[]): IgReport["media"] {
  const known = new Set(media.map((m) => m.mediaId));
  // 게시물 · 지표마다 가장 최근 날 값
  const latest = new Map<string, Map<MediaMetric, { day: string; value: number }>>();
  for (const r of rows) {
    if (!known.has(r.mediaId) || !isMediaMetric(r.metric)) continue;
    const m = latest.get(r.mediaId) ?? new Map();
    const cur = m.get(r.metric);
    if (!cur || r.day > cur.day) m.set(r.metric, { day: r.day, value: r.value });
    latest.set(r.mediaId, m);
  }
  return [...media]
    .sort((a, b) => (a.postedAt < b.postedAt ? 1 : -1))
    .map((info) => {
      const m = latest.get(info.mediaId);
      const val = (k: MediaMetric) => m?.get(k)?.value ?? null;
      const days = m ? [...m.values()].map((v) => v.day) : [];
      return { ...info, day: days.length ? days.reduce((a, b) => (a > b ? a : b)) : null, reach: val("reach"), likes: val("likes"), saved: val("saved"), shares: val("shares"), views: val("views") };
    });
}

export const igReport = (media: IgMediaInfo[], mediaInsights: IgMediaInsightRow[], accountInsights: IgAccountInsightRow[]): IgReport => ({ account: accountLines(accountInsights), media: mediaLines(media, mediaInsights) });
