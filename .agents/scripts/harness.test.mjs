// 하네스 스크립트 테스트 — node --test .agents/scripts/
import assert from "node:assert/strict";
import { test } from "node:test";
import { currentSpec, globToRegExp, isTestFile, matchesAny, planSection } from "./lib.mjs";
import { protectedHits } from "./protected-check.mjs";
import { outOfPlan, removedAssertions } from "./scope-check.mjs";
import { emptyTemplate } from "./spec-check.mjs";
import { decide, isOutside, writeTargets } from "./outside-guard.mjs";
import { englishReason, lastTurnTexts } from "./korean-gate.mjs";
import { classifyBash, resultOf, safeFile, stripText, taskFor, toActivity } from "./activity.mjs";
import { summarize as auditSummary } from "./audit-report.mjs";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join as pathJoin } from "node:path";

test("glob: ** · * · 폴더", () => {
  assert.ok(globToRegExp("src/cart/**").test("src/cart/a/b.ts"));
  assert.ok(globToRegExp("**/*.test.ts").test("src/a.test.ts"));
  assert.ok(globToRegExp("**/*.test.ts").test("a.test.ts"));
  assert.ok(!globToRegExp("src/*.ts").test("src/a/b.ts"));
  assert.ok(globToRegExp("docs/").test("docs/x.md"));
  assert.ok(matchesAny("AGENTS.md", ["AGENTS.md"]));
});

test("보호 파일: 목록에 걸린 것만", () => {
  assert.deepEqual(protectedHits(["src/a.ts", ".agents/checks.sh", "pnpm-lock.yaml"], [".agents/checks.sh", "pnpm-lock.yaml"]), [".agents/checks.sh", "pnpm-lock.yaml"]);
});

test("plan.md 섹션: 주석 · 빈 불릿 · 체크박스 제외, 백틱 제거", () => {
  const plan = "## 파일 계획\n<!-- 설명 -->\n- `src/cart/**`\n- \n- [ ] 이건 아님\n## 계획 밖 변경 이유\n- src/ui/Button.tsx — 공용 버튼 색 버그\n";
  assert.deepEqual(planSection(plan, "파일 계획"), ["src/cart/**"]);
  assert.deepEqual(planSection(plan, "계획 밖 변경 이유"), ["src/ui/Button.tsx — 공용 버튼 색 버그"]);
});

test("범위: 계획 · specs · 이유 적힌 파일은 통과, 나머지는 경고", () => {
  const files = ["src/cart/qty.ts", "src/ui/Button.tsx", "src/ui/Card.tsx", ".agents/specs/0001-x/plan.md"];
  assert.deepEqual(outOfPlan(files, ["src/cart/**"], ["src/ui/Button.tsx — 이유"]), ["src/ui/Card.tsx"]);
});

test("테스트 약화: 지워진 단언 줄만 센다", () => {
  const diff = "--- a/x.test.ts\n+++ b/x.test.ts\n-  expect(a).toBe(1)\n+  expect(a).toBe(2)\n-  const y = 1\n";
  assert.equal(removedAssertions(diff), 1);
  assert.ok(isTestFile("src/a.test.ts") && isTestFile("tests/a.ts") && !isTestFile("src/a.ts"));
});

test("작업 기록: 템플릿 그대로면 빈 것", () => {
  assert.ok(emptyTemplate("# 요청 원문\n\n<!-- 붙여 넣기 -->\n"));
  assert.ok(emptyTemplate("# 계획\n## 무엇을\n-\n- [ ] \n"));
  assert.ok(!emptyTemplate("# 요청 원문\n장바구니 수량 버그 고쳐 줘\n"));
});

test("밖 쓰기: 쓰기 대상만 뽑는다", () => {
  assert.deepEqual(writeTargets("bash x.sh > $HOME/.out 2>&1"), ["$HOME/.out"]);
  assert.deepEqual(writeTargets("cmd | tee -a /tmp/log && rm -f /tmp/a"), ["/tmp/log", "/tmp/a"]);
  assert.deepEqual(writeTargets("cp src/a.ts /tmp/b.ts"), ["/tmp/b.ts"]);
  assert.deepEqual(writeTargets("cat /etc/hosts && echo hi 2>/dev/null"), []); // 2> 는 표준 에러 리다이렉션, /dev 는 어차피 허용
});

