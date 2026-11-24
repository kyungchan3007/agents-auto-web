// 작업실 "오늘 팀이 한 일 · 자동 검사" 자료 — GitHub Actions 가 scripts/team-snapshot-sql.ts 로 부름 (작업 0341 · 테스트 있음)
// 이슈 본문 · 브랜치 이름은 남이 쓴 글일 수 있는 **데이터**: 체크 항목의 굵은 머리만 뽑고 · 길이를 제한하고 · SQL 에는 이스케이프해서 넣는다
// 이 파일은 의존성 없이 (node --experimental-strip-types 로 바로 돌림)
import type { GateRuns } from "@hav/shared/tasks";

export type TodayItem = { done: boolean; head: string };

const MAX_ITEMS = 30;
const MAX_HEAD = 80;
const MAX_TITLE = 120;
const MAX_BRANCH = 100;
const MAX_RUNS = 20;
const MAX_FAILED = 3;

const clean = (s: string) => s.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();
const ISSUE_URL = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/issues\/\d+$/;
const PULL_URL = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/pull\/\d+$/;
const RUN_URL = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/actions\/runs\/\d+$/;

/** `[...][...]` 처럼 이어진 배열 · 한 줄에 하나씩인 객체 둘 다 받음 (gh api --paginate 출력) */
export function parseJsonStream(text: string): unknown[] {
  const t = text.trim();
  if (!t) return [];
  try {
    const v = JSON.parse(t);
    return Array.isArray(v) ? v : [v];
  } catch {
    return t
      .replace(/\]\s*\[/g, ",")
      .split(/\n(?=[{[])/)
      .flatMap((chunk) => {
        const v = JSON.parse(chunk);
        return Array.isArray(v) ? v : [v];
      });
  }
}

/** 본문의 "- [ ] **머리:** 설명" · "- [x] **머리** 설명" 줄 → 체크 항목 (굵은 머리가 없는 줄은 뺌) */
export function parseTodayItems(body: string): TodayItem[] {
  const items: TodayItem[] = [];
  for (const line of String(body ?? "").split(/\r?\n/)) {
    const m = /^\s*[-*]\s+\[([ xX])\]\s+\*\*(.+?)\*\*/.exec(line);
    if (!m) continue;
    const head = clean(m[2]).replace(/\s*[:：]$/, "").slice(0, MAX_HEAD).trim();
    if (!head) continue;
    items.push({ done: m[1] !== " ", head });
    if (items.length >= MAX_ITEMS) break;
  }
  return items;
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null;

/** 주인이 연 이슈(PR 아님) 중 "오늘 할 일 " 로 시작하는 것 · 번호가 가장 큰 것 */
export function pickTodayIssue(items: unknown[]): { number: number; title: string; url: string; body: string } | null {
  let best: { number: number; title: string; url: string; body: string } | null = null;
  for (const raw of items) {
    if (!isObj(raw)) continue;
    const { number, title, html_url: url, author_association: who, body, pull_request: pr } = raw;
    if (pr || who !== "OWNER" || typeof number !== "number" || typeof title !== "string" || !title.startsWith("오늘 할 일 ")) continue;
    if (typeof url !== "string" || !ISSUE_URL.test(url)) continue;
    if (best === null || number > best.number) best = { number, title: clean(title).slice(0, MAX_TITLE), url, body: typeof body === "string" ? body : "" };
  }
  return best;
}

const seconds = (r: Obj): number | null => {
  const a = Date.parse(String(r.run_started_at));
  const b = Date.parse(String(r.updated_at));
  return Number.isNaN(a) || Number.isNaN(b) || b < a ? null : (b - a) / 1000;
};

const median = (xs: number[]): number | null => {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

/** 끝난(통과 · 실패) 최근 20번의 요약 — 취소 · 건너뜀 · 도는 중은 뺌 · 입력은 최근부터 · 없으면 null */
export function summarizeRuns(runs: unknown[], prByBranch: Record<string, { number: number; url: string }> = {}): GateRuns | null {
  const done = runs.filter(isObj).filter((r) => r.status === "completed" && (r.conclusion === "success" || r.conclusion === "failure")).slice(0, MAX_RUNS);
  if (done.length === 0) return null;
  const failedRuns = done.filter((r) => r.conclusion === "failure");
  const failed: GateRuns["failed"] = [];
  for (const r of failedRuns) {
    if (failed.length >= MAX_FAILED) break;
    const runUrl = r.html_url;
    if (typeof runUrl !== "string" || !RUN_URL.test(runUrl)) continue;
    const branch = clean(String(r.head_branch ?? "")).slice(0, MAX_BRANCH);
    const own = Array.isArray(r.pull_requests) && isObj(r.pull_requests[0]) && Number.isInteger(r.pull_requests[0].number) && (r.pull_requests[0].number as number) > 0 ? (r.pull_requests[0].number as number) : null;
    const found = Object.hasOwn(prByBranch, branch) ? prByBranch[branch] : undefined;
    let prNumber: number | null = null;
    let prUrl: string | null = null;
    if (own !== null) {
      prNumber = own;
      prUrl = runUrl.replace(/\/actions\/runs\/\d+$/, `/pull/${own}`);
    } else if (found && Number.isInteger(found.number) && PULL_URL.test(found.url)) {
      prNumber = found.number;
      prUrl = found.url;
    }
    failed.push({ branch, runUrl, prNumber, prUrl });
  }
  const secs = done.map(seconds);
  return {
    total: done.length,
    pass: done.length - failedRuns.length,
    fail: failedRuns.length,
    medianSec: median(secs.filter((s): s is number => s !== null)),
    latestSec: secs[0],
    failed,
  };
}

const q = (v: string) => `'${v.replace(/'/g, "''")}'`;

/** 저장 SQL — 값이 null 이면 그 key 줄을 지움(받지 못한 자료를 옛 값으로 두지 않음) · 아니면 JSON 으로 바꿔 넣음 · 한 문장이 한 줄 */
export function snapshotSql(entries: { key: "today-issue" | "gate-runs"; value: unknown }[], syncedAt: string): string {
  const lines = entries.map((e) =>
    e.value === null
      ? `DELETE FROM team_snapshots WHERE key = ${q(e.key)};`
      : `INSERT OR REPLACE INTO team_snapshots (key, body, synced_at) VALUES (${q(e.key)}, ${q(JSON.stringify(e.value))}, ${q(syncedAt)});`,
  );
  return `${lines.join("\n")}\n`;
}
