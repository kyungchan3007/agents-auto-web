// 만드는 방식 숫자 세기 (작업 0312 — app/how/page.tsx 에 있던 세기를 순수 함수로)
import { describe, expect, it } from "vitest";
import { countHookScripts, countRules, countSpecs } from "./repo-counts";

describe("만드는 방식 숫자", () => {
  it("작업 폴더는 NNNN- 로 시작하는 것만", () => {
    expect(countSpecs(["0001-a", "0312-admin-split", "README.md", "_template", "_template-full"])).toBe(2);
  });
  it("보호 규칙은 빈 줄 · 주석을 뺀 줄", () => {
    expect(countRules("# 설명\nAGENTS.md\n\n  # 들여쓴 주석\n**/wrangler.jsonc\n")).toBe(2);
  });
  it("훅은 부르는 스크립트 이름으로 겹침 없이 · 스크립트가 아니면 명령 그대로", () => {
    const json = JSON.stringify({
      hooks: {
        PreToolUse: [{ hooks: [{ command: "node .agents/scripts/outside-guard.mjs" }, { command: "node .agents/scripts/e2e-guard.mjs" }] }],
        Stop: [{ hooks: [{ command: "node .agents/scripts/outside-guard.mjs" }, { command: "echo done" }] }],
      },
    });
    expect(countHookScripts(json)).toBe(3);
    expect(countHookScripts("{}")).toBe(0);
  });
});
