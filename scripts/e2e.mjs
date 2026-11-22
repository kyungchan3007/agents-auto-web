// 두 앱(운영 apps/web · 어드민 apps/admin) e2e 를 나눠 돌림 (작업 0312)
//   node scripts/e2e.mjs [spec 이름 …] [playwright 인자 …]
//   spec 이름을 주면 그 spec 이 있는 앱에서만 · 안 주면 두 앱 모두 전체 · --grep 같은 인자는 두 앱에 그대로
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { basename, join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const APPS = ["web", "admin"];
const args = process.argv.slice(2);
const isSpec = (a) => !a.startsWith("-") && /\.spec\.ts$/.test(a);
const specs = args.filter(isSpec);
const flags = args.filter((a) => !isSpec(a));

let fail = 0;
for (const app of APPS) {
  const dir = join(ROOT, "apps", app);
  const mine = specs.filter((s) => existsSync(join(dir, "e2e", basename(s)))).map((s) => basename(s));
  if (specs.length && !mine.length) continue;
  console.log(`\n▶ e2e — apps/${app}${mine.length ? ` (${mine.join(" ")})` : " (전체)"}`);
  const r = spawnSync("npx", ["playwright", "test", ...mine, ...flags], { cwd: dir, stdio: "inherit" });
  if (r.status !== 0) {
    // 걸러내기(--grep)로 이 앱에 돌릴 테스트가 없으면 실패가 아님 — playwright 는 "No tests found" 로 1 을 돌려줌
    fail = 1;
  }
}
process.exit(fail);
