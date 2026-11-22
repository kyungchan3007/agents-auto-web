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
  writeFileSync(
    npm,
    [
      "#!/bin/sh",
      "# 가짜 npm — npm run [-s] <스크립트> 만 기록 · 실패는 환경변수로 (작업 0246)",
      'for a in "$@"; do case "$a" in run|-s) ;; *) echo "npm:$a" >> "$GATE_LOG";; esac; done',
      '# 막지 않는 호출 = 인자에 @design 이 있고 반전(invert · (?!)이 없는 호출 · 그 밖의 test · test:e2e 호출은 막는 호출',
      'joined="$*"',
      'nonblocking=0',
      'case "$joined" in *@design*) case "$joined" in *invert*|*"(?!"*) ;; *) nonblocking=1;; esac;; esac',
      'case "$joined" in *test*) if [ "$nonblocking" = "1" ]; then [ "${DESIGN_FAIL:-}" = "1" ] && exit 1; else [ "${FUNC_FAIL:-}" = "1" ] && exit 1; fi;; esac',
      "exit 0",
      "",
    ].join("\n"),
  );
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

// ─────────────────────────────────────────────────────────────────────────────
// 작업 0244 — develop 흐름 · 대상 브랜치별 e2e 고르기
//
// [계약] e2e-select.mjs (builder 가 만듦 · 이름 · 반환 모양을 바꾸려면 이 테스트 머리부터 고친다)
//   export function selectE2e(files, { target, map })
//     files  : 저장소 루트 기준 바뀐 파일 경로 배열
//     target : PR 이 들어가는 브랜치 이름 — "main" 이면 full · 그 밖(develop 등)은 develop 규칙
//     map    : .agents/e2e-map.json 을 읽은 객체 { "경로 접두어": ["spec 파일 이름"], "smoke": ["spec 파일 이름"] }
//   반환 { mode, specs, projects, warn? }
//     mode "none"     : 조용한 파일뿐(e2eNeeded 가 false) — specs [] · projects []
//     mode "full"     : 대상 main — specs [](= 전부) · projects ["넓은 화면", "휴대폰"]
//     mode "selected" : 대상 develop — 연결표로 고른 spec(중복 없이 · 이름순) · projects ["넓은 화면"]
//     mode "smoke"    : 대상 develop 인데 연결표 밖 파일이 있음 — specs = smoke 목록 ∪ 연결표로 고른 spec(이름순) · projects ["넓은 화면"] · warn = 연결표 밖 파일 이름을 담은 한 줄
//     warn 은 smoke 일 때만 있음 (다른 모드는 warn 없음 · undefined)
//   규칙: 파일마다 "가장 긴 접두어" 하나가 이긴다(짧은 접두어 spec 이 섞이지 않음) · 접두어는 문자열 앞부분(startsWith) ·
//        apps/web/e2e/<이름>.spec.ts 가 바뀌면 그 spec 자신을 고름 · 조용한 파일은 건너뜀 · "smoke" 키는 접두어가 아님
//   CLI: node .agents/scripts/e2e-select.mjs — 바뀐 파일(changedFiles) · 대상 브랜치(GITHUB_BASE_REF 없으면 develop)로 위 결과를 JSON 한 줄로 찍음
// [계약] lib.mjs baseRef(cwd = ROOT, env = process.env)
//   CI(PR)에서 GITHUB_BASE_REF 가 있으면 origin/$GITHUB_BASE_REF 와의 갈림점 · 없으면(로컬) origin/develop → origin/main 순서로 첫 갈림점
// [계약] e2e-needed.mjs — rigs/ 도 조용한 파일(폴더 경계까지 맞아야 함)
// ─────────────────────────────────────────────────────────────────────────────
const WIDE = "넓은 화면";
const PHONE = "휴대폰";
const E2E_DIR = pathJoin(REPO, "apps", "web", "e2e");
const REAL_MAP = () => JSON.parse(fsRead(pathJoin(REPO, ".agents", "e2e-map.json"), "utf8"));
const FAKE_MAP = {
  smoke: ["home.spec.ts", "prices-redesign.spec.ts"],
  "apps/web/src/features/home/": ["home.spec.ts", "home-bars.spec.ts"],
  "apps/web/src/features/travel-price/": ["prices-redesign.spec.ts", "flights-chart.spec.ts"],
  "apps/web/src/features/travel-price/components/flights-": ["flights-chart.spec.ts"],
  "packages/ui/src/": ["common-design.spec.ts"],
};

test("연결표: e2e/*.spec.ts 가 모두 연결표에 있고, 표의 spec · smoke 는 모두 실제 파일 (작업 0244)", () => {
  const map = REAL_MAP();
  const specs = list(E2E_DIR).filter((f) => f.endsWith(".spec.ts"));
  assert.ok(specs.length >= 45, `spec 파일이 ${specs.length}개뿐 — 위치가 바뀐 건 아닌지`);
  const listed = new Set(Object.values(map).flat());
  assert.deepEqual(specs.filter((f) => !listed.has(f)), [], "연결표에 없는 spec — 새 spec 은 연결표 한 줄까지가 작업");
  assert.deepEqual([...listed].filter((f) => !specs.includes(f)), [], "연결표에 있는데 파일이 없는 spec 이름");
});