test("밖 쓰기: 프로젝트 안 · /dev 는 허용, 밖은 차단", () => {
  const root = "/work/app";
  assert.ok(!isOutside("src/a.ts", root));
  assert.ok(!isOutside(".tmp/log", root));
  assert.ok(!isOutside("/dev/null", root));
  assert.ok(isOutside("/tmp/log", root));
  assert.ok(isOutside("../other/x", root));
  assert.ok(isOutside("~/x", root));
  // heredoc 본문 속 글자는 쓰기 대상이 아님 · 첫 줄의 리다이렉션은 그대로 검사
  assert.equal(decide({ tool_name: "Bash", tool_input: { command: "cat > .tmp/p.md <<'EOF'\n주석 <경로>/memory · a >/etc/x\nEOF\nls" } }, root), null);
  assert.ok(decide({ tool_name: "Bash", tool_input: { command: "cat > /tmp/p.md <<'EOF'\n안전\nEOF" } }, root));
  assert.ok(decide({ tool_name: "Bash", tool_input: { command: "cat <<EOF\nx\nEOF\necho hi > /tmp/after" } }, root));
  // 이 프로젝트의 기억 폴더만 예외 · 다른 프로젝트 기억 · 그 위 폴더는 계속 막음
  assert.ok(!isOutside("~/.claude/projects/-work-app/memory/a.md", root));
  assert.ok(isOutside("~/.claude/projects/-work-other/memory/a.md", root));
  assert.ok(isOutside("~/.claude/projects/-work-app/settings.json", root));
  assert.ok(isOutside("~/.claude/projects/-work-app/memory/../x.md", root));
  assert.ok(decide({ tool_name: "Bash", tool_input: { command: "cd /work/app && bash g.sh > /tmp/g.log" } }, root));
  assert.equal(decide({ tool_name: "Bash", tool_input: { command: "cd /work/app && bash g.sh > .tmp/g.log 2>/dev/null" } }, root), null);
  assert.ok(decide({ tool_name: "Write", tool_input: { file_path: "/Users/me/notes.md" } }, root));
  assert.equal(decide({ tool_name: "Write", tool_input: { file_path: "/work/app/src/a.ts" } }, root), null);
  assert.equal(decide({ tool_name: "Read", tool_input: { file_path: "/etc/hosts" } }, root), null);
});

// 오케스트레이션 뼈대 — 지침서마다 필수 칸이 있는지 (내용은 비어도 됨)
import { readFileSync as read, readdirSync as list } from "node:fs";
const ORCH = new URL("../orchestration/", import.meta.url);
const headings = (file) => read(new URL(file, ORCH), "utf8").split("\n").filter((l) => l.startsWith("## ")).map((l) => l.slice(3).trim());
const ROLE_SECTIONS = ["목적", "먼저 읽을 것", "할 일", "하지 않을 것", "받는 것", "넘기는 것", "완료 기준"];
const PATTERN_SECTIONS = ["언제 쓰나", "참여 역할", "흐름", "단계", "전달물", "합류 · 판정", "충돌 방지", "주의"];

test("오케스트레이션: 역할 지침서 필수 칸", () => {
  for (const f of list(new URL("roles/", ORCH)).filter((f) => f.endsWith(".md"))) {
    const missing = ROLE_SECTIONS.filter((s) => !headings(`roles/${f}`).includes(s));
    assert.deepEqual(missing, [], `roles/${f} 에 빠진 칸`);
  }
});

test("오케스트레이션: 패턴 지침서 필수 칸", () => {
  for (const f of list(new URL("patterns/", ORCH)).filter((f) => f.endsWith(".md"))) {
    const missing = PATTERN_SECTIONS.filter((s) => !headings(`patterns/${f}`).includes(s));
    assert.deepEqual(missing, [], `patterns/${f} 에 빠진 칸`);
  }
});

test("오케스트레이션: 6요소 · 4패턴이 README에 연결됨", () => {
  const readme = read(new URL("README.md", ORCH), "utf8");
  for (const s of ["분해·배정", "흐름", "전달물", "상태 공유", "합류·판정", "충돌 방지", "역할 분리", "병렬 분산", "감독자-작업자", "토론"]) assert.ok(readme.includes(s), s);
});

