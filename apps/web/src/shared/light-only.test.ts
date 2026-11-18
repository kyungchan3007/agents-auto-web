// 작업 0173 추가 요청 — 밝은 화면 하나만 (어두운 화면 모드 "밤 포스터" 삭제) (소스 검사) (테스트 먼저 · 구현 전에는 FAIL 이 정상)
// 사용자 "난 하나만 있으면 되는데 피그마 시안대로 하나만 있으면 돼 두개 다 필요 없어" · 기기가 다크 모드여도 항상 하늘 종이(#EAF4F2)
//
// builder 가 할 것 (prd L1~L3 · sdd '밝은 화면 하나만')
//   packages/ui/src/tokens.css: @media (prefers-color-scheme: dark) 블록 삭제 · :root 에 color-scheme: light (tokens.test.ts · contrast.test.ts 가 검사)
//   apps/web/src/app/globals.css: html { color-scheme: light } (light dark 아님) · 주석도 밤 포스터 설명 없앰
//   apps/web/src/app/layout.tsx: viewport.themeColor 를 하늘 종이 한 값("#EAF4F2")으로 — media 배열 없음
//   3D(packages/ui/src/three): 기기 다크 모드에 반응하는 코드 없음 (data-surface 로 시안의 어두운 띠 위인지 고르는 분기는 남김)
//   docs/design.md: 밤 포스터 결정 → "바뀐 결정" 한 줄(밝은 화면 하나) · 현재 결정 표에서 빼기
//   e2e: apps/web/e2e/light-only.spec.ts (colorScheme dark 로 열어도 바탕 하늘 종이 — 실행은 lead)
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const WEB_SRC = resolve(__dirname, ".."); // apps/web/src
const UI_SRC = resolve(WEB_SRC, "../../../packages/ui/src");
const ROOT = resolve(WEB_SRC, "../../..");
const rel = (f: string) => f.replace(`${ROOT}/`, "");
const stripComments = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
function files(dir: string, re: RegExp): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = join(dir, d.name);
    if (d.isDirectory()) return d.name === "node_modules" || d.name === ".next" ? [] : files(p, re);
    return re.test(d.name) && !/\.test\.tsx?$/.test(d.name) ? [p] : [];
  });
}
const CODE = [...files(WEB_SRC, /\.(tsx?|css)$/), ...files(UI_SRC, /\.(tsx?|css)$/)];

describe("기기 다크 모드에 반응하는 코드가 없음", () => {
  it("prefers-color-scheme · tailwind dark: 변형 · color-scheme: dark 가 어느 코드 · 스타일에도 없음 (주석 설명은 세지 않음)", () => {
    const bad = CODE.filter((f) => /prefers-color-scheme|\bdark:[a-z\[]|color-scheme\s*:[^;]*\bdark\b/.test(stripComments(readFileSync(f, "utf8")))).map(rel);
    expect(bad).toEqual([]);
  });

  it("3D(packages/ui/src/three)가 기기 설정을 읽지 않음 — matchMedia · prefers-color-scheme 없음 (data-surface 분기는 허용)", () => {
    const bad = files(join(UI_SRC, "three"), /\.tsx?$/).filter((f) => /matchMedia|prefers-color-scheme/.test(stripComments(readFileSync(f, "utf8")))).map(rel);
    expect(bad).toEqual([]);
  });
});

describe("항상 밝은 화면으로 알림", () => {
  it("globals.css 의 html 이 color-scheme: light (light dark 가 아님)", () => {
    const css = stripComments(readFileSync(join(WEB_SRC, "app/globals.css"), "utf8"));
    expect(css).toMatch(/color-scheme\s*:\s*light\s*;/);
    expect(css).not.toMatch(/color-scheme\s*:\s*light\s+dark/);
  });

  it("layout.tsx 의 주소창 색 themeColor 가 흰색 한 값(작업 0216 · 예전 하늘 종이) — media 배열 · 어두운 값 없음", () => {
    const layout = stripComments(readFileSync(join(WEB_SRC, "app/layout.tsx"), "utf8"));
    expect(layout).toMatch(/themeColor:\s*"#FFFFFF"/i);
    expect(layout).not.toMatch(/media:/);
    expect(layout).not.toMatch(/#121C5C/i);
  });
});

describe("문서 — docs/design.md 결정 변경 (밝은 화면 하나)", () => {
  const doc = readFileSync(join(ROOT, "docs/design.md"), "utf8");

  it("'밝은 화면 하나' 결정이 적혀 있음", () => {
    expect(doc).toContain("밝은 화면 하나");
  });

  it("prefers-color-scheme · 밤 포스터는 '바뀐 결정' 등 없어졌다는 맥락의 줄에만 남음", () => {
    const lines = doc.split("\n").filter((l) => /prefers-color-scheme|밤 포스터/.test(l));
    for (const l of lines) expect(l, l).toMatch(/바뀐 결정|없앴|없앰|삭제|제거|예전/);
  });
});
