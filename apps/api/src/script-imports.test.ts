// 작업 0325 — 워크플로가 node 로 바로 돌리는 수집 스크립트가 시작함 (패치 · 테스트 먼저 · 구현 전에는 ga4-sync 가 FAIL 이 정상)
//   ga4-sync · ig-insights · gsc-sync 는 `node --experimental-strip-types apps/api/scripts/<이름>.ts` 로 돎 (.github/workflows) — vitest 가 아니라서 .ts 가져오기에 확장자가 없거나(`./kst`) 패키지 안의 .ts 를 따라가면 ERR_MODULE_NOT_FOUND
//   0318(IndexNow)에 이어 두 번째 — 0324 에서 report.ts 가 @hav/shared/date 를 가져와 단위(vitest)는 통과했지만 node 로는 못 시작했음
//   ① 글로 따라가기(apps/web/scripts/indexnow-imports.test.ts 와 같은 방식): 시작 파일에서 상대 경로로 이어지는 모든 파일에 패키지 이름 가져오기가 없고(node: 내장은 허용) 상대 경로는 .ts 실제 파일
//   ② 실제로 시작하기: 비밀값 없이 node 로 돌려 보면 스크립트 자신의 '없습니다' 오류에서 멈춤 — 모듈을 못 찾는 오류가 아님 (네트워크 요청 없음 · 비밀값 없음)
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
/** 스크립트 · 비밀값이 없을 때 스크립트가 직접 내는 오류 글 */
const SCRIPTS: { name: string; missingEnv: string }[] = [
  { name: "ga4-sync", missingEnv: "GSC_SERVICE_ACCOUNT_JSON" },
  { name: "ig-insights", missingEnv: "IG_ACCESS_TOKEN" },
  { name: "gsc-sync", missingEnv: "GSC_SERVICE_ACCOUNT_JSON" },
];

/** 파일 안의 가져오기 · 다시 내보내기 주소 (import … from "x" · export … from "x" · import "x" · import("x")) */
function specifiers(src: string): string[] {
  const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
  const out: string[] = [];
  for (const m of code.matchAll(/\b(?:import|export)\b[^"'`;]*?\bfrom\s*["']([^"']+)["']/g)) out.push(m[1] as string);
  for (const m of code.matchAll(/\bimport\s*["']([^"']+)["']/g)) out.push(m[1] as string);
  for (const m of code.matchAll(/\bimport\s*\(\s*["']([^"']+)["']\s*\)/g)) out.push(m[1] as string);
  return out;
}

/** 시작 파일에서 상대 경로로 이어지는 모든 파일 · 상대 경로가 아닌(패키지 · 별칭) 주소 · 가리키는 파일이 없는 상대 경로(확장자 빠짐 포함) */
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

describe("수집 스크립트 가져오기 — 글로 따라가기 (작업 0325)", () => {
  for (const { name } of SCRIPTS) {
    const entry = resolve(ROOT, `apps/api/scripts/${name}.ts`);
    const { files, bare, missing } = walk(entry);

    it(`${name}: 이어지는 가져오기에 패키지 이름이 없음 — @hav/* · 이름만 · node: 내장 말고는 모두 상대 경로`, () => {
      expect(bare, "패키지 이름으로 가져오는 줄(node 가 .ts 를 못 읽거나 확장자 없는 안쪽 가져오기에서 막힘)").toEqual([]);
    });

    it(`${name}: 상대 경로는 확장자(.ts)까지 적어 실제 파일을 가리킴 — node 는 확장자를 채워 주지 않음`, () => {
      expect(missing, "가리키는 파일이 없는 상대 경로").toEqual([]);
      for (const f of files) expect(f.endsWith(".ts"), f).toBe(true);
    });

    it(`${name}: 따라가기가 비지 않음 — 시작 파일과 src 안 파일까지 이어짐`, () => {
      expect(files).toContain(`apps/api/scripts/${name}.ts`);
      expect(files.some((f) => f.startsWith("apps/api/src/features/")), "src/features 안 파일").toBe(true);
    });
  }

  it("검사 함수 자체 확인 — 패키지 줄 · 확장자 빠진 줄을 잡아냄", () => {
    expect(specifiers(`import { A } from "@hav/shared/date";\nexport { B } from "pkg";\nimport "side";\nconst c = await import("dyn");\n// import x from "commented"`)).toEqual(["@hav/shared/date", "pkg", "side", "dyn"]);
    expect(specifiers(`import { X } from "./kst";\nimport { Y } from "node:crypto";`)).toEqual(["./kst", "node:crypto"]);
  });
});

describe("수집 스크립트 실제로 시작 — node 로 비밀값 없이 (작업 0325)", () => {
  for (const { name, missingEnv } of SCRIPTS) {
    it(`${name}: 모듈 오류 없이 시작해 비밀값이 없다는 스크립트 자신의 오류에서 멈춤`, () => {
      // 비밀값 · 토큰은 환경에서 비움 — PATH 만 남김 (네트워크 요청 · 비밀값 사용 없음)
      const r = spawnSync(process.execPath, ["--experimental-strip-types", resolve(ROOT, `apps/api/scripts/${name}.ts`)], { cwd: ROOT, env: { PATH: process.env.PATH ?? "" } as NodeJS.ProcessEnv, encoding: "utf8", timeout: 20_000 });
      const err = r.stderr ?? "";
      expect(err, "모듈을 못 찾는 오류").not.toMatch(/ERR_MODULE_NOT_FOUND|ERR_UNSUPPORTED|ERR_UNKNOWN_FILE_EXTENSION|Cannot find (module|package)/);
      expect(err, "문법 오류").not.toMatch(/SyntaxError/);
      expect(err, "스크립트가 비밀값 없음을 알림").toContain(missingEnv);
      expect(r.status, "실패로 끝남(비밀값이 없으니)").not.toBe(0);
    });
  }
});