import { requiredDocs } from "./spec-check.mjs";
test("작업 기록: 작은 작업은 plan, 큰 작업은 prd + sdd", () => {
  assert.deepEqual(requiredDocs((f) => f === "plan.md"), ["plan.md"]);
  assert.deepEqual(requiredDocs((f) => f === "prd.md"), ["prd.md", "sdd.md", "trace.md"]);
  assert.deepEqual(requiredDocs(() => false, "full"), ["prd.md", "sdd.md", "trace.md"]);
  for (const f of ["request.md", "prd.md", "sdd.md", "trace.md"]) assert.ok(emptyTemplate(read(new URL(`../specs/_template-full/${f}`, import.meta.url), "utf8")), `${f} 템플릿은 빈 것으로 판정`);
  const sdd = read(new URL("../specs/_template-full/sdd.md", import.meta.url), "utf8");
  for (const s of ["접근", "대안 · 트레이드오프", "파일 계획", "계획 밖 변경 이유", "위험", "검증 계획", "계획과 달라진 점"]) assert.ok(sdd.includes(`## ${s}`), s);
});

import { loopMode } from "./loop-mode.mjs";
test("루프: LOOP 우선, 없으면 prd·sdd 있으면 full", () => {
  assert.equal(loopMode({ env: "", has: () => false }), "quick");
  assert.equal(loopMode({ env: "", has: (f) => f === "sdd.md" }), "full");
  assert.equal(loopMode({ env: "full", has: () => false }), "full");
  assert.equal(loopMode({ env: "quick", has: (f) => f === "sdd.md" }), "quick");
});

// 실제 이 세션 대화 기록으로 잰 기준: 영어로 쓴 답 69개 모두 잡고 한국어 답 81개는 하나도 안 막음 (작업 0025)
test("한국어 게이트: 영어 답은 막고, 기술 용어 섞인 한국어 답은 통과", () => {
  assert.ok(englishReason("Now the harness files."));
  assert.ok(englishReason("While CI runs, I'm starting the second task, **monorepo conversion**."));
  assert.ok(englishReason("요약입니다.\n\nThe tooltip works too, the earlier screenshot was simply taken before it appeared."));
  assert.equal(englishReason("PR #20 을 올렸습니다. Worker · D1 · Cron · Hono 를 로컬에서 확인했습니다."), null);
  assert.equal(englishReason("`apps/api/src/index.ts` 와 [Hono Best Practices](https://hono.dev) 를 봤습니다."), null);
  assert.equal(englishReason("```bash\nnpx wrangler deploy --dry-run --outdir dist\n```\n위 명령을 실행하세요."), null);
});

test("한국어 게이트: 마지막 사람 메시지 뒤 에이전트 글만 (도구 결과는 사람 메시지가 아님)", () => {
  const line = (o) => JSON.stringify(o);
  const jsonl = [
    line({ type: "user", message: { content: "첫 질문" } }),
    line({ type: "assistant", message: { content: [{ type: "text", text: "Old English answer that was already fixed" }] } }),
    line({ type: "user", message: { content: "둘째 질문" } }),
    line({ type: "assistant", message: { content: [{ type: "text", text: "확인하겠습니다." }, { type: "tool_use" }] } }),
    line({ type: "user", message: { content: [{ type: "tool_result", content: "ok" }] } }),
    line({ type: "assistant", message: { content: [{ type: "text", text: "Done with the check." }] } }),
  ].join("\n");
  assert.deepEqual(lastTurnTexts(jsonl), ["확인하겠습니다.", "Done with the check."]);
});

test("실시간 기록: 명령 · 경로 · 내용은 안 나가고 종류 · 고정 문장 · 파일 이름만", () => {
  const root = "/repo";
  const post = (tool_name, tool_input, tool_response) => toActivity({ hook_event_name: "PostToolUse", tool_name, tool_input, tool_response }, root, "0046");
  const edit = post("Edit", { file_path: "/repo/apps/api/src/store.ts", old_string: "비밀 내용", new_string: "x" });
  assert.deepEqual(edit, { kind: "edit", label: "코드 수정", file: "store.ts", ok: null, task: "0046" });
  const bash = post("Bash", { command: "curl -H 'authorization: Bearer abc' https://x" }, { stdout: "ghp_secretsecretsecret" });
  assert.deepEqual(bash, { kind: "run", label: "API 확인", file: null, ok: null, task: "0046" });
  assert.ok(!JSON.stringify(bash).includes("Bearer") && !JSON.stringify(bash).includes("ghp_"));
});

