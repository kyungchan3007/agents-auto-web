// 작업 0197 — 사이트 이름 표기 Flapfx (테스트 먼저 · 구현 전에는 FAIL 이 정상)
// 사용자 "Flapfx 로 해줘" (#228) — 사이트 이름으로 쓰던 한글 "플랩" 을 Flapfx 로. 바꾸지 않는 것: "스플릿 플랩"(글자판 이름) · 지난 기록(.agents/specs · apps/api/data) · 보호 파일 apps/web/wrangler.jsonc 의 주석 · 로고 워드마크 소문자 flapfx
//   조사: Flapfx 는 받침 없는 발음이라 "Flapfx입니다 · Flapfx는"
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { SITE_NAME } from "../shared/site";

const ROOT = join(__dirname, "../../../..");
// 검사 자신 · 그 e2e 는 "플랩" 을 설명 글로 적으므로 뺌
const SKIP_PREFIX = ["apps/api/data/", ".agents/", "apps/web/wrangler.jsonc", "apps/web/src/checks/site-name.test.ts", "apps/web/e2e/site-name.spec.ts"];
const BINARY = /\.(png|jpe?g|webp|gif|ico|woff2?|glb|gltf|bin|jpg|mp4|pdf)$/i;

function trackedTextFiles(): string[] {
  const out = execFileSync("git", ["ls-files", "-z", "--", "apps", "packages", "docs", "README.md"], { cwd: ROOT, encoding: "utf8" }); // -z: 한글 · 특수 문자 파일 이름을 따옴표 · 8진수 없이 그대로 받음 (작업 0240)
  return out.split("\0").filter((f) => f && !BINARY.test(f) && !SKIP_PREFIX.some((p) => f.startsWith(p)));
}

describe("사이트 이름 — 한글 '플랩' 이 남지 않음", () => {
  it("SITE_NAME 은 Flapfx", () => expect(SITE_NAME).toBe("Flapfx"));

  it("apps · packages · docs · README 의 추적 파일에 사이트 이름으로 쓰인 '플랩' 이 0 (스플릿 플랩 · 지난 기록 · 보호 파일 제외)", () => {
    const left: string[] = [];
    for (const f of trackedTextFiles()) {
      const lines = readFileSync(join(ROOT, f), "utf8").split("\n");
      lines.forEach((line, i) => {
        if (line.replace(/스플릿 플랩/g, "").includes("플랩")) left.push(`${f}:${i + 1} ${line.trim().slice(0, 80)}`);
      });
    }
    expect(left, `남은 '플랩':\n${left.join("\n")}`).toEqual([]);
  });

  it("글자판 이름 '스플릿 플랩' 은 그대로 (사이트 이름이 아님)", () => {
    const flap = readFileSync(join(ROOT, "packages/ui/src/lib/flap.ts"), "utf8");
    expect(flap).toContain("스플릿 플랩");
  });

  it("로고 워드마크는 소문자 flapfx 그대로 (메뉴 · 인트로)", () => {
    expect(readFileSync(join(ROOT, "apps/web/src/shared/nav/site-nav.tsx"), "utf8")).toContain('title="flapfx"');
  });
});