test("연결표: smoke 는 주요 확인 몇 개(3 ~ 8개) · 경로 접두어는 실제 있는 경로 · spec 목록은 비어 있지 않음 (작업 0244)", () => {
  const map = REAL_MAP();
  assert.ok(Array.isArray(map.smoke) && map.smoke.length >= 3 && map.smoke.length <= 8, `smoke ${map.smoke?.length}개`);
  assert.equal(new Set(map.smoke).size, map.smoke.length, "smoke 에 같은 spec 이 두 번");
  for (const [prefix, specs] of Object.entries(map)) {
    assert.ok(Array.isArray(specs) && specs.length > 0, `${prefix}: spec 목록이 비어 있음`);
    assert.equal(new Set(specs).size, specs.length, `${prefix}: 같은 spec 이 두 번`);
    if (prefix === "smoke") continue;
    const dir = prefix.endsWith("/") ? prefix : pathDirname(prefix);
    const names = list(pathJoin(REPO, dir));
    const ok = prefix.endsWith("/") ? names.length > 0 : names.some((n) => `${dir}/${n}`.startsWith(prefix));
    assert.ok(ok, `${prefix}: 이런 경로가 저장소에 없음`);
  }
});

test("연결표: 주요 화면(홈 · 환율 · 여행 물가 · 여행 타이밍 · 직구 계산)이 기능 폴더에 연결됨 (작업 0244)", () => {
  const map = REAL_MAP();
  for (const prefix of ["apps/web/src/features/home/", "apps/web/src/features/currencies/", "apps/web/src/features/travel-price/", "apps/web/src/features/import-calc/", "packages/ui/src/"]) {
    assert.ok(map[prefix]?.length > 0, `${prefix} 가 연결표에 없음`);
  }
});

test("고르기: 대상 main 은 전체 · 두 프로젝트 (연결표를 보지 않음) (작업 0244)", async () => {
  const { selectE2e } = await import("./e2e-select.mjs");
  const r = selectE2e(["apps/web/src/features/home/components/a.tsx"], { target: "main", map: FAKE_MAP });
  assert.deepEqual(r, { mode: "full", specs: [], projects: [WIDE, PHONE] });
  assert.equal(selectE2e(["apps/api/src/index.ts"], { target: "main", map: FAKE_MAP }).mode, "full");
});

test("고르기: 조용한 파일뿐이면 대상이 무엇이든 none (rigs 포함) (작업 0244)", async () => {
  const { selectE2e } = await import("./e2e-select.mjs");
  const quiet = [".agents/e2e-map.json", "docs/a.md", "README.md", "apps/api/data/x.json", "rigs/hav/rig.template.yaml"];
  for (const target of ["main", "develop"]) {
    assert.deepEqual(selectE2e(quiet, { target, map: FAKE_MAP }), { mode: "none", specs: [], projects: [] }, target);
    assert.equal(selectE2e([], { target, map: FAKE_MAP }).mode, "none", `${target} · 빈 목록`);
  }
});

test("고르기: 대상 develop 은 연결표 spec 만 · 넓은 화면만 (중복 없이 이름순) (작업 0244)", async () => {
  const { selectE2e } = await import("./e2e-select.mjs");
  const r = selectE2e(["apps/web/src/features/home/components/a.tsx", "apps/web/src/features/home/lib/b.ts", "docs/x.md"], { target: "develop", map: FAKE_MAP });
  assert.deepEqual(r, { mode: "selected", specs: ["home-bars.spec.ts", "home.spec.ts"], projects: [WIDE] });
  assert.equal("warn" in r, false, "연결표 안이면 경고 없음");
  const two = selectE2e(["packages/ui/src/a.tsx", "apps/web/src/features/home/a.ts"], { target: "develop", map: FAKE_MAP });
  assert.deepEqual(two.specs, ["common-design.spec.ts", "home-bars.spec.ts", "home.spec.ts"]);
});

test("고르기: 파일마다 가장 긴 접두어가 이김 — 짧은 접두어의 spec 이 섞이지 않음 (작업 0244)", async () => {
  const { selectE2e } = await import("./e2e-select.mjs");
  const fine = selectE2e(["apps/web/src/features/travel-price/components/flights-graph.tsx"], { target: "develop", map: FAKE_MAP });
  assert.deepEqual(fine.specs, ["flights-chart.spec.ts"]);
  const broad = selectE2e(["apps/web/src/features/travel-price/lib/x.ts"], { target: "develop", map: FAKE_MAP });
  assert.deepEqual(broad.specs, ["flights-chart.spec.ts", "prices-redesign.spec.ts"]);
});

test("고르기: spec 파일 자신이 바뀌면 그 spec 을 고름 · 지원 파일(helpers 등)은 연결표 밖 (작업 0244)", async () => {
  const { selectE2e } = await import("./e2e-select.mjs");
  const own = selectE2e(["apps/web/e2e/pages.spec.ts"], { target: "develop", map: FAKE_MAP });
  assert.deepEqual(own, { mode: "selected", specs: ["pages.spec.ts"], projects: [WIDE] });
  const helper = selectE2e(["apps/web/e2e/helpers.ts"], { target: "develop", map: FAKE_MAP });
  assert.equal(helper.mode, "smoke");
});

