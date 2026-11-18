// 이름 바꾼 날 전후 비교 (작업 0205 · #243) — /geo 응답의 날짜별 자료를 기준일(RENAME_DAY) 앞뒤로 나눔 (순수 함수)
//   · 하루 평균의 분모는 그 기간의 달력 날짜 수 — 방문이 0인 날도 센다 (방문 있는 날만 세면 부풀려짐)
//   · 새 필드(daily · answerDays)가 없으면(API 배포 전 · 미리보기) null — 화면이 "아직 없음" 으로 그림 · 숫자를 지어내지 않음
import { RENAME_DAY } from "@hav/shared/geo";
import type { GeoReport } from "@hav/shared/geo";

/** 후 기간이 이 날짜 수보다 짧으면 "참고용" 으로 알림 */
export const SHORT_AFTER_DAYS = 7;

export type Period = { days: number; total: number; perDay: number };
export type DayHits = { day: string; hits: number };
export type BotCompare = { name: string; kind: NonNullable<GeoReport["daily"]>[number]["kind"]; before: Period | null; after: Period | null; daily: DayHits[] };
export type AnswerCount = { measured: number; found: number; cited: number };
export type BrandSummary = AnswerCount & { days: number; first: string; last: string };

const DAY_MS = 86400_000;
const shift = (day: string, n: number) => new Date(Date.parse(`${day}T00:00:00Z`) + n * DAY_MS).toISOString().slice(0, 10);

/** from ~ to 의 모든 날 (양 끝 포함) · from 이 to 보다 뒤면 빈 목록 */
export function dayRange(from: string, to: string): string[] {
  const out: string[] = [];
  for (let d = from; d <= to; d = shift(d, 1)) out.push(d);
  return out;
}

function period(days: string[], byDay: Map<string, number>): Period | null {
  if (days.length === 0) return null;
  const total = days.reduce((n, day) => n + (byDay.get(day) ?? 0), 0);
  return { days: days.length, total, perDay: total / days.length };
}

const group = <T>(list: T[], key: (x: T) => string) => {
  const m = new Map<string, T[]>();
  for (const x of list) m.set(key(x), [...(m.get(key(x)) ?? []), x]);
  return m;
};

export function renameCompare(r: GeoReport, today: string) {
  const dailyRows = r.daily ?? null;
  const lastDaily = dailyRows?.reduce((m, x) => (x.day > m ? x.day : m), "") ?? "";
  const end = lastDaily > today ? lastDaily : today;
  const beforeDays = r.firstDay && r.firstDay < RENAME_DAY ? dayRange(r.firstDay, shift(RENAME_DAY, -1)) : [];
  const afterDays = end >= RENAME_DAY ? dayRange(RENAME_DAY, end) : [];
  const chartDays = r.firstDay ? dayRange(r.firstDay, end) : [];

  const byName = (kinds: (k: string) => boolean) => {
    const rows = (dailyRows ?? []).filter((x) => kinds(x.kind));
    return [...group(rows, (x) => x.name)].map(([name, list]) => {
      const byDay = new Map<string, number>();
      for (const x of list) byDay.set(x.day, (byDay.get(x.day) ?? 0) + x.hits);
      return { name, kind: list[0].kind, byDay, total: list.reduce((n, x) => n + x.hits, 0) };
    });
  };

  const bots: BotCompare[] | null = dailyRows
    ? byName((k) => k !== "referral")
        .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))
        .map((b) => ({ name: b.name, kind: b.kind, before: period(beforeDays, b.byDay), after: period(afterDays, b.byDay), daily: chartDays.map((day) => ({ day, hits: b.byDay.get(day) ?? 0 })) }))
    : null;

  const refs = dailyRows ? byName((k) => k === "referral").sort((a, b) => b.total - a.total || a.name.localeCompare(b.name)) : null;
  const allRef = new Map<string, number>();
  for (const x of refs ?? []) for (const [day, n] of x.byDay) allRef.set(day, (allRef.get(day) ?? 0) + n);
  const referrals = refs
    ? { rows: refs.map((x) => ({ name: x.name, before: period(beforeDays, x.byDay), after: period(afterDays, x.byDay) })), sum: { before: period(beforeDays, allRef), after: period(afterDays, allRef) } }
    : null;

  return {
    day: RENAME_DAY,
    today: end,
    beforeDays: beforeDays.length,
    afterDays: afterDays.length,
    short: afterDays.length < SHORT_AFTER_DAYS,
    bots,
    referrals,
    answers: r.answerDays ? answerCompare(r.answerDays) : null,
    // 새 속성(flapfx.com)은 Search Console 에 등록한 뒤부터 (#214) — 지금은 항상 null
    search: { old: r.search ? { impressions: r.search.impressions, clicks: r.search.clicks, range: r.search.firstDay && r.search.lastDay ? `${r.search.firstDay} ~ ${r.search.lastDay}` : "기록 없음" } : null, newProperty: null },
  };
}

type AnswerDay = NonNullable<GeoReport["answerDays"]>[number];

function count(rows: AnswerDay[]): AnswerCount {
  const ok = rows.filter((x) => x.status === "ok");
  return { measured: ok.length, found: ok.filter((x) => x.found).length, cited: ok.filter((x) => x.cited).length };
}

function answerCompare(rows: AnswerDay[]) {
  // 일반 질문 — 지금 묻는 질문(가장 최근 측정일에 있던 것)만 · 같은 질문 글자끼리 전 · 후 (질문 번호와 글자는 1:1)
  const general = rows.filter((x) => x.group === "general");
  const latest = general.reduce((m, x) => (x.day > m ? x.day : m), "");
  const current = [...new Set(general.filter((x) => x.day === latest).map((x) => x.question))];
  const lines = current.map((question) => {
    const mine = general.filter((x) => x.question === question);
    return { question, before: count(mine.filter((x) => x.day < RENAME_DAY)), after: count(mine.filter((x) => x.day >= RENAME_DAY)) };
  });
  // 브랜드 — 이름이 달라 이어 비교하지 않음 · Tripfx 시기(1 · 2판) / Flapfx 시기(3판)
  const brand = rows.filter((x) => x.group === "brand");
  const summary = (list: AnswerDay[]): BrandSummary | null => {
    if (list.length === 0) return null;
    const days = [...new Set(list.map((x) => x.day))].sort();
    return { ...count(list), days: days.length, first: days[0], last: days.at(-1) as string };
  };
  return { general: lines, brand: { tripfx: summary(brand.filter((x) => x.edition < 3)), flapfx: summary(brand.filter((x) => x.edition === 3)) } };
}
