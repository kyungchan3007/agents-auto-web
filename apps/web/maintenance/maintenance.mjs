// 점검 화면 켜기 · 끄기 (작업 0387) — 사고 때 명령 하나로 · 자세한 쓰임은 docs/maintenance.md
//   npm run maintenance:on  [-- --name <Worker 이름>] [--yes] [--force]   점검 화면을 켬 (켜기 전 지금 배포 버전 ID 를 화면에 찍고 .tmp/maintenance-prev.txt 에 남김)
//   npm run maintenance:off [-- --name <Worker 이름>] [--yes]            남긴 버전 ID 로 되돌림 (wrangler rollback)
// 규칙: 대상 기본은 운영(agents-auto-web) · 운영이면 확인을 묻고 --yes 로 건너뜀 · 시험은 다른 이름(예 flapfx-maint-test) · 토큰 · 비밀값은 쓰지 않음(wrangler 로그인 그대로)
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";
import { DEPLOY_DIR, PREV_FILE, activeVersionId, deployArgs, listArgs, parseArgs, parsePrev, prevText, rollbackArgs } from "./maintenance-lib.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const HERE = dirname(fileURLToPath(import.meta.url));

const fail = (message) => {
  console.error(`오류: ${message}`);
  process.exit(1);
};

const wrangler = (args, { capture = false } = {}) => spawnSync("npx", ["wrangler", ...args], { cwd: ROOT, encoding: "utf8", stdio: capture ? ["inherit", "pipe", "pipe"] : "inherit" });

async function confirm(question) {
  if (!process.stdin.isTTY) fail("운영은 확인이 필요한데 터미널이 아닙니다. --yes 를 붙이세요");
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = (await rl.question(`${question} 계속하려면 '네' 를 입력: `)).trim();
  rl.close();
  if (answer !== "네") fail("취소했습니다");
}

const args = parseArgs(process.argv.slice(2), process.env);
if ("error" in args) fail(args.error);
const prevPath = join(ROOT, PREV_FILE);

if (args.prod && !args.yes) await confirm(`운영 Worker(${args.name})에 점검 화면을 ${args.mode === "on" ? "켭니다" : "끕니다"}.`);

if (args.mode === "on") {
  if (existsSync(prevPath) && !args.force) {
    const prev = parsePrev(readFileSync(prevPath, "utf8"));
    fail(`이미 켠 기록이 있습니다(${prev?.name ?? "?"} · ${prev?.versionId ?? "?"}). 먼저 끄거나, 기록이 낡았으면 --force 를 붙이세요`);
  }
  const list = wrangler(listArgs(args.name), { capture: true });
  if (list.status !== 0) fail(`지금 배포 버전을 읽지 못했습니다 · 로그인과 Worker 이름(${args.name})을 확인하세요\n${list.stderr ?? ""}`);
  let id = null;
  try {
    id = activeVersionId(JSON.parse(list.stdout));
  } catch {
    id = null;
  }
  if (!id) fail("지금 배포된 버전 ID 를 찾지 못했습니다 · 되돌릴 곳을 모르니 켜지 않습니다");
  console.log(`지금 배포된 버전 ID: ${id}  (끄기가 이 ID 로 되돌립니다)`);
  mkdirSync(dirname(prevPath), { recursive: true });
  writeFileSync(prevPath, prevText(id, args.name));
  // 사이트 wrangler.jsonc 를 wrangler 가 위로 거슬러 올라가며 찾아 쓰므로, 설정 없는 임시 폴더로 복사해서 배포
  const dir = join(ROOT, DEPLOY_DIR);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  for (const f of ["worker.ts", "respond.ts", "index.html"]) copyFileSync(join(HERE, f), join(dir, f));
  const dep = wrangler(deployArgs(args.name));
  if (dep.status !== 0) {
    rmSync(prevPath, { force: true });
    fail("점검 화면 배포에 실패했습니다 · 사이트는 그대로입니다");
  }
  console.log(`\n점검 화면을 켰습니다(${args.name}). 확인: curl -I https://<주소>/ → 503 · Retry-After: 3600\n끄기: npm run maintenance:off${args.prod ? " -- --yes" : ` -- --name ${args.name}`}`);
} else {
  const prev = existsSync(prevPath) ? parsePrev(readFileSync(prevPath, "utf8")) : null;
  if (prev?.name && prev.name !== args.name) fail(`기록은 ${prev.name} 의 것입니다 · 대상이 다릅니다(${args.name}). --name ${prev.name} 로 다시 하세요`);
  if (!prev) {
    console.log("남긴 버전 ID 가 없습니다 · 바로 전 배포로 되돌립니다.");
    if (!args.yes) await confirm("바로 전 배포로 되돌립니다.");
  } else console.log(`버전 ID ${prev.versionId} 로 되돌립니다.`);
  const res = wrangler(rollbackArgs(args.name, prev?.versionId ?? null));
  if (res.status !== 0) fail("되돌리기에 실패했습니다 · 기록 파일은 그대로 둡니다");
  rmSync(prevPath, { force: true });
  console.log(`\n점검 화면을 껐습니다(${args.name}). 확인: curl -I https://<주소>/ → 200`);
}