test("고르기: 연결표 밖 화면 파일이 있으면 smoke + 경고 · 연결표로 고른 spec 은 함께 (작업 0244)", async () => {
  const { selectE2e } = await import("./e2e-select.mjs");
  const out = selectE2e(["apps/web/src/features/newthing/a.tsx"], { target: "develop", map: FAKE_MAP });
  assert.equal(out.mode, "smoke");
  assert.deepEqual(out.specs, ["home.spec.ts", "prices-redesign.spec.ts"]);
  assert.deepEqual(out.projects, [WIDE]);
  assert.match(out.warn, /apps\/web\/src\/features\/newthing\/a\.tsx/, "경고에 연결표 밖 파일 이름");
  const mixed = selectE2e(["apps/web/src/features/newthing/a.tsx", "apps/web/src/features/home/a.ts", "docs/a.md"], { target: "develop", map: FAKE_MAP });
  assert.equal(mixed.mode, "smoke");
  assert.deepEqual(mixed.specs, ["home-bars.spec.ts", "home.spec.ts", "prices-redesign.spec.ts"]);
  assert.ok(!mixed.warn.includes("home/a.ts") && !mixed.warn.includes("docs/a.md"), "연결표 안 · 조용한 파일은 경고에 없음");
  assert.equal(selectE2e([".github/workflows/checks.yml"], { target: "develop", map: FAKE_MAP }).mode, "smoke", "워크플로도 연결표 밖");
});

test("고르기: 접두어는 문자열 앞부분이라 비슷한 이름에 속지 않음 (작업 0244)", async () => {
  const { selectE2e } = await import("./e2e-select.mjs");
  assert.equal(selectE2e(["apps/web/src/features/home-extra/a.tsx"], { target: "develop", map: FAKE_MAP }).mode, "smoke");
  assert.equal(selectE2e(["xapps/web/src/features/home/a.tsx"], { target: "develop", map: FAKE_MAP }).mode, "smoke");
});

test("고르기: 진짜 연결표로 — 홈 · 타이밍 파일은 맞는 spec 만, 대상 develop 이면 휴대폰 없음 (작업 0244)", async () => {
  const { selectE2e } = await import("./e2e-select.mjs");
  const map = REAL_MAP();
  const home = selectE2e(["apps/web/src/features/home/components/flap-board.tsx"], { target: "develop", map });
  assert.equal(home.mode, "selected");
  assert.ok(home.specs.includes("home.spec.ts"));
  assert.deepEqual(home.projects, [WIDE]);
  const flights = selectE2e(["apps/web/src/features/travel-price/components/flights-graph.tsx"], { target: "develop", map });
  assert.ok(flights.specs.includes("flights-chart.spec.ts") && !flights.specs.includes("prices-route.spec.ts"));
  const ui = selectE2e(["packages/ui/src/components/text/a.tsx"], { target: "develop", map });
  assert.equal(ui.mode, "selected", "공용 UI 는 연결표 안 — 경고 없이 공용 spec");
  for (const s of [...home.specs, ...flights.specs, ...ui.specs]) assert.ok(list(E2E_DIR).includes(s), `${s} 파일 없음`);
});

// baseRef — 진짜 git 저장소를 만들어 확인 (origin/main ← origin/develop ← task 브랜치)
function gitRepo() {
  const root = mkdtempSync(pathJoin(tmpdir(), "hav-base-"));
  const g = (...a) => spawnSync("git", a, { cwd: root, encoding: "utf8" }).stdout.trim();
  const commit = (name) => { writeFileSync(pathJoin(root, name), name); g("add", "-A"); g("commit", "-q", "-m", name); return g("rev-parse", "HEAD"); };
  g("init", "-q", "-b", "main");
  g("config", "user.email", "t@t");
  g("config", "user.name", "t");
  const m0 = commit("m0");
  g("update-ref", "refs/remotes/origin/main", m0);
  g("checkout", "-q", "-b", "develop");
  const d1 = commit("d1");
  g("update-ref", "refs/remotes/origin/develop", d1);
  g("checkout", "-q", "-b", "task/x");
  commit("t1");
  return { root, m0, d1, g, done: () => rmSync(root, { recursive: true, force: true }) };
}

test("baseRef: 로컬은 origin/develop 갈림점 (develop 에서 딴 작업 브랜치) (작업 0244)", async () => {
  const { baseRef } = await import("./lib.mjs");
  const r = gitRepo();
  try {
    assert.equal(baseRef(r.root, {}), r.d1);
  } finally { r.done(); }
});

test("baseRef: 로컬에 origin/develop 이 없으면 origin/main 갈림점 (작업 0244)", async () => {
  const { baseRef } = await import("./lib.mjs");
  const r = gitRepo();
  try {
    r.g("update-ref", "-d", "refs/remotes/origin/develop");
    assert.equal(baseRef(r.root, {}), r.m0);
  } finally { r.done(); }
});

