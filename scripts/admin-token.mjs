// 어드민 토큰 관리 명령 (작업 0326) — 사용자가 자기 맥에서 돌림
//   npm run admin:token -- add <이름> [--exp YYYY-MM-DD]   링크 만들기 (새 링크는 한 번만 출력 · --exp 없으면 발급일 + 7일 · 작업 0330)
//     채용 담당자 공용 링크(작업 0403): add recruiter --exp <1년 뒤 날짜>  (이름은 영문 소문자 · 숫자 · 하이픈 · 기한은 날짜로 길게 줄 수 있음 · 쿠키 유효 기간은 그대로 7일)
//   npm run admin:token -- extend <이름> --exp YYYY-MM-DD   기한만 바꿈 (링크 값 · 해시는 그대로 · owner 는 대상 아님 · 지난 날짜는 실패 · 링크는 출력하지 않음 · 작업 0403)
//   npm run admin:token -- remove <이름>                    링크 지우기 (그 토큰의 쿠키도 바로 무효)
//   npm run admin:token -- list                             이름 · 기한 · 상태 (토큰 · 해시는 안 보임)
//   npm run admin:token -- init                             처음 한 번 — 없는 비밀값만 만들고 owner 링크 출력
//   (선택) --versions  최신 버전이 운영에 배포되지 않아 비밀값 넣기가 실패할 때 — 새 버전에 넣고(배포는 안 함) 그 버전을 따로 배포 (작업 0329)
// 규칙: 목록은 해시만(.tmp/admin-tokens.json · git 무시) · 토큰 원문 · 열쇠 값은 파일 · 로그에 남기지 않음 · 이미 있는 비밀값은 덮어쓰지 않음
// 어드민 Worker 비밀값: ADMIN_TOKENS · ADMIN_SESSION_SECRET · ADMIN_API_KEY / API Worker: ADMIN_API_KEY (같은 값)
// tripfx-api 의 ADMIN_TOKEN(단수) · ACTIVITY_TOKEN 은 다른 용도 — 건드리지 않음
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { OWNER, addEntry, expFor, extendEntry, hasVersionsFlag, hashToken, linkFor, listRows, newToken, removeEntry, secretPayload, secretPutArgs, versionsPutNotice, wranglerFailureText } from "./admin-token-lib.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ADMIN_CONFIG = "apps/admin/wrangler.jsonc";
const API_CONFIG = "apps/api/wrangler.jsonc";
const LOCAL = join(ROOT, ".tmp", "admin-tokens.json");

const fail = (message) => {
  console.error(`오류: ${message}`);
  process.exit(1);
};

function wrangler(args, input) {
  const r = spawnSync("npx", ["wrangler", ...args], { cwd: ROOT, input, encoding: "utf8" });
  if (r.status !== 0) fail(wranglerFailureText(args, `${r.stderr ?? ""}\n${r.stdout ?? ""}`, args[args.indexOf("--config") + 1] ?? ""));
  return r.stdout;
}

/** 비밀값 이름만(값은 읽을 수 없음) */
function secretNames(config) {
  const out = wrangler(["secret", "list", "--format", "json", "--config", config]);
  try {
    return new Set(JSON.parse(out).map((s) => s.name));
  } catch {
    return fail("wrangler secret list 결과를 읽지 못했습니다");
  }
}

const argv = process.argv.slice(2);
const VERSIONS = hasVersionsFlag(argv);
const versionConfigs = new Set();

function putSecret(config, name, value) {
  if (VERSIONS) versionConfigs.add(config);
  return wrangler(secretPutArgs(name, config, { versions: VERSIONS }), value);
}

function readLocal() {
  if (!existsSync(LOCAL)) return null;
  try {
    return JSON.parse(readFileSync(LOCAL, "utf8"));
  } catch {
    return fail(`${LOCAL} 을 읽지 못했습니다`);
  }
}

function writeLocal(list) {
  mkdirSync(dirname(LOCAL), { recursive: true });
  writeFileSync(LOCAL, `${JSON.stringify(list, null, 2)}\n`);
}

/** 목록을 올린 뒤에만 로컬에 저장 — 올리기가 실패하면 로컬도 그대로 */
function publish(list) {
  putSecret(ADMIN_CONFIG, "ADMIN_TOKENS", secretPayload(list));
  writeLocal(list);
}

