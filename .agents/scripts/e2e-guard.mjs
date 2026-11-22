// PreToolUse 훅 — 로컬 e2e 범위 규칙을 실행 전에 강제한다 (exit 2 = 차단, 이유는 에이전트에게 전달 · 작업 0294)
//   규칙(team.md test 절 · verdict.md "로컬 확인"): 로컬 전체 e2e · 로컬 전체 게이트는 돌리지 않는다.
//   로컬 e2e 는 그 작업 폴더에서 e2e-select.mjs 가 고른 spec 만. 전체 e2e 는 main 으로 가는 PR 에서 CI 가 돈다.
//   막음: spec 없는 로컬 e2e(전체) · 고른 목록 밖 spec · spec 이름이 아닌 걸러내기 인자 · Full 작업의 로컬 checks.sh
//   허용: 목록 안 spec · --last-failed · --list · 단위 · typecheck · lint · Quick 작업의 checks.sh(e2e 없음)
//   훅 스스로 고장 나면(예외 · git 실패) 통과시킨다 — 훅 때문에 일이 멈추지 않게
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, join, resolve } from "node:path";
import { changedFiles, currentSpec, git } from "./lib.mjs";
import { loopMode } from "./loop-mode.mjs";
import { selectE2e } from "./e2e-select.mjs";

const RULE = "규칙: team.md test 절 · verdict.md \"로컬 확인\" — 전체 e2e 는 main 으로 가는 PR 에서 CI 가 돕니다";

/** 값을 하나 받는 playwright 옵션 — 다음 낱말은 걸러내기 인자가 아님 */
const VALUE_OPTS = new Set([
  "-c", "--config", "--project", "-g", "--grep", "--grep-invert", "-j", "--workers", "--reporter", "--retries",
  "--repeat-each", "--timeout", "--output", "--max-failures", "--shard", "--trace", "--global-timeout", "--tsconfig",
  "--ui-port", "--ui-host",
]);
/** 앞에 붙어 다른 명령을 실행하는 낱말 — 건너뛰고 뒤를 본다 */
const PREFIX = new Set(["env", "time", "nohup", "command", "exec", "sudo"]);