test("baseRef: CI(PR)는 GITHUB_BASE_REF 를 따름 — main 이면 main 갈림점 · develop 이면 develop 갈림점 (작업 0244)", async () => {
  const { baseRef } = await import("./lib.mjs");
  const r = gitRepo();
  try {
    assert.equal(baseRef(r.root, { GITHUB_BASE_REF: "main" }), r.m0, "대상 main 인데 develop 갈림점을 쓰면 develop 에만 있는 변경이 빠짐");
    assert.equal(baseRef(r.root, { GITHUB_BASE_REF: "develop" }), r.d1);
    assert.equal(baseRef(r.root, { GITHUB_BASE_REF: "" }), r.d1, "빈 값은 로컬 규칙");
  } finally { r.done(); }
});

test("baseRef: GITHUB_BASE_REF 가 가리키는 origin 브랜치가 없으면 로컬 규칙으로 (죽지 않음) (작업 0244)", async () => {
  const { baseRef } = await import("./lib.mjs");
  const r = gitRepo();
  try {
    assert.equal(baseRef(r.root, { GITHUB_BASE_REF: "nope" }), r.d1);
  } finally { r.done(); }
});

test("changedFiles: 대상 main 이면 develop 에만 있던 변경도 바뀐 파일에 포함 (작업 0244)", async () => {
  const { changedFiles } = await import("./lib.mjs");
  const r = gitRepo();
  try {
    assert.deepEqual(changedFiles(r.root, {}), ["t1"], "로컬 · develop 기준");
    assert.deepEqual(changedFiles(r.root, { GITHUB_BASE_REF: "main" }), ["d1", "t1"], "대상 main 기준");
  } finally { r.done(); }
});

test("e2e 필요 판정: rigs/ 는 조용한 파일 — 폴더 경계까지 맞아야 함 (작업 0244)", async () => {
  const { e2eNeeded } = await import("./e2e-needed.mjs");
  assert.equal(e2eNeeded(["rigs/hav/rig.template.yaml"]), false);
  assert.equal(e2eNeeded(["rigs/hav/seats/test.yaml", "docs/a.md"]), false);
  assert.equal(e2eNeeded(["rigsx/a.ts"]), true);
  assert.equal(e2eNeeded(["apps/web/rigs/a.ts"]), true, "맨 앞 rigs/ 만");
  assert.equal(e2eNeeded(["rigs/a.yaml", "apps/web/src/a.tsx"]), true, "화면 파일과 섞이면 true");
});

test("고르기: 연결표 안 기능 파일 + 연결표 밖 공용 파일이 같이 바뀌면 '고른 spec ∪ smoke' + 경고 — smoke 만이면 바꾼 기능 spec 이 빠짐 (작업 0244)", async () => {
  const { selectE2e } = await import("./e2e-select.mjs");
  const files = ["apps/web/src/features/travel-price/components/flights-graph.tsx", "apps/web/src/bff/proxy.ts"]; // 뒤 파일은 진짜 연결표에 없는 공용 파일
  const map = REAL_MAP();
  assert.ok(!Object.keys(map).some((p) => files[1].startsWith(p)), "시험 전제: 이 파일은 연결표 밖이어야 함 (연결표에 넣었다면 다른 연결표 밖 파일로 바꿀 것)");
  const r = selectE2e(files, { target: "develop", map });
  assert.equal(r.mode, "smoke");
  const flights = selectE2e([files[0]], { target: "develop", map }).specs;
  for (const s of [...flights, ...map.smoke]) assert.ok(r.specs.includes(s), `${s} 가 합집합에 없음`);
  assert.deepEqual(r.specs, [...new Set([...flights, ...map.smoke])].sort(), "합집합 · 중복 없이 · 이름순");
  assert.deepEqual(r.projects, [WIDE]);
  assert.match(r.warn, /apps\/web\/src\/bff\/proxy\.ts/);
  assert.ok(!r.warn.includes("flights-graph"), "연결표 안 파일은 경고에 없음");
});

