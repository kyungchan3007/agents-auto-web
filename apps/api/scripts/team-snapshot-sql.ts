// GitHub Actions 가 부름: 오늘 할 일 이슈 · 검사 실행 · PR 목록(파일) → D1 에 넣을 SQL (작업 0341)
//   node --experimental-strip-types apps/api/scripts/team-snapshot-sql.ts .tmp/items.json .tmp/runs.json .tmp/pulls.json > .tmp/team.sql
// 이슈 본문 · 브랜치 이름은 남이 쓴 글 — 셸에 끼우지 않고 파일로만 받고, 변환기가 골라 이스케이프
import { readFileSync } from "node:fs";
import { parseJsonStream, parseTodayItems, pickTodayIssue, snapshotSql, summarizeRuns } from "../src/features/tasks/team-snapshot.ts";

const [issuesFile, runsFile, pullsFile] = process.argv.slice(2);
const read = (f: string | undefined) => (f ? readFileSync(f, "utf8") : "");

const issue = pickTodayIssue(parseJsonStream(read(issuesFile)));
const today = issue ? { number: issue.number, title: issue.title, url: issue.url, items: parseTodayItems(issue.body) } : null;

const runsRaw = parseJsonStream(read(runsFile)).flatMap((v) => ((v as { workflow_runs?: unknown[] })?.workflow_runs ?? []));
const prByBranch: Record<string, { number: number; url: string }> = {};
for (const p of parseJsonStream(read(pullsFile)) as { number?: number; html_url?: string; head?: { ref?: string } }[]) {
  const ref = p?.head?.ref;
  if (typeof ref === "string" && typeof p.number === "number" && typeof p.html_url === "string" && !Object.hasOwn(prByBranch, ref)) prByBranch[ref] = { number: p.number, url: p.html_url };
}
const gate = summarizeRuns(runsRaw, prByBranch);

process.stderr.write(`오늘 할 일 ${today ? `#${today.number} 항목 ${today.items.length}개` : "이슈 없음"} · 검사 ${gate ? `${gate.total}번` : "자료 없음"}\n`);
process.stdout.write(snapshotSql([{ key: "today-issue", value: today }, { key: "gate-runs", value: gate }], new Date().toISOString()));
