// 작업 0179 — GitHub Actions 화면을 처음 보는 사람도 알아보게: 워크플로 이름은 한국어 · 작업실 카드는 검사 기록만 · README 에 목록
// workflow_run 은 이름 문자열로 이어지므로, 이름을 바꾸면 가리키는 쪽도 같이 바뀌어야 함 (안 바뀌면 배포가 조용히 끊김)
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../../../..");
const WF = join(ROOT, ".github/workflows");
const files = readdirSync(WF).filter((f) => f.endsWith(".yml"));
const text = (f: string) => readFileSync(join(WF, f), "utf8");
const nameOf = (f: string) => (text(f).match(/^name:\s*"?(.+?)"?\s*$/m) ?? [])[1] ?? "";

describe("GitHub Actions 워크플로 이름", () => {
  it("모든 워크플로 이름에 한글이 있음", () => {
    expect(files.filter((f) => !/[가-힣]/.test(nameOf(f)))).toEqual([]);
  });

  it("검사 워크플로 이름은 '검사' 로 시작", () => {
    expect(nameOf("checks.yml")).toMatch(/^검사/);
  });

  it("workflow_run 이 가리키는 이름이 실제 워크플로에 있음", () => {
    const names = new Set(files.map(nameOf));
    const targets = files.flatMap((f) =>
      [...text(f).matchAll(/workflows:\s*\[([^\]]+)\]/g)].flatMap((m) => m[1].split(",").map((s) => s.trim().replace(/^["']|["']$/g, ""))),
    );
    expect(targets.length).toBeGreaterThan(0);
    expect(targets.filter((t) => !names.has(t))).toEqual([]);
  });
});

// 작업실 "자동 검사 (main)" 카드 연결 검사는 apps/admin/src/features/log/status/status-view.test.ts (작업 0312)
describe("README", () => {

  it("README 에 자동으로 도는 일 목록 · 워크플로 파일 이름이 모두 나옴", () => {
    const readme = readFileSync(join(ROOT, "README.md"), "utf8");
    expect(readme).toContain("자동으로 도는 일");
    expect(files.filter((f) => !readme.includes(f))).toEqual([]);
  });
});