// ─────────────────────────────────────────────────────────────────────────────
// 작업 0246 — 디자인 PR 판정 · 게이트 (테스트 먼저 · design-pr.mjs · checks.sh 구현 전에는 FAIL 이 정상)
//
// [계약] design-pr.mjs (builder 가 만듦 · 이름 · 반환 모양을 바꾸려면 이 테스트 머리부터 고친다)
//   export function designPr(files, { labels, target })
//     files  : 저장소 루트 기준 바뀐 파일 경로 배열
//     labels : PR 라벨 이름 배열 ("design" 이 있어야 디자인 PR 후보)
//     target : PR 이 들어가는 브랜치 이름 ("main" 이면 하루 마무리 · 같은 규칙 — 그 구간 바뀐 파일이 모두 허용 목록 안인지)
//   반환 { design: boolean, reason: string, warn?: string, offending?: string[] }
//     라벨 없음 → design false (reason 에 이유 · warn 없음)
//     라벨 있음 + 파일이 모두 허용 목록(화면 쪽) 안 → design true
//     라벨 있음 + 밖 파일이 하나라도 → design false · warn 에 "design 라벨인데 이 파일이 섞였다" 와 밖 파일 이름 · offending 에 밖 파일 목록
//     빈 파일 목록 → design false (가려내지 못하면 평소 규칙)
//   허용 목록 방식: 목록에 없으면 평소 PR (lib · hooks · api · shared · 설정 · 하네스 · 워크플로 · 보호 파일 AGENTS.md · CLAUDE.md 는 밖)
//   export function readLabels(eventPath)  — GITHUB_EVENT_PATH 의 pull_request.labels[].name 배열 · 경로 없음 · 파일 없음 · 깨진 JSON · 라벨 칸 없음은 모두 []
//   CLI: node .agents/scripts/design-pr.mjs → 바뀐 파일(changedFiles) · 라벨(GITHUB_EVENT_PATH) · 대상(GITHUB_BASE_REF)로 위 결과를 JSON 한 줄로
// [계약] checks.sh — CI(PR)에서 design-pr 결과로
//   디자인 PR: test · test:e2e 를 두 번씩 돎 — 막는 호출(@design 제외: 인자에 invert 또는 (?! 가 있음) · 막지 않는 호출(인자에 @design · invert 없음)
//             막지 않는 호출이 실패해도 결과 PASS · 로그에 "막지 않음" 묶음 · 막는 호출(기능)이 실패하면 FAIL
//   결과 줄: "디자인 PR: 예 · 디자인 테스트 실패 N개(막지 않음)" / "디자인 PR: 아니오(이유)"
//   평소 PR · 라벨 읽기 실패 · 로컬: 지금 그대로(@design 인자를 쓰지 않음 · 한 번만 돎)
// ─────────────────────────────────────────────────────────────────────────────
const DESIGN_FILES = [
  "apps/web/src/features/home/components/hero-section.tsx",
  "apps/web/src/features/import-calc/components/calc-page.tsx",
  "packages/ui/src/components/flap/flap-board.tsx",
  "packages/ui/src/tokens.css",
  "apps/web/src/features/travel-price/components/airfare-calendar.css",
  "apps/web/src/app/calc/page.tsx",
  "apps/web/e2e/home.spec.ts",
  "apps/web/e2e-responsive/x.spec.ts",
  "apps/web/src/shared/calc-blue.test.ts",
  "apps/web/src/features/home/components/ticket.test.tsx",
  ".agents/specs/0246-x/plan.md",
  "docs/design-tests-pending.md",
  "README.md",
];

test("디자인 PR 판정: 평소 PR — 라벨 없음이면 파일이 화면 쪽뿐이어도 평소 (작업 0246)", async () => {
  const { designPr } = await import("./design-pr.mjs");
  const r = designPr(DESIGN_FILES, { labels: [], target: "develop" });
  assert.equal(r.design, false);
  assert.equal(typeof r.reason, "string");
  assert.ok(r.reason.length > 0, "이유가 비어 있지 않음");
  assert.equal(r.warn, undefined, "라벨이 없으면 경고도 없음");
  assert.equal(designPr(DESIGN_FILES, { labels: ["harness-approved"], target: "develop" }).design, false, "다른 라벨은 design 이 아님");
});

test("디자인 PR 판정: 디자인 PR — design 라벨 + 화면 쪽 파일(부품 · 스타일 · 화면 코드 · 테스트 · 작업 기록 · 문서)뿐 (작업 0246)", async () => {
  const { designPr } = await import("./design-pr.mjs");
  const r = designPr(DESIGN_FILES, { labels: ["design"], target: "develop" });
  assert.equal(r.design, true, JSON.stringify(r));
  assert.equal(r.warn, undefined);
  assert.equal(designPr(["apps/web/src/features/home/components/ticket.tsx"], { labels: ["x", "design"], target: "develop" }).design, true, "라벨이 여럿이어도 design 이 있으면");
});

test("디자인 PR 판정: 하루 마무리(대상 main) — 그날 디자인뿐이면 디자인 PR (작업 0246)", async () => {
  const { designPr } = await import("./design-pr.mjs");
  assert.equal(designPr(DESIGN_FILES, { labels: ["design"], target: "main" }).design, true);
});

test("디자인 PR 판정: 하루 마무리(대상 main) — 평소 파일이 섞이면 평소 + 경고 (작업 0246)", async () => {
  const { designPr } = await import("./design-pr.mjs");
  const r = designPr([...DESIGN_FILES, "apps/web/src/features/home/lib/rank.ts"], { labels: ["design"], target: "main" });
  assert.equal(r.design, false);
  assert.deepEqual(r.offending, ["apps/web/src/features/home/lib/rank.ts"]);
  assert.match(r.warn ?? "", /design 라벨인데 이 파일이 섞였다/);
});

test("디자인 PR 판정: 라벨 있음 + 밖 파일 → 평소 + 경고 (밖 파일 이름이 경고에 들어감) (작업 0246)", async () => {
  const { designPr } = await import("./design-pr.mjs");
  const outside = [
    "apps/web/src/features/home/lib/rank.ts",
    "apps/web/src/features/home/hooks/use-trip.ts",
    "apps/api/src/index.ts",
    "packages/shared/src/index.ts",
    ".github/workflows/checks.yml",
    ".agents/checks.sh",
    ".agents/scripts/lib.mjs",
    "package.json",
    "AGENTS.md",
    "CLAUDE.md",
  ];
  for (const f of outside) {
    const r = designPr(["apps/web/src/features/home/components/ticket.tsx", f], { labels: ["design"], target: "develop" });
    assert.equal(r.design, false, `${f} 는 화면 쪽이 아님`);
    assert.deepEqual(r.offending, [f], f);
    assert.ok((r.warn ?? "").includes(f), `경고에 ${f} 이름이 들어감`);
    assert.match(r.warn ?? "", /design 라벨인데/);
  }
});