test("실시간 기록: 비밀 파일 이름은 버림", () => {
  for (const p of ["/repo/.env", "/repo/apps/api/.dev.vars", "/repo/.env.local", "/repo/0123456789abcdef0123456789abcdef.txt", "/repo/a b.ts"]) assert.equal(safeFile(p), null, p);
  assert.equal(safeFile("/repo/page.test.tsx"), "page.test.tsx");
});

test("실시간 기록: 명령 분류 · 통과/실패", () => {
  assert.equal(classifyBash("ALLOW_PROTECTED=1 bash .agents/checks.sh > .tmp/gate.log").kind, "gate");
  assert.equal(classifyBash("cd apps/api && npx vitest run").kind, "test");
  assert.equal(classifyBash("git commit -F -").kind, "commit");
  assert.equal(classifyBash("gh pr create --label x").label, "PR 만듦");
  assert.equal(classifyBash("npm i three").kind, "install");
  assert.equal(classifyBash("grep -n x src").kind, "search");
  assert.equal(classifyBash("python3 x.py").label, "명령 실행");
  assert.equal(resultOf("gate", " 결과: ✅ ALL PASS (quick)"), true);
  assert.equal(resultOf("gate", "  ❌ FAIL — 테스트"), false);
  assert.equal(resultOf("test", "Tests  52 passed (52)"), true);
  assert.equal(resultOf("test", "Tests  1 failed | 51 passed"), false);
  assert.equal(resultOf("run", "passed"), null);
});

test("실시간 기록: 한 번에 커밋 · 올림 · PR 을 하면 가장 멀리 간 일 · PR 설명 글 속 checks.sh 는 무시 (작업 0066)", () => {
  const body = "gh pr create --title \"t\" --body \"$(cat <<'EOF'\n- `bash .agents/checks.sh` ALL PASS\nEOF\n)\"";
  assert.equal(classifyBash(`git add -A && git commit -q -m "x" && git push -q -u origin task/0065-a; ${body}; gh pr checks task/0065-a --watch`).label, "PR 만듦");
  assert.equal(classifyBash("git commit -q -m \"게이트 checks.sh 통과\"").label, "커밋");
  assert.equal(classifyBash("gh pr merge 66 --squash --delete-branch; git switch -q main").label, "PR 머지");
  assert.equal(classifyBash("git add -A && git commit -q -m x && git push -q -u origin task/0066-a").label, "브랜치 올림");
  assert.equal(classifyBash("bash .agents/checks.sh 2>&1 | grep -E \"결과|FAIL\"").kind, "gate");
  assert.equal(stripText("echo 'a checks.sh' \"b\" c"), "echo '' \"\" c");
});