/** heredoc 본문(글자)은 명령이 아니라서 뺀다 — 첫 줄(`cat > f <<EOF`)은 남김 (outside-guard 와 같은 방식) */
const stripHeredocs = (command) => command.replace(/(<<-?\s*(["']?)(\w+)\2[^\n]*)\n[\s\S]*?\n[ \t]*\3[ \t]*(?=\n|$)/g, "$1");

/** 따옴표를 아는 낱말 나누기 — "넓은 화면" 같은 값이 한 낱말로 남게 */
export function words(segment) {
  const out = [];
  let cur = "";
  let quote = null;
  let has = false;
  for (const ch of segment) {
    if (quote) {
      if (ch === quote) quote = null;
      else cur += ch;
    } else if (ch === "'" || ch === '"') {
      quote = ch;
      has = true;
    } else if (/\s/.test(ch)) {
      if (has || cur) out.push(cur);
      cur = "";
      has = false;
    } else {
      cur += ch;
      has = true;
    }
  }
  if (has || cur) out.push(cur);
  return out;
}

/** 명령을 조각으로 — && · || · ; · | · 줄바꿈 (따옴표 안은 자르지 않음) */
function segments(command) {
  const out = [];
  let cur = "";
  let quote = null;
  const s = stripHeredocs(command);
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (quote) {
      if (ch === quote) quote = null;
      cur += ch;
      continue;
    }
    if (ch === "'" || ch === '"') { quote = ch; cur += ch; continue; }
    if (ch === "\n" || ch === ";" || ch === "|" || (ch === "&" && s[i + 1] === "&")) {
      out.push(cur);
      cur = "";
      if ((ch === "&" || ch === "|") && s[i + 1] === ch) i++;
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out.map((x) => x.trim().replace(/^[({]\s*/, "").replace(/\s*[)}]$/, "")).filter(Boolean);
}

/**
 * 명령 안의 e2e 실행 · 게이트 실행을 찾는다
 * @returns {{ kind: "e2e"|"checks", args: string[], env: Record<string,string> }[]}
 */
export function e2eRuns(command) {
  const runs = [];
  for (const seg of segments(command)) {
    const w = words(seg);
    const env = {};
    let i = 0;
    while (i < w.length) {
      if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(w[i])) { const k = w[i].slice(0, w[i].indexOf("=")); env[k] = w[i].slice(k.length + 1); i++; continue; }
      if (PREFIX.has(w[i])) { i++; continue; }
      if (w[i] === "timeout") { i += /^\d/.test(w[i + 1] ?? "") ? 2 : 1; continue; }
      break;
    }
    const rest = w.slice(i);
    if (rest.length === 0) continue;
    if (rest.some((x) => basename(x) === "checks.sh")) { runs.push({ kind: "checks", args: [], env }); continue; }
    const pw = rest.findIndex((x, j) => basename(x) === "playwright" && rest[j + 1] === "test");
    if (pw >= 0) { runs.push({ kind: "e2e", args: rest.slice(pw + 2), env }); continue; }
    const runner = ["npm", "pnpm", "yarn", "bun", "turbo", "npx"].includes(basename(rest[0]));
    const script = rest.indexOf("test:e2e");
    if (runner && script >= 0) runs.push({ kind: "e2e", args: rest.slice(script + 1).filter((x) => x !== "--"), env });
  }
  return runs;
}

/** playwright 인자 → 지정한 spec · 걸러내기 인자 · 깃발 */
export function playwrightArgs(args) {
  const specs = [];
  const filters = [];
  let lastFailed = false;
  let list = false;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--last-failed") { lastFailed = true; continue; }
    if (a === "--list") { list = true; continue; }
    if (a.startsWith("--only-changed")) { filters.push(a); continue; }
    if (a.startsWith("-")) {
      if (!a.includes("=") && VALUE_OPTS.has(a)) i++;
      continue;
    }
    const name = basename(a.replace(/:\d+(?::\d+)?$/, ""));
    if (/\.spec\.ts$/.test(name)) specs.push(name);
    else filters.push(a);
  }
  return { specs, filters, lastFailed, list };
}

const expandHome = (p) => p.replace(/^(~|\$HOME|\$\{HOME\})(?=\/|$)/, homedir());

/** 첫 `cd 경로` 를 따라 명령의 실행 위치를 잡는다 */
export function cdOf(command, base) {
  const m = /^\s*\(?\s*cd\s+("[^"]+"|'[^']+'|[^\s;&|)]+)/.exec(command);
  return m ? resolve(base, expandHome(m[1].replace(/^["']|["']$/g, ""))) : base;
}

const topOf = (cwd) => git(["rev-parse", "--show-toplevel"], cwd) || cwd;

/** 그 작업 폴더에서 로컬로 돌릴 수 있는 spec — e2e-select 와 같은 계산(대상 develop) · 못 구하면 null */
export function allowedSpecs(cwd) {
  const top = topOf(cwd);
  const mapPath = join(top, ".agents", "e2e-map.json");
  if (!existsSync(mapPath)) return null;
  const map = JSON.parse(readFileSync(mapPath, "utf8"));
  const env = { ...process.env };
  delete env.GITHUB_BASE_REF;
  return selectE2e(changedFiles(top, env), { target: "develop", map });
}

/** 그 작업 폴더의 루프(quick · full) */
export function loopOf(cwd) {
  const top = topOf(cwd);
  const spec = currentSpec(top);
  return loopMode({ has: (f) => Boolean(spec.dir) && existsSync(join(top, spec.dir, f)) });
}

const listText = (sel) =>
  sel ? `이 작업 폴더에서 로컬로 돌릴 수 있는 spec(e2e-select): ${sel.specs.length ? sel.specs.join(", ") : "없음 — 이 작업은 로컬 e2e 대상이 없습니다"}` : "";

/**
 * @param {{ tool_name?: string, tool_input?: { command?: string }, cwd?: string }} event
 * @param {string} root
 * @param {{ allowed?: (cwd: string) => { specs: string[] } | null, loop?: (cwd: string) => string }} deps 테스트용 주입
 * @returns {string|null} 막는 이유 · null 이면 통과
 */
export function decideE2e(event, root, { allowed = allowedSpecs, loop = loopOf } = {}) {
  if (event.tool_name !== "Bash") return null;
  const command = event.tool_input?.command;
  if (!command) return null;
  const runs = e2eRuns(command);
  if (runs.length === 0) return null;
  const cwd = cdOf(command, event.cwd || root);
  let sel;
  const getSel = () => {
    if (sel === undefined) { try { sel = allowed(cwd); } catch { sel = null; } }
    return sel;
  };
  const tail = () => [listText(getSel()), RULE].filter(Boolean).join(" · ");
  for (const run of runs) {
    if (run.kind === "checks") {
      const mode = run.env.LOOP === "quick" || run.env.LOOP === "full" ? run.env.LOOP : loop(cwd);
      if (mode === "full") return `Full 작업의 로컬 checks.sh 는 build + 전체 e2e 를 돌립니다(로컬 전체 게이트 금지). 단위 · typecheck · lint 와 고른 spec 만 따로 돌리세요 · ${tail()}`;
      continue;
    }
    const p = playwrightArgs(run.args);
    if (p.list) continue;
    if (p.filters.length) return `spec 이름이 아닌 걸러내기 인자(${p.filters.join(", ")})로는 무엇이 돌지 알 수 없습니다. spec 파일 이름으로 지정하세요 · ${tail()}`;
    if (p.specs.length === 0) {
      if (p.lastFailed) continue;
      return `spec 을 지정하지 않은 로컬 e2e 는 전체 실행입니다(로컬 전체 e2e 금지) · ${tail()}`;
    }
    const s = getSel();
    if (!s) continue; // 목록을 못 구하면 막지 않음
    const extra = p.specs.filter((x) => !s.specs.includes(x));
    if (extra.length) return `고른 목록 밖 spec 입니다: ${extra.join(", ")} — 로컬에서는 바꾼 기능의 spec 만 돌립니다 · ${tail()}`;
  }
  return null;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  let raw = "";
  process.stdin.on("data", (c) => (raw += c));
  process.stdin.on("end", () => {
    try {
      const event = JSON.parse(raw || "{}");
      const root = process.env.CLAUDE_PROJECT_DIR || event.cwd || process.cwd();
      const reason = decideE2e(event, root);
      if (reason) { process.stderr.write(`[e2e 범위 규칙] ${reason}\n`); process.exit(2); }
    } catch {
      // 훅이 고장 나도 일을 막지 않음
    }
    process.exit(0);
  });
}