test("디자인 PR 판정: 허용 목록 방식 — 폴더 이름이 비슷한 것 · 화면 부품 밖 폴더는 속지 않음 (작업 0246)", async () => {
  const { designPr } = await import("./design-pr.mjs");
  for (const f of [
    "apps/web/src/features/home/componentsx/a.tsx",
    "apps/web/src/features/home/lib/components/a.tsx",
    "apps/web/src/lib/a.ts",
    "packages/ui/src/hooks/a.ts",
    "apps/web/next.config.ts",
    "apps/web/src/app/api/route.ts",
  ]) {
    assert.equal(designPr([f], { labels: ["design"], target: "develop" }).design, false, f);
  }
});

test("디자인 PR 판정: 빈 파일 목록은 평소 — 가려내지 못하면 막는 쪽 (작업 0246)", async () => {
  const { designPr } = await import("./design-pr.mjs");
  assert.equal(designPr([], { labels: ["design"], target: "develop" }).design, false);
});

test("디자인 PR 판정: 라벨 읽기 — 경로 없음 · 파일 없음 · 깨진 JSON · 라벨 칸 없음은 빈 목록, 있으면 이름만 (작업 0246)", async () => {
  const { readLabels } = await import("./design-pr.mjs");
  const dir = mkdtempSync(pathJoin(tmpdir(), "hav-ev-"));
  try {
    const ok = pathJoin(dir, "ok.json");
    writeFileSync(ok, JSON.stringify({ pull_request: { labels: [{ name: "design" }, { name: "harness-approved" }] } }));
    assert.deepEqual(readLabels(ok), ["design", "harness-approved"]);
    const broken = pathJoin(dir, "broken.json");
    writeFileSync(broken, "{ 깨진");
    const noLabels = pathJoin(dir, "nolabels.json");
    writeFileSync(noLabels, JSON.stringify({ pull_request: {} }));
    const push = pathJoin(dir, "push.json");
    writeFileSync(push, JSON.stringify({ ref: "refs/heads/main" }));
    for (const p of [undefined, "", pathJoin(dir, "없음.json"), broken, noLabels, push]) assert.deepEqual(readLabels(p), [], String(p));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// 게이트 — 모래판에서 checks.sh 를 가짜 npm 으로 돌려 봄
function eventFile(labels) {
  const dir = mkdtempSync(pathJoin(tmpdir(), "hav-ev-"));
  const file = pathJoin(dir, "event.json");
  writeFileSync(file, JSON.stringify({ pull_request: { labels: labels.map((name) => ({ name })) } }));
  return { file, done: () => rmSync(dir, { recursive: true, force: true }) };
}
const designCalls = (npm) => npm.filter((c) => c.includes("@design"));
function gate(changed, { labels = ["design"], target = "main", env = {} } = {}) {
  const sb = sandbox({ changed });
  const ev = eventFile(labels);
  try {
    return { ...sb.run({ ...CI_PR, GITHUB_BASE_REF: target, GITHUB_EVENT_PATH: ev.file, ...env }), changed };
  } finally {
    sb.done();
    ev.done();
  }
}
const SCREEN = ["apps/web/src/features/home/components/ticket.tsx", "apps/web/e2e/home.spec.ts"];

test("게이트: 디자인 PR 에서 @design 실패는 막지 않음 — 결과 PASS · 로그에 막지 않음 묶음 · 판정 줄 (작업 0246)", () => {
  const r = gate(SCREEN, { env: { DESIGN_FAIL: "1" } });
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /디자인 PR: 예/);
  assert.match(r.out, /디자인 테스트 실패 \d+개/);
  assert.match(r.out, /막지 않음/);
  assert.ok(designCalls(r.npm).length >= 1, `@design 호출이 있음: ${r.npm}`);
});

test("게이트: 디자인 PR 에서 기능 테스트 실패는 FAIL — 막지 않는 묶음이 가리지 않음 (작업 0246)", () => {
  const r = gate(SCREEN, { env: { FUNC_FAIL: "1" } });
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /FAIL/);
  const both = gate(SCREEN, { env: { FUNC_FAIL: "1", DESIGN_FAIL: "1" } });
  assert.equal(both.status, 1, "둘 다 실패해도 FAIL");
});

test("게이트: 디자인 PR — 기능 · 디자인 둘 다 돌림(막는 호출 + 막지 않는 호출) · 디자인 테스트를 끄지 않음 (작업 0246)", () => {
  const r = gate(SCREEN, {});
  assert.equal(r.status, 0, r.out);
  const unit = r.npm.filter((c) => c === "test");
  assert.ok(unit.length >= 1);
  const blockingE2e = r.npm.filter((c) => c.includes("invert") || c.includes("(?!"));
  assert.ok(blockingE2e.length >= 1, `@design 를 뺀 막는 호출이 있음: ${r.npm}`);
  assert.ok(designCalls(r.npm).some((c) => !c.includes("invert") && !c.includes("(?!")), `@design 만 돌리는 호출이 있음: ${r.npm}`);
});

test("게이트: 평소 PR — 라벨이 없으면 @design 인자를 쓰지 않고 한 번만 돎(디자인 실패도 막음 = 구분 없음) · 판정 줄 아니오 (작업 0246)", () => {
  const r = gate(SCREEN, { labels: [], env: { DESIGN_FAIL: "1" } });
  assert.equal(r.status, 0, r.out);
  assert.deepEqual(designCalls(r.npm), [], "평소 PR 은 @design 로 나누지 않음");
  assert.match(r.out, /디자인 PR: 아니오/);
  assert.doesNotMatch(r.out, /막지 않음/);
});

test("게이트: 하루 마무리(대상 main) — 그날 디자인뿐이면 디자인 PR · @design 실패는 막지 않음 (작업 0246)", () => {
  const r = gate(SCREEN, { target: "main", env: { DESIGN_FAIL: "1" } });
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /디자인 PR: 예/);
});

