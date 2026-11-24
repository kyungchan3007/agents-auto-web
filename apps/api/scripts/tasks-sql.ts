// GitHub Actions 가 부름: `gh api --paginate` 출력(JSON 배열 여러 개 · 한 줄씩) → D1 에 넣을 SQL
//   node --experimental-strip-types apps/api/scripts/tasks-sql.ts < .tmp/items.json > .tmp/tasks.sql
import { readFileSync } from "node:fs";
import { toRows, toSql } from "../src/features/tasks/sync.ts";
import { parseJsonStream as parseItems } from "../src/features/tasks/team-snapshot.ts";

const rows = toRows(parseItems(readFileSync(0, "utf8")));
process.stderr.write(`이슈 ${rows.filter((r) => r.kind === "issue").length}개 · 머지된 PR ${rows.filter((r) => r.kind === "pr").length}개\n`);
process.stdout.write(toSql(rows, new Date().toISOString()));
