// GA4 페이지별 머무름 (작업 0349) — Data API 응답 → 페이지별 행 → 저장 SQL · GitHub Actions 가 scripts/ga4-sync.ts 로 부름
//   설치 없이 node 로 바로 도는 스크립트가 가져오는 파일이라 패키지 이름(@hav/*) 가져오기가 없음 (report.ts 와 같음)
//   받은 값만 · 못 받은 값은 지어내지 않고 행을 버림 · 경로는 외부 데이터 — 제어 문자 제거 · 길이 제한 · SQL 이스케이프
//   저장: 새 표 없이 team_snapshots(key · body JSON · synced_at) 두 키 — 'ga4-page-engagement'(매일 덮어씀) · 'ga4-page-engagement-baseline'(INSERT OR IGNORE · 처음 한 번만)
//   지표 정의(GA4): engagementRate = 참여한 세션 ÷ 세션 · bounceRate = 1 − engagementRate · screenPageViewsPerSession = 페이지뷰 ÷ 세션
import { cellsOf, countOf, textOf } from "./report.ts";

export type EngagementRow = { path: string; views: number; sessions: number; engagementRate: number; bounceRate: number; viewsPerSession: number };
export type PageEngagementData = { from: string; to: string; pages: EngagementRow[] };

const TOP = 20;
const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/** 소수 글만 숫자로 (음수 · Infinity · 빈 글은 null) */
const decimalOf = (v: string | null | undefined): number | null => (v && /^\d+(\.\d+)?$/.test(v) && Number.isFinite(Number(v)) ? Number(v) : null);
const rateOf = (v: string | null | undefined): number | null => {
  const n = decimalOf(v);
  return n !== null && n <= 1 ? n : null;
};

export function engagementRows(apiJson: unknown): EngagementRow[] {
  return cellsOf(apiJson, ["pagePath"], ["screenPageViews", "sessions", "engagementRate", "bounceRate", "screenPageViewsPerSession"]).flatMap((c) => {
    const path = textOf(c.pagePath);
    const views = countOf(c.screenPageViews);
    const sessions = countOf(c.sessions);
    const engagementRate = rateOf(c.engagementRate);
    const bounceRate = rateOf(c.bounceRate);
    const viewsPerSession = decimalOf(c.screenPageViewsPerSession);
    return path !== null && views !== null && sessions !== null && engagementRate !== null && bounceRate !== null && viewsPerSession !== null ? [{ path, views, sessions, engagementRate, bounceRate, viewsPerSession }] : [];
  });
}

/** 페이지뷰 많은 순(같으면 경로 글자순) 위 top 개 · 행이 없으면 null (빈 표를 저장하지 않음) */
export function engagementSnapshot(rows: EngagementRow[], range: { from: string; to: string }, top = TOP): PageEngagementData | null {
  if (rows.length === 0) return null;
  const pages = [...rows].sort((a, b) => b.views - a.views || cmp(a.path, b.path)).slice(0, top);
  return { from: range.from, to: range.to, pages };
}

const iso = (t: number) => new Date(t).toISOString().slice(0, 10);

/** end 로 끝나는 days(기본 28)일 구간 — 양끝 포함 (GA4 "28daysAgo ~ yesterday" 와 같은 길이) */
export function rangeEndingOn(end: string, days = 28): { from: string; to: string } {
  const t = Date.parse(`${end}T00:00:00Z`);
  return { from: iso(t - (days - 1) * 86400_000), to: end };
}

const q = (s: string) => `'${s.replace(/'/g, "''")}'`;

/** 오늘 값은 덮어쓰고(INSERT OR REPLACE) · 기준값은 이미 있으면 바뀌지 않음(INSERT OR IGNORE) · null 이면 그 줄을 쓰지 않음(지우지도 않음) */
export function engagementSql(current: PageEngagementData | null, syncedAt: string, baseline: PageEngagementData | null = null): string {
  const put = (verb: "REPLACE" | "IGNORE", key: string, d: PageEngagementData) => `INSERT OR ${verb} INTO team_snapshots (key, body, synced_at) VALUES (${q(key)}, ${q(JSON.stringify(d))}, ${q(syncedAt)});`;
  return [current ? put("REPLACE", "ga4-page-engagement", current) : null, baseline ? put("IGNORE", "ga4-page-engagement-baseline", baseline) : null].filter((l): l is string => l !== null).join("\n");
}

const isDate = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`));
const isRec = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isCount = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v) && v >= 0;
const isRate = (v: unknown): v is number => typeof v === "number" && v >= 0 && v <= 1;

/** 저장된 글 → 데이터 · JSON 이 깨졌거나 모양이 다르면 null */
export function parseEngagement(body: string): PageEngagementData | null {
  let j: unknown;
  try {
    j = JSON.parse(body);
  } catch {
    return null;
  }
  if (!isRec(j) || !isDate(j.from) || !isDate(j.to) || !Array.isArray(j.pages)) return null;
  const pages: EngagementRow[] = [];
  for (const p of j.pages) {
    if (!isRec(p) || typeof p.path !== "string" || !isCount(p.views) || !isCount(p.sessions) || !isRate(p.engagementRate) || !isRate(p.bounceRate) || typeof p.viewsPerSession !== "number" || !(p.viewsPerSession >= 0) || !Number.isFinite(p.viewsPerSession)) return null;
    pages.push({ path: p.path, views: p.views, sessions: p.sessions, engagementRate: p.engagementRate, bounceRate: p.bounceRate, viewsPerSession: p.viewsPerSession });
  }
  return { from: j.from, to: j.to, pages };
}