/** 로컬 목록이 없는데 ADMIN_TOKENS 가 이미 있으면 — 다시 읽을 수 없으므로 덮어쓰지 않고 멈춤 */
function loadList() {
  const local = readLocal();
  if (local) return local;
  if (secretNames(ADMIN_CONFIG).has("ADMIN_TOKENS")) fail("ADMIN_TOKENS 가 이미 있는데 로컬 목록(.tmp/admin-tokens.json)이 없습니다 — 덮어쓰면 기존 링크를 잃으므로 멈춥니다");
  return {};
}

const flag = (args, name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

const [cmd, ...rest] = argv.filter((a) => a !== "--versions");
const today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);

if (cmd === "add") {
  const name = rest[0];
  if (!name) fail("사용법: add <이름> [--exp YYYY-MM-DD]");
  const exp = expFor(name, flag(rest, "--exp"), today);
  const token = newToken();
  let list;
  try {
    list = addEntry(loadList(), name, await hashToken(token), exp);
  } catch (e) {
    fail(e.message);
  }
  publish(list);
  console.log(`만들었습니다: ${name}${exp ? ` (기한 ${exp})` : ""}\n새 링크 (이 화면에서만 보입니다 — 지금 복사하세요):\n${linkFor(token)}`);
} else if (cmd === "extend") {
  const name = rest[0];
  const exp = flag(rest, "--exp");
  if (!name || !exp) fail("사용법: extend <이름> --exp YYYY-MM-DD");
  let list;
  try {
    list = extendEntry(loadList(), name, exp, today);
  } catch (e) {
    fail(e.message);
  }
  publish(list);
  console.log(`기한을 바꿨습니다: ${name} (기한 ${exp} · 링크는 그대로)`);
} else if (cmd === "remove") {
  const name = rest[0];
  if (!name) fail("사용법: remove <이름>");
  let list;
  try {
    list = removeEntry(loadList(), name);
  } catch (e) {
    fail(e.message);
  }
  publish(list);
  console.log(`지웠습니다: ${name} (이 토큰의 쿠키도 바로 무효)`);
} else if (cmd === "list") {
  const rows = listRows(readLocal() ?? {}, today);
  if (rows.length === 0) console.log("등록된 토큰이 없습니다");
  for (const r of rows) console.log(`${r.name}\t${r.exp ?? "기한 없음"}\t${r.status}${r.owner ? "\t본인용" : ""}`);
} else if (cmd === "init") {
  const admin = secretNames(ADMIN_CONFIG);
  const api = secretNames(API_CONFIG);
  // 같은 값이어야 하는 열쇠 — 한쪽만 있으면 값을 읽을 수 없어 맞출 수 없음(덮어쓰지 않고 멈춤)
  if (admin.has("ADMIN_API_KEY") !== api.has("ADMIN_API_KEY")) fail("ADMIN_API_KEY 가 한쪽 Worker 에만 있습니다 — 값을 읽을 수 없어 맞출 수 없으니 두 Worker 모두 다시 등록해 주세요");
  const made = [];
  if (!admin.has("ADMIN_SESSION_SECRET")) {
    putSecret(ADMIN_CONFIG, "ADMIN_SESSION_SECRET", newToken());
    made.push("ADMIN_SESSION_SECRET");
  }
  if (!admin.has("ADMIN_API_KEY")) {
    const key = newToken();
    putSecret(ADMIN_CONFIG, "ADMIN_API_KEY", key);
    putSecret(API_CONFIG, "ADMIN_API_KEY", key);
    made.push("ADMIN_API_KEY");
  }
  let link = null;
  const list = loadList();
  if (!Object.hasOwn(list, OWNER)) {
    const token = newToken();
    publish(addEntry(list, OWNER, await hashToken(token)));
    made.push("ADMIN_TOKENS(owner)");
    link = linkFor(token);
  }
  console.log(made.length ? `새로 만든 비밀값: ${made.join(", ")}` : "새로 만들 것이 없습니다 (이미 모두 있음)");
  if (link) console.log(`본인(owner) 링크 (이 화면에서만 보입니다 — 지금 복사하세요):\n${link}`);
} else {
  fail("사용법: add <이름> [--exp YYYY-MM-DD] | extend <이름> --exp YYYY-MM-DD | remove <이름> | list | init");
}

// --versions 로 넣었으면 배포 안내 (비밀값 글은 출력하지 않음)
for (const config of versionConfigs) console.log(versionsPutNotice(config));
