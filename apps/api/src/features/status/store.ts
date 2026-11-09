// 사이트 상태 읽기 — 계산 한 번에 D1 약 45줄
import type { RunRow } from "./status";

export async function statusRows(d1: D1Database, today: string) {
  const [runs, latest, first] = await Promise.all([
    d1.prepare("select started_at as startedAt, source, status, rows, message from fetch_runs order by id desc limit 20").all<RunRow>(),
    d1.prepare("select date from fx_rates order by date desc limit 1").first<{ date: string }>(),
    // 공식(수출입은행) 값만 — 다시 하는 예약은 예비 값만 있으면 다시 돈다 (작업 0121 · 0145)
    d1.prepare("select min(fetched_at) as at from fx_rates where date = ? and source = 'koreaexim'").bind(today).first<{ at: string | null }>(),
  ]);
  return { runs: runs.results ?? [], latestDate: latest?.date ?? null, firstRateAt: first?.at ?? null };
}
