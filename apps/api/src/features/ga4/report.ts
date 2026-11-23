// GA4 가져오기: Data API runReport 응답 → 행 · upsert SQL (순수 함수 · 작업 0324) — GitHub Actions 가 scripts/ga4-sync.ts 로 부름
//   받은 값만 · 못 받은 값은 지어내지 않고 행을 버림 · 열 위치가 아니라 헤더 이름으로 찾음 · 응답의 글(경로 · utm 값)은 외부 데이터 — SQL 이스케이프 · 제어 문자 제거 · 길이 제한
import { isIsoDate } from "@hav/shared/date";

export type Ga4DailyRow = { day: string; users: number; sessions: number; pageViews: number };
export type Ga4SourceRow = { day: string; source: string; medium: string; campaign: string; sessions: number; users: number };
export type Ga4PageRow = { day: string; path: string; views: number };

const MAX_TEXT = 200;

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const names = (v: unknown): string[] => (Array.isArray(v) ? v.map((h) => (isRecord(h) && typeof h.name === "string" ? h.name : "")) : []);
const values = (v: unknown): (string | null)[] => (Array.isArray(v) ? v.map((x) => (isRecord(x) && typeof x.value === "string" ? x.value : null)) : []);

/** 헤더 이름 → 그 행의 글 */
type Cells = Record<string, string | null>;

/** 응답의 행마다 차원 · 지표를 헤더 이름으로 묶음 — 모양이 다르면 빈 배열 */
function cellsOf(apiJson: unknown, dims: string[], mets: string[]): Cells[] {
  if (!isRecord(apiJson) || !Array.isArray(apiJson.rows)) return [];
  const dh = names(apiJson.dimensionHeaders);
  const mh = names(apiJson.metricHeaders);
  if (![...dims].every((d) => dh.includes(d)) || ![...mets].every((m) => mh.includes(m))) return [];
  return apiJson.rows.flatMap((row) => {
    if (!isRecord(row)) return [];
    const dv = values(row.dimensionValues);
    const mv = values(row.metricValues);
    const out: Cells = {};
    dh.forEach((n, i) => {
      out[n] = dv[i] ?? null;
    });
    mh.forEach((n, i) => {
      out[n] = mv[i] ?? null;
    });
    return [out];
  });
}

/** "20261123" → "2026-11-23" · 달력에 없는 날 · 다른 모양은 null */
const dayOf = (v: string | null | undefined): string | null => {
  if (!v || !/^\d{8}$/.test(v)) return null;
  const d = `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6)}`;
  return isIsoDate(d) ? d : null;
};
/** 0 이상 정수 글만 숫자로 */
const countOf = (v: string | null | undefined): number | null => (v && /^\d+$/.test(v) && Number.isSafeInteger(Number(v)) ? Number(v) : null);
/** 제어 문자는 공백으로 · 200자까지 · 빈 글은 빈 글 */
const textOf = (v: string | null | undefined): string | null => (v === null || v === undefined ? null : v.replace(/[\u0000-\u001f\u007f]/g, " ").slice(0, MAX_TEXT));

export function dailyRows(apiJson: unknown): Ga4DailyRow[] {
  return cellsOf(apiJson, ["date"], ["activeUsers", "sessions", "screenPageViews"]).flatMap((c) => {
    const day = dayOf(c.date);
    const users = countOf(c.activeUsers);
    const sessions = countOf(c.sessions);
    const pageViews = countOf(c.screenPageViews);
    return day && users !== null && sessions !== null && pageViews !== null ? [{ day, users, sessions, pageViews }] : [];
  });
}

export function sourceRows(apiJson: unknown): Ga4SourceRow[] {
  return cellsOf(apiJson, ["date", "sessionSource", "sessionMedium", "sessionCampaignName"], ["sessions", "activeUsers"]).flatMap((c) => {
    const day = dayOf(c.date);
    const source = textOf(c.sessionSource);
    const medium = textOf(c.sessionMedium);
    const campaign = textOf(c.sessionCampaignName);
    const sessions = countOf(c.sessions);
    const users = countOf(c.activeUsers);
    return day && source !== null && medium !== null && campaign !== null && sessions !== null && users !== null ? [{ day, source, medium, campaign, sessions, users }] : [];
  });
}

export function pageRows(apiJson: unknown): Ga4PageRow[] {
  return cellsOf(apiJson, ["date", "pagePath"], ["screenPageViews"]).flatMap((c) => {
    const day = dayOf(c.date);
    const path = textOf(c.pagePath);
    const views = countOf(c.screenPageViews);
    return day && path !== null && views !== null ? [{ day, path, views }] : [];
  });
}

const q = (s: string) => `'${s.replace(/'/g, "''")}'`;
const ok = (...n: number[]) => n.every(Number.isFinite);

/** 같은 키는 덮어씀 — 지난 날 값은 지우지 않음 */
export function ga4Sql(d: { daily: Ga4DailyRow[]; sources: Ga4SourceRow[]; pages: Ga4PageRow[] }): string {
  return [
    ...d.daily.filter((r) => ok(r.users, r.sessions, r.pageViews)).map((r) => `INSERT INTO ga4_daily (day, users, sessions, page_views) VALUES (${q(r.day)}, ${r.users}, ${r.sessions}, ${r.pageViews}) ON CONFLICT (day) DO UPDATE SET users = excluded.users, sessions = excluded.sessions, page_views = excluded.page_views;`),
    ...d.sources.filter((r) => ok(r.sessions, r.users)).map((r) => `INSERT INTO ga4_sources (day, source, medium, campaign, sessions, users) VALUES (${q(r.day)}, ${q(r.source)}, ${q(r.medium)}, ${q(r.campaign)}, ${r.sessions}, ${r.users}) ON CONFLICT (day, source, medium, campaign) DO UPDATE SET sessions = excluded.sessions, users = excluded.users;`),
    ...d.pages.filter((r) => ok(r.views)).map((r) => `INSERT INTO ga4_pages (day, path, views) VALUES (${q(r.day)}, ${q(r.path)}, ${r.views}) ON CONFLICT (day, path) DO UPDATE SET views = excluded.views;`),
  ].join("\n");
}
