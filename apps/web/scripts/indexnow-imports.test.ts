// IndexNow 보내기 스크립트가 설치 없이 시작함 (작업 0318 · 패치) — indexnow.yml 은 npm ci 없이 node 로 바로 돌림
//   그래서 indexnow.ts 에서 이어지는 가져오기는 모두 상대 경로(.ts)나 node: 내장만 — 패키지 이름(@hav/shared 등)이 하나라도 있으면 ERR_MODULE_NOT_FOUND (0312 뒤 실제로 실패함)
//   실제 네트워크 요청은 하지 않음 — 파일 글만 읽어 따라감
import { existsSync, readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const ENTRY = resolve(ROOT, "apps/web/scripts/indexnow.ts");

/** 파일 안의 가져오기 · 다시 내보내기 주소 (import … from "x" · export … from "x" · import "x" · import("x")) */
function specifiers(src: string): string[] {
  const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
  const out: string[] = [];
  for (const m of code.matchAll(/\b(?:import|export)\b[^"'`;]*?\bfrom\s*["']([^"']+)["']/g)) out.push(m[1] as string);
  for (const m of code.matchAll(/\bimport\s*["']([^"']+)["']/g)) out.push(m[1] as string);
  for (const m of code.matchAll(/\bimport\s*\(\s*["']([^"']+)["']\s*\)/g)) out.push(m[1] as string);
  return out;
}

/** 시작 파일에서 상대 경로로 이어지는 모든 파일과, 상대 경로가 아닌(패키지 · 별칭) 주소 */
function walk(entry: string) {
  const seen = new Set<string>();
  const bare: { file: string; spec: string }[] = [];
  const missing: { file: string; spec: string }[] = [];
  const queue = [entry];
  while (queue.length) {
    const file = queue.pop() as string;
    if (seen.has(file)) continue;
    seen.add(file);
    for (const spec of specifiers(readFileSync(file, "utf8"))) {
      if (spec.startsWith("node:")) continue;
      if (!spec.startsWith("./") && !spec.startsWith("../")) {
        bare.push({ file: relative(ROOT, file), spec });
        continue;
      }
      const target = resolve(dirname(file), spec);
      if (existsSync(target)) queue.push(target);
      else missing.push({ file: relative(ROOT, file), spec });
    }
  }
  return { files: [...seen].map((f) => relative(ROOT, f)).sort(), bare, missing };
}

describe("IndexNow 스크립트 가져오기 (작업 0318)", () => {
  const { files, bare, missing } = walk(ENTRY);

  it("요구 1: 이어지는 가져오기에 패키지 이름이 없음 — @hav/* · 이름만 · node: 내장 말고는 모두 상대 경로", () => {
    expect(bare, "패키지 이름으로 가져오는 줄(npm ci 없이는 못 찾음)").toEqual([]);
  });

  it("요구 1: 상대 경로는 확장자(.ts)까지 적어 실제 파일을 가리킴 — node 는 확장자를 채워 주지 않음", () => {
    expect(missing, "가리키는 파일이 없는 상대 경로").toEqual([]);
    for (const f of files) expect(f.endsWith(".ts"), f).toBe(true);
  });

  it("요구 1: 따라간 파일이 시작 파일 · 보내기 도우미를 포함하고 사이트 주소 파일까지 이어짐 — 따라가기가 비어 통과하지 않음", () => {
    expect(files).toContain("apps/web/scripts/indexnow.ts");
    expect(files).toContain("apps/web/scripts/indexnow-lib.ts");
    expect(files.some((f) => /(^|\/)site\.ts$/.test(f))).toBe(true);
  });

  it("요구 1: 가져오기 찾는 함수가 패키지 줄을 실제로 잡아냄 (검사 자체 확인)", () => {
    expect(specifiers(`import { A } from "@hav/shared/site";\nexport { B } from "pkg";\nimport "side";\nconst c = await import("dyn");\n// import x from "commented"`)).toEqual(["@hav/shared/site", "pkg", "side", "dyn"]);
    expect(specifiers(`import { X } from "./a.ts";\nimport { Y } from "node:fs";`)).toEqual(["./a.ts", "node:fs"]);
  });

  it("요구 2: 보내는 사이트 주소는 그대로 https://flapfx.com", async () => {
    const { SITE_URL } = await import("../../../packages/shared/src/site/site.ts");
    expect(SITE_URL).toBe("https://flapfx.com");
  });
});