test("게이트: 하루 마무리(대상 main) — 평소 PR 이 섞이면 평소 규칙(@design 로 나누지 않음) (작업 0246)", () => {
  const r = gate([...SCREEN, "apps/api/src/index.ts"], { target: "main", env: { DESIGN_FAIL: "1" } });
  assert.match(r.out, /디자인 PR: 아니오/);
  assert.deepEqual(designCalls(r.npm), []);
});

test("게이트: 라벨 있음 + 밖 파일 → 평소 + 경고 줄 (밖 파일 이름) (작업 0246)", () => {
  const r = gate([...SCREEN, "apps/web/src/features/home/lib/rank.ts"], { target: "develop" });
  assert.match(r.out, /디자인 PR: 아니오/);
  assert.match(r.out, /design 라벨인데 이 파일이 섞였다/);
  assert.match(r.out, /apps\/web\/src\/features\/home\/lib\/rank\.ts/);
  assert.deepEqual(designCalls(r.npm), []);
});

test("게이트: 라벨 읽기 실패(GITHUB_EVENT_PATH 없음 · 깨진 JSON)는 평소 — 죽지 않고 막는 쪽 (작업 0246)", () => {
  const none = gate(SCREEN, { env: { GITHUB_EVENT_PATH: "" } });
  assert.equal(none.status, 0, none.out);
  assert.match(none.out, /디자인 PR: 아니오/);
  assert.deepEqual(designCalls(none.npm), []);
  const dir = mkdtempSync(pathJoin(tmpdir(), "hav-ev-"));
  try {
    const bad = pathJoin(dir, "bad.json");
    writeFileSync(bad, "{ 깨진");
    const broken = gate(SCREEN, { env: { GITHUB_EVENT_PATH: bad } });
    assert.equal(broken.status, 0, broken.out);
    assert.match(broken.out, /디자인 PR: 아니오/);
    assert.deepEqual(designCalls(broken.npm), []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("게이트: 로컬(CI 아님)은 라벨이 있어도 지금 그대로 — @design 로 나누지 않음 (작업 0246)", () => {
  const sb = sandbox({ changed: SCREEN });
  try {
    const r = sb.run({});
    assert.equal(r.status, 0, r.out);
    assert.deepEqual(r.npm, ["typecheck", "lint", "test"]);
  } finally {
    sb.done();
  }
});

// ── e2e 범위 훅 (작업 0294) ──
import { cdOf, decideE2e, e2eRuns, playwrightArgs, words as e2eWords } from "./e2e-guard.mjs";

const e2eEvent = (command, cwd = "/repo") => ({ tool_name: "Bash", tool_input: { command }, cwd });
const pick = (specs, mode = "selected") => () => ({ mode, specs, projects: ["넓은 화면"] });
const quick = () => "quick";
const full = () => "full";

test("e2e 훅: e2e · 게이트가 아닌 명령은 통과 (단위 · typecheck · lint · git · 글 안의 낱말)", () => {
  for (const c of [
    "npx vitest run",
    "npm test",
    "npm run -s typecheck && npm run lint",
    "cd apps/web && npx eslint src/a.tsx",
    'git commit -m "npx playwright test 로 확인"',
    'rig send dev-test@hav "npm run test:e2e 는 돌리지 마"',
    "node .tmp/mock/fix.mjs",
  ]) assert.equal(decideE2e(e2eEvent(c), "/repo", { allowed: pick([]), loop: quick }), null, c);
  assert.equal(decideE2e({ tool_name: "Edit", tool_input: {} }, "/repo"), null);
});

test("e2e 훅: spec 없는 로컬 e2e 는 전체 실행이라 막음 (npx · npm run · turbo · pnpm · node_modules/.bin)", () => {
  for (const c of [
    "cd /repo/.tmp/wt-0290 && npx playwright test",
    "npm run -s test:e2e",
    "npm run -s test:e2e -- -- --project='넓은 화면'",
    "npx turbo run test:e2e",
    "cd apps/web && pnpm exec playwright test --project=휴대폰",
    "(cd apps/web && ./node_modules/.bin/playwright test --workers=4)",
  ]) {
    const r = decideE2e(e2eEvent(c), "/repo", { allowed: pick(["a.spec.ts"]), loop: quick });
    assert.match(r ?? "", /전체 실행/, c);
    assert.match(r, /a\.spec\.ts/, "돌릴 수 있는 목록을 알려 줌");
  }
});

test("e2e 훅: 고른 목록 안 spec 은 통과 · 밖 spec 은 막고 이름을 알려 줌", () => {
  const deps = { allowed: pick(["a.spec.ts", "b.spec.ts"]), loop: quick };
  assert.equal(decideE2e(e2eEvent("cd apps/web && npx playwright test e2e/a.spec.ts e2e/b.spec.ts:38"), "/repo", deps), null);
  assert.equal(decideE2e(e2eEvent('npm run -s test:e2e -- -- --project="넓은 화면" e2e/a.spec.ts'), "/repo", deps), null);
  assert.equal(decideE2e(e2eEvent("cd apps/web && AIRFARE_FIXTURE=1 npx playwright test -c e2e/airfare.config.ts e2e/a.spec.ts"), "/repo", deps), null, "-c 값은 걸러내기 인자가 아님");
  const r = decideE2e(e2eEvent("npx playwright test e2e/a.spec.ts e2e/tap-44.spec.ts e2e/home.spec.ts"), "/repo", deps);
  assert.match(r ?? "", /목록 밖 spec 입니다: tap-44\.spec\.ts, home\.spec\.ts/);
});

test("e2e 훅: 목록이 비면(화면 변경 없음) spec 실행도 막고 '대상이 없다'고 알려 줌", () => {
  const r = decideE2e(e2eEvent("npx playwright test e2e/a.spec.ts"), "/repo", { allowed: pick([], "none"), loop: quick });
  assert.match(r ?? "", /로컬 e2e 대상이 없습니다/);
});

test("e2e 훅: spec 이름이 아닌 걸러내기 인자 · --only-changed 는 막음", () => {
  for (const c of ["npx playwright test prices", "npx playwright test e2e/", "npx playwright test --only-changed=origin/develop"]) {
    assert.match(decideE2e(e2eEvent(c), "/repo", { allowed: pick(["prices-route.spec.ts"]), loop: quick }) ?? "", /걸러내기 인자/, c);
  }
});

test("e2e 훅: --last-failed · --list 는 통과", () => {
  const deps = { allowed: pick(["a.spec.ts"]), loop: quick };
  assert.equal(decideE2e(e2eEvent("npx playwright test --last-failed"), "/repo", deps), null);
  assert.equal(decideE2e(e2eEvent("npx playwright test --list"), "/repo", deps), null);
});

test("e2e 훅: checks.sh — Quick 은 통과 · Full 은 로컬 전체 게이트라 막음 · LOOP 앞붙임은 그대로 따름", () => {
  assert.equal(decideE2e(e2eEvent("bash .agents/checks.sh"), "/repo", { allowed: pick([]), loop: quick }), null);
  assert.match(decideE2e(e2eEvent("bash .agents/checks.sh"), "/repo", { allowed: pick([]), loop: full }) ?? "", /로컬 전체 게이트/);
  assert.equal(decideE2e(e2eEvent("LOOP=quick bash .agents/checks.sh"), "/repo", { allowed: pick([]), loop: full }), null);
  assert.match(decideE2e(e2eEvent("LOOP=full bash .agents/checks.sh"), "/repo", { allowed: pick([]), loop: quick }) ?? "", /로컬 전체 게이트/);
});

test("e2e 훅: 목록을 못 구하면(예외 · null) spec 지정 실행은 막지 않음 · 전체 실행은 그래도 막음", () => {
  const broken = { allowed: () => { throw new Error("git 없음"); }, loop: quick };
  assert.equal(decideE2e(e2eEvent("npx playwright test e2e/a.spec.ts"), "/repo", broken), null);
  assert.match(decideE2e(e2eEvent("npx playwright test"), "/repo", broken) ?? "", /전체 실행/);
});

test("e2e 훅: 실행 위치는 첫 cd 를 따름 · heredoc 본문은 명령이 아님 · 따옴표 값은 한 낱말", () => {
  assert.equal(cdOf("cd /repo/.tmp/wt-0290 && npx playwright test", "/x"), "/repo/.tmp/wt-0290");
  assert.equal(cdOf("(cd apps/web && npx playwright test)", "/repo"), "/repo/apps/web");
  assert.deepEqual(e2eRuns("cat > a.md <<'EOF'\nnpx playwright test\nEOF"), []);
  assert.deepEqual(e2eWords(`--project="넓은 화면" e2e/a.spec.ts`), ["--project=넓은 화면", "e2e/a.spec.ts"]);
  assert.deepEqual(playwrightArgs(["--project", "휴대폰", "e2e/a.spec.ts:12:3", "-g", "제목"]).specs, ["a.spec.ts"]);
  assert.deepEqual(playwrightArgs(["--project", "휴대폰", "-g", "제목"]).filters, []);
});
