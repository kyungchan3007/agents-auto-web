// 저장된 행 → 작업 목록 응답 (순수 함수)
import { GateRuns, type TasksSummary, TodayIssue } from "@hav/shared/tasks";
import type { githubItems, taskSnags, teamSnapshots } from "../../db/schema";

/** 행 → 응답 — 이름은 같은 작업 번호면 가장 최근 이슈 · 지난 작업은 머지 최근부터 · 막힘은 0 보다 큰 작업만 */
export function summarize(rows: (typeof githubItems.$inferSelect)[], snagRows: (typeof taskSnags.$inferSelect)[] = [], snapshots: (typeof teamSnapshots.$inferSelect)[] = []): TasksSummary {
  const names: Record<string, string> = {};
  for (const r of [...rows].sort((a, b) => a.number - b.number)) if (r.kind === "issue" && r.task) names[r.task] = r.name;
  const done = rows
    .filter((r): r is typeof r & { mergedAt: string } => r.kind === "pr" && r.mergedAt !== null)
    .map((r) => ({ number: r.number, task: r.task, name: r.name, url: r.url, mergedAt: r.mergedAt }))
    .sort((a, b) => b.mergedAt.localeCompare(a.mergedAt));
  const syncedAt = rows.reduce<string | null>((m, r) => (m === null || r.syncedAt > m ? r.syncedAt : m), null);
  const snags: TasksSummary["snags"] = {};
  for (const s of snagRows) if (s.blocked + s.failed > 0) snags[s.task] = { blocked: s.blocked, failed: s.failed };
  const snagsSince = snagRows.reduce<string | null>((m, s) => (m === null || s.since < m ? s.since : m), null);
  return { names, done, syncedAt, snags, snagsSince, today: snapshotOf(snapshots, "today-issue", TodayIssue), gate: snapshotOf(snapshots, "gate-runs", GateRuns) };
}

/** 저장된 한 장 → 값 — 없거나 JSON 이 깨졌거나 모양이 다르면 null (지어내지 않음) */
function snapshotOf<T>(rows: { key: string; body: string }[], key: string, schema: { safeParse: (v: unknown) => { success: true; data: T } | { success: false } }): T | null {
  const row = rows.find((r) => r.key === key);
  if (!row) return null;
  try {
    const r = schema.safeParse(JSON.parse(row.body));
    return r.success ? r.data : null;
  } catch {
    return null;
  }
}