test("실시간 기록: 머지 뒤 main 으로 돌아와도 배포 기록은 마지막 작업 번호 (작업 0066)", () => {
  const root = mkdtempSync(pathJoin(tmpdir(), "act-"));
  try {
    assert.equal(taskFor(root, null, "pr", 1000), null); // 기억한 게 없으면 없음
    assert.equal(taskFor(root, "0065", "gate", 1000), "0065");
    assert.equal(taskFor(root, null, "pr", 2000), "0065"); // main 에서 머지
    assert.equal(taskFor(root, null, "read", 2000), null); // 배포 쪽이 아니면 붙이지 않음
    assert.equal(taskFor(root, null, "pr", 1000 + 4 * 60 * 60 * 1000), null); // 3시간 넘으면 버림
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("실시간 기록: 하네스가 막을 쓰기는 실행 전에 🛑 · 그 밖의 실행 전 · 잡음 도구는 안 보냄", () => {
  const pre = (tool_name, tool_input) => toActivity({ hook_event_name: "PreToolUse", tool_name, tool_input }, "/repo", null);
  assert.equal(pre("Write", { file_path: "/etc/x" })?.kind, "blocked");
  assert.equal(pre("Write", { file_path: "/repo/a.ts" }), null);
  assert.equal(toActivity({ hook_event_name: "PostToolUse", tool_name: "mcp__ccd_turn__update_plan", tool_input: {} }, "/repo"), null);
});

test("작업 폴더 찾기: CI(떨어진 HEAD)는 GITHUB_HEAD_REF 로 (작업 0102)", () => {
  const dir = mkdtempSync(pathJoin(tmpdir(), "spec-"));
  try {
    mkdirSync(pathJoin(dir, ".agents/specs/0102-ci-branch-spec"), { recursive: true });
    const s = currentSpec(dir, { GITHUB_HEAD_REF: "task/0102-ci-branch-spec" });
    assert.equal(s.id, "0102");
    assert.equal(s.dir, pathJoin(".agents/specs", "0102-ci-branch-spec"));
    assert.equal(currentSpec(dir, { GITHUB_HEAD_REF: "" }).id, null); // 저장소가 아니면 브랜치 없음
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("보안 점검: 서비스는 전부 · 개발 도구는 높음 이상만 · 이상한 결과는 실패", () => {
  const meta = { metadata: { vulnerabilities: { total: 1 } } };
  const prod = { ...meta, vulnerabilities: { hono: { name: "hono", severity: "low", range: "<4", fixAvailable: true } } };
  const all = {
    ...meta,
    vulnerabilities: {
      hono: { name: "hono", severity: "low", range: "<4", fixAvailable: true },
      a: { name: "a", severity: "moderate", range: "*", fixAvailable: true },
      b: { name: "b", severity: "high", range: "1|2", fixAvailable: false },
    },
  };
  const r = auditSummary(prod, all);
  assert.equal(r.count, 2);
  assert.match(r.body, /\| hono \| low \| 서비스 /);
  assert.match(r.body, /\| b \| high \| 개발 도구 \| 1 2 \| 불가 \|/);
  assert.doesNotMatch(r.body, /\| a \|/);
  assert.equal(auditSummary(meta, meta).count, 0);
  assert.throws(() => auditSummary({ error: "ENOTFOUND" }, meta));
});

// ───────── 작업 0243 — 게이트: Quick PR 도 CI e2e · 작업 기록 검사 먼저 (테스트 먼저 · 구현 전에는 FAIL 이 정상) ─────────
//
// builder 가 만들 것  ※ 이름 · 모양은 이 테스트의 가정 — 다르게 하려면 먼저 lead 에게 알림
//   1) .agents/scripts/e2e-needed.mjs — export function e2eNeeded(files: string[]): boolean
//        바뀐 파일이 .agents/** · docs/** · *.md(어느 폴더든) · apps/api/data/** 뿐이면 false · 하나라도 그 밖이면 true · 빈 목록은 false
//        (.github/** · package.json · apps/** 소스 · packages/** 는 화면 · 빌드에 영향이 있을 수 있어 true — plan.md 애매한 곳)
//   2) .agents/checks.sh 순서 — 작업 기록(spec-check) · 보호 파일 검사가 프로젝트 검사(typecheck · lint · test · build · test:e2e)보다 먼저 ·
//        작업 기록이 실패하면 build · test:e2e 를 돌리지 않고 바로 FAIL (긴 단계를 버리지 않음)
//   3) CI 의 PR 실행(CI=true · GITHUB_EVENT_NAME=pull_request)에서 Quick 이어도 e2eNeeded(origin/main 기준 바뀐 파일)가 참이면 build · test:e2e 를 돌림
//        로컬(CI 없음)은 지금 그대로(Quick 은 typecheck · lint · test) · push(main) 이벤트도 지금 그대로 · Full 은 늘 build · test:e2e
//   (checks.yml 의 라벨 조건은 YAML 이라 이 테스트 대상이 아님 — lead 가 글로 확인)
import { spawnSync } from "node:child_process";
import { chmodSync, copyFileSync, cpSync, existsSync as fsExists, readFileSync as fsRead, writeFileSync } from "node:fs";
import { dirname as pathDirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = pathDirname(fileURLToPath(import.meta.url));
const REPO = pathJoin(HERE, "..", "..");

test("e2e 필요 판정: 문서 · 하네스 · 사이트 밖 자료만 바뀌면 false · 빈 목록도 false (작업 0243)", async () => {
  const { e2eNeeded } = await import("./e2e-needed.mjs");
  assert.equal(e2eNeeded([]), false);
  assert.equal(e2eNeeded([".agents/checks.sh"]), false);
  assert.equal(e2eNeeded([".agents/specs/0243-x/plan.md", ".agents/scripts/harness.test.mjs"]), false);
  assert.equal(e2eNeeded(["docs/domain/airfare-calendar.md", "docs/marketing/2026-11-20/문구.md"]), false);
  assert.equal(e2eNeeded(["README.md", "AGENTS.md", "apps/web/README.md"]), false); // *.md 는 어느 폴더든
  assert.equal(e2eNeeded(["apps/api/data/geo-answers/2026-11-20.json"]), false);
  assert.equal(e2eNeeded([".agents/orchestration/TASKS.md", "docs/a.md", "apps/api/data/x.json", "CLAUDE.md"]), false);
});

test("e2e 필요 판정: 그 밖이 하나라도 있으면 true — 화면 · API · 패키지 · 워크플로 · 설정 (작업 0243)", async () => {
  const { e2eNeeded } = await import("./e2e-needed.mjs");
  for (const f of ["apps/web/src/app/page.tsx", "apps/web/e2e/home.spec.ts", "apps/api/src/index.ts", "packages/ui/src/a.tsx", ".github/workflows/checks.yml", "package.json", "turbo.json", "apps/web/next.config.ts", "apps/web/public/robots.txt"]) {
    assert.equal(e2eNeeded([f]), true, f);
  }
  assert.equal(e2eNeeded(["docs/a.md", "apps/web/src/a.tsx"]), true, "문서와 섞여도 화면 파일이 있으면 true");
  assert.equal(e2eNeeded([".agents/specs/x/plan.md", ".github/workflows/checks.yml"]), true);
});

test("e2e 필요 판정: 폴더 이름이 비슷한 것은 속지 않음 · 데이터 폴더는 apps/api/data 만 (작업 0243)", async () => {
  const { e2eNeeded } = await import("./e2e-needed.mjs");
  assert.equal(e2eNeeded([".agentsx/a.ts"]), true);
  assert.equal(e2eNeeded(["docsx/a.ts"]), true);
  assert.equal(e2eNeeded(["apps/api/database.ts"]), true);
  assert.equal(e2eNeeded(["apps/api/data-loader.ts"]), true);
  assert.equal(e2eNeeded(["apps/web/data/x.json"]), true, "apps/web/data 는 사이트 자료라 true");
  assert.equal(e2eNeeded(["notes.md.ts"]), true, "확장자가 .md 로 끝나는 것만 문서");
});

// 가짜 npm · 가짜 검사 스크립트로 checks.sh 를 돌려 보는 모래판 — 진짜 빌드 · e2e · 운영 자료를 건드리지 않음
function sandbox({ changed = [], base = ["apps/web/src/seed.ts"] } = {}) {
  const root = mkdtempSync(pathJoin(tmpdir(), "hav-gate-"));
  const sh = (cmd, args) => spawnSync(cmd, args, { cwd: root, encoding: "utf8" });
  mkdirSync(pathJoin(root, ".agents", "scripts"), { recursive: true });
  mkdirSync(pathJoin(root, "bin"), { recursive: true });
  copyFileSync(pathJoin(REPO, ".agents", "checks.sh"), pathJoin(root, ".agents", "checks.sh"));
  cpSync(pathJoin(REPO, ".agents", "scripts"), pathJoin(root, ".agents", "scripts"), { recursive: true });
  const stub = (name, body) => writeFileSync(pathJoin(root, ".agents", "scripts", name), `import { appendFileSync } from "node:fs";\n${body}\n`);
  // 가짜: 부르면 기록만 남김 · 실패는 환경변수로 (진짜 검사는 이 모래판에 없음)
  stub("spec-check.mjs", `appendFileSync(process.env.GATE_LOG, "spec-check\\n"); process.exit(process.env.SPEC_FAIL === "1" ? 1 : 0);`);
  stub("protected-check.mjs", `appendFileSync(process.env.GATE_LOG, "protected\\n"); process.exit(0);`);
  stub("scope-check.mjs", `appendFileSync(process.env.GATE_LOG, "scope\\n"); process.exit(0);`);
  stub("loop-mode.mjs", `console.log(process.env.LOOP || "quick");`);
  stub("harness.test.mjs", `appendFileSync(process.env.GATE_LOG, "harness-test\\n");`);
  writeFileSync(pathJoin(root, "package.json"), JSON.stringify({ name: "sb", private: true, scripts: { typecheck: "x", lint: "x", test: "x", build: "x", "test:e2e": "x" } }));
  const npm = pathJoin(root, "bin", "npm");
  writeFileSync(npm, '#!/bin/sh\n# 가짜 npm — npm run [-s] <스크립트> 만 기록\nfor a in "$@"; do case "$a" in run|-s) ;; *) echo "npm:$a" >> "$GATE_LOG";; esac; done\nexit 0\n');
  chmodSync(npm, 0o755);
  for (const f of base) {
    mkdirSync(pathJoin(root, pathDirname(f)), { recursive: true });
    writeFileSync(pathJoin(root, f), "// base\n");
  }
  sh("git", ["init", "-q", "-b", "main"]);
  sh("git", ["config", "user.email", "t@t"]);
  sh("git", ["config", "user.name", "t"]);
  sh("git", ["add", "-A"]);
  sh("git", ["commit", "-q", "-m", "base"]);
  sh("git", ["update-ref", "refs/remotes/origin/main", "HEAD"]); // CI 에서 origin/main 기준 바뀐 파일을 구하는 자리
  sh("git", ["checkout", "-q", "-b", "task/x"]);
  for (const f of changed) {
    mkdirSync(pathJoin(root, pathDirname(f)), { recursive: true });
    writeFileSync(pathJoin(root, f), `// changed ${f}\n`);
  }
  sh("git", ["add", "-A"]);
  sh("git", ["commit", "-q", "--allow-empty", "-m", "change"]);
  const logDir = mkdtempSync(pathJoin(tmpdir(), "hav-gate-log-")); // 기록은 저장소 밖에 — 안에 두면 "바뀐 파일"로 잡혀 판정이 흐려짐
  const log = pathJoin(logDir, "gate.log");
  writeFileSync(log, "");
  return {
    root,
    run(env = {}) {
      writeFileSync(log, ""); // 같은 모래판에서 여러 번 돌려도 기록이 섞이지 않게
      const r = spawnSync("bash", [".agents/checks.sh"], {
        cwd: root,
        encoding: "utf8",
        env: { PATH: `${pathJoin(root, "bin")}:${process.env.PATH}`, HOME: process.env.HOME ?? root, GATE_LOG: log, CLAUDE_PROJECT_DIR: root, ...env },
      });
      const calls = fsRead(log, "utf8").split("\n").filter(Boolean);
      return { status: r.status, out: `${r.stdout}${r.stderr}`, calls, npm: calls.filter((c) => c.startsWith("npm:")).map((c) => c.slice(4)) };
    },
    done: () => {
      rmSync(root, { recursive: true, force: true });
      rmSync(logDir, { recursive: true, force: true });
    },
  };
}
const CI_PR = { CI: "true", GITHUB_EVENT_NAME: "pull_request" };

test("모래판 점검: 지금 checks.sh 가 가짜 도구로 돎 — 로컬 Quick 은 typecheck · lint · test 만 (회귀 방지 · 0243 이전부터 통과해야 함)", () => {
  const sb = sandbox({ changed: ["apps/web/src/a.tsx"] });
  try {
    const r = sb.run();
    assert.equal(r.status, 0, r.out);
    assert.deepEqual(r.npm, ["typecheck", "lint", "test"]);
  } finally {
    sb.done();
  }
});

test("순서: 작업 기록 · 보호 파일 검사가 프로젝트 검사(npm)보다 먼저 (작업 0243)", () => {
  const sb = sandbox({ changed: ["apps/web/src/a.tsx"] });
  try {
    const r = sb.run({ LOOP: "full" });
    const firstNpm = r.calls.findIndex((c) => c.startsWith("npm:"));
    assert.ok(firstNpm > 0, `프로젝트 검사가 돌아야 함 ${JSON.stringify(r.calls)}`);
    assert.ok(r.calls.indexOf("spec-check") >= 0 && r.calls.indexOf("spec-check") < firstNpm, `작업 기록이 먼저 ${JSON.stringify(r.calls)}`);
    assert.ok(r.calls.indexOf("protected") >= 0 && r.calls.indexOf("protected") < firstNpm, `보호 파일이 먼저 ${JSON.stringify(r.calls)}`);
  } finally {
    sb.done();
  }
});

test("조기 실패: 작업 기록이 실패하면 build · test:e2e 를 돌리지 않고 FAIL (Full · CI Quick 모두) (작업 0243)", () => {
  const sb = sandbox({ changed: ["apps/web/src/a.tsx"] });
  try {
    for (const env of [{ LOOP: "full" }, { ...CI_PR }, { LOOP: "full", ...CI_PR }]) {
      const r = sb.run({ SPEC_FAIL: "1", ...env });
      assert.notEqual(r.status, 0, "작업 기록 실패는 게이트 실패");
      assert.ok(!r.npm.includes("build"), `build 를 돌리면 안 됨 ${JSON.stringify(r.npm)}`);
      assert.ok(!r.npm.includes("test:e2e"), `test:e2e 를 돌리면 안 됨 ${JSON.stringify(r.npm)}`);
      assert.match(r.out, /FAIL — 작업 기록/);
      assert.match(r.out, /결과: ❌ FAIL/);
    }
  } finally {
    sb.done();
  }
});

test("작업 기록이 통과하면 Full 은 예전처럼 build · test:e2e 까지 돎 (조기 실패가 정상 실행을 줄이지 않음) (작업 0243)", () => {
  const sb = sandbox({ changed: ["apps/web/src/a.tsx"] });
  try {
    const r = sb.run({ LOOP: "full" });
    assert.equal(r.status, 0, r.out);
    assert.deepEqual(r.npm, ["typecheck", "lint", "test", "build", "test:e2e"]);
    assert.match(r.out, /결과: ✅ ALL PASS/);
  } finally {
    sb.done();
  }
});

test("CI(PR) Quick: 화면에 영향 있는 파일이 바뀌면 build · test:e2e 도 돎 (작업 0243)", () => {
  for (const changed of [["apps/web/src/a.tsx"], [".github/workflows/checks.yml"], ["docs/a.md", "apps/api/src/index.ts"]]) {
    const sb = sandbox({ changed });
    try {
      const r = sb.run({ ...CI_PR });
      assert.equal(r.status, 0, r.out);
      assert.deepEqual(r.npm, ["typecheck", "lint", "test", "build", "test:e2e"], JSON.stringify(changed));
    } finally {
      sb.done();
    }
  }
});

test("CI(PR) Quick: 문서 · 하네스 · 쓰기 자료만 바뀌면 e2e 를 건너뜀 (작업 0243)", () => {
  for (const changed of [[".agents/orchestration/TASKS.md", ".agents/specs/0243-x/plan.md"], ["docs/domain/x.md", "README.md"], ["apps/api/data/geo-answers/2026-11-20.json"], []]) {
    const sb = sandbox({ changed });
    try {
      const r = sb.run({ ...CI_PR });
      assert.equal(r.status, 0, r.out);
      assert.deepEqual(r.npm, ["typecheck", "lint", "test"], JSON.stringify(changed));
    } finally {
      sb.done();
    }
  }
});

test("로컬 · push(main) 은 지금 그대로 — Quick 은 e2e 없음 (작업 0243)", () => {
  const sb = sandbox({ changed: ["apps/web/src/a.tsx"] });
  try {
    const local = sb.run();
    assert.deepEqual(local.npm, ["typecheck", "lint", "test"], "로컬(CI 없음)");
    const push = sb.run({ CI: "true", GITHUB_EVENT_NAME: "push" });
    assert.deepEqual(push.npm, ["typecheck", "lint", "test"], "main push");
  } finally {
    sb.done();
  }
});

test("CI(PR) Full 은 문서만 바뀌어도 늘 build · test:e2e (Full 은 줄이지 않음) (작업 0243)", () => {
  const sb = sandbox({ changed: ["docs/a.md"] });
  try {
    const r = sb.run({ ...CI_PR, LOOP: "full" });
    assert.equal(r.status, 0, r.out);
    assert.deepEqual(r.npm, ["typecheck", "lint", "test", "build", "test:e2e"]);
  } finally {
    sb.done();
  }
});
