// 어드민 토큰 관리 명령 (작업 0326) — 사용자가 자기 맥에서 돌림
//   npm run admin:token -- add <이름> [--exp YYYY-MM-DD]   지원 링크 만들기 (새 링크는 한 번만 출력 · --exp 없으면 발급일 + 7일 · 작업 0330)
//   npm run admin:token -- remove <이름>                    링크 지우기 (그 토큰의 쿠키도 바로 무효)
//   npm run admin:token -- list                             이름 · 기한 · 상태 (토큰 · 해시는 안 보임)
//   npm run admin:token -- init                             처음 한 번 — 없는 비밀값만 만들고 owner 링크 출력
//   비밀값을 넣기 전에 Worker 의 최신 버전 = 운영 배포 버전인지 확인 (작업 0367): 다르면 코드(내용 해시) · 비밀값 이름이 운영과 같을 때만 새 버전에 넣고 그 버전 하나만 100% 배포 · 아니면 비밀값을 넣지 않고 멈춤
//   (선택) --versions  점검 없이 새 버전에만 넣고(배포는 안 함) 그 버전을 따로 배포 (작업 0329 · 수동 경로)
// 규칙: 목록은 해시만(.tmp/admin-tokens.json · git 무시) · 토큰 원문 · 열쇠 값은 파일 · 로그에 남기지 않음 · 이미 있는 비밀값은 덮어쓰지 않음
// 어드민 Worker 비밀값: ADMIN_TOKENS · ADMIN_SESSION_SECRET · ADMIN_API_KEY / API Worker: ADMIN_API_KEY (같은 값)
// tripfx-api 의 ADMIN_TOKEN(단수) · ACTIVITY_TOKEN 은 다른 용도 — 건드리지 않음
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  OWNER,
  addEntry,
  deployVersionArgs,
  expFor,
  hasVersionsFlag,
  hashToken,
  judgeNewVersion,
  judgePreflight,
  latestVersionId,
  linkFor,
  listDeploymentsArgs,
  listRows,
  listVersionsArgs,
  needsPreflight,
  newToken,
  parseJson,
  preflightStopHelp,
  productionVersionId,
  removeEntry,
  secretPayload,
  secretPutArgs,
  versionFacts,
  versionsPutNotice,
  viewVersionArgs,
  wranglerFailureText,
} from "./admin-token-lib.ts";

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
const versionConfigs = new Set(); // --versions(수동) 으로 넣은 Worker
const modes = new Map(); // 점검 결과 — config → { action, prodId, prod }
let pendingLocal = null; // 배포까지 끝난 뒤에 쓸 로컬 목록

const json = (args) => parseJson(wrangler(args));
const factsOf = (id, config) => versionFacts(json(viewVersionArgs(id, config)));

/** 비밀값을 넣기 전 점검 (작업 0367) — 최신 버전 = 운영 배포 버전이면 그대로 · 다르면 코드 · 비밀값 이름이 같을 때만 versions 경로 · 아니면 멈춤 (읽기만 함 · 비밀값은 다루지 않음) */
function preflight(config) {
  const latestId = latestVersionId(json(listVersionsArgs(config)));
  const prodId = productionVersionId(json(listDeploymentsArgs(config)));
  const differ = latestId !== null && prodId !== null && latestId !== prodId;
  const prod = differ ? factsOf(prodId, config) : null;
  const latest = differ ? factsOf(latestId, config) : null;
  const verdict = judgePreflight({ latestId, prodId, latest, prod });
  if (verdict.action === "stop") fail(preflightStopHelp(verdict.reason, config));
  if (verdict.action === "versions") console.log(`${config}: 최신 미리보기 버전의 코드가 운영과 같아, 새 버전에 비밀값을 넣고 그 버전만 배포합니다`);
  modes.set(config, { action: verdict.action, prodId, prod });
}

/** versions 경로로 넣은 Worker 마다 — 방금 만든 새 버전이 운영과 같은 코드 · 비밀값 이름을 가졌는지 확인하고 그 버전 하나만 100% 배포한 뒤 운영 배포가 그 버전인지 다시 확인 */
function finalize(config, mode) {
  const newId = latestVersionId(json(listVersionsArgs(config)));
  if (newId === null || newId === mode.prodId) fail(`${config}: 새로 만든 버전을 찾지 못했습니다. 배포하지 않았습니다`);
  if (!judgeNewVersion(mode.prod, factsOf(newId, config))) fail(`${config}: 새 버전의 코드 · 비밀값 이름이 운영과 맞지 않아 배포하지 않았습니다 (새 버전 ${newId})`);
  wrangler(deployVersionArgs(newId, config));
  if (productionVersionId(json(listDeploymentsArgs(config))) !== newId) fail(`${config}: 배포 뒤 운영 버전이 새 버전(${newId})이 아닙니다. Cloudflare 대시보드에서 확인해 주세요`);
}

function putSecret(config, name, value) {
  const mode = modes.get(config);
  const versions = VERSIONS || mode?.action === "versions";
  if (VERSIONS) versionConfigs.add(config);
  return wrangler(secretPutArgs(name, config, { versions }), value);
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
  if (modes.get(ADMIN_CONFIG)?.action === "versions") pendingLocal = list; // 배포가 끝난 뒤에 저장
  else writeLocal(list);
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

const out = []; // 배포까지 끝난 뒤에 보일 글(새 링크 포함)
const say = (text) => out.push(text);

const [cmd, ...rest] = argv.filter((a) => a !== "--versions");
const today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);

// 점검 — 비밀값을 하나라도 넣기 전에(init 은 두 Worker 모두) 끝냄
if (needsPreflight(cmd, VERSIONS)) for (const config of cmd === "init" ? [ADMIN_CONFIG, API_CONFIG] : [ADMIN_CONFIG]) preflight(config);

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
  say(`만들었습니다: ${name}${exp ? ` (기한 ${exp})` : ""}\n새 링크 (이 화면에서만 보입니다 — 지금 복사하세요):\n${linkFor(token)}`);
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
  say(`지웠습니다: ${name} (이 토큰의 쿠키도 바로 무효)`);
} else if (cmd === "list") {
  const rows = listRows(readLocal() ?? {}, today);
  if (rows.length === 0) say("등록된 토큰이 없습니다");
  for (const r of rows) say(`${r.name}\t${r.exp ?? "기한 없음"}\t${r.status}${r.owner ? "\t본인용" : ""}`);
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
  say(made.length ? `새로 만든 비밀값: ${made.join(", ")}` : "새로 만들 것이 없습니다 (이미 모두 있음)");
  if (link) say(`본인(owner) 링크 (이 화면에서만 보입니다 — 지금 복사하세요):\n${link}`);
} else {
  fail("사용법: add <이름> [--exp YYYY-MM-DD] | remove <이름> | list | init");
}

// versions 경로로 넣은 Worker 는 새 버전 하나만 배포 · 그 뒤에야 로컬 저장 · 새 링크 출력
for (const [config, mode] of modes) if (mode.action === "versions") finalize(config, mode);
if (pendingLocal) writeLocal(pendingLocal);
for (const text of out) console.log(text);
// --versions(수동)로 넣었으면 배포 안내 (비밀값 글은 출력하지 않음)
for (const config of versionConfigs) console.log(versionsPutNotice(config));
