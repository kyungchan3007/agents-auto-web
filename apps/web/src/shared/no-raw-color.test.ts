// 작업 0215 (#254) — 화면 코드에 색 숫자를 직접 쓰지 않음: 그림자 rgba(22,36,110,…) · 하늘 종이 #EAF4F2 · 흰색 · 인트로 창문 #F4F6F8 · 하늘 #AFD4E6 · #D3E9EE
//   값은 packages/ui/src/tokens.css 한 곳 — 화면은 토큰(shadow-board · var(--hav-surface) …)을 부름 · 못 읽는 곳(공유 이미지 · 매니페스트 · 주소창 색)만 예외 목록에 이유와 함께
import { readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../../../..");
const DIRS = [join(ROOT, "apps/web/src"), join(ROOT, "packages/ui/src")];

/** 파일째로 뺌 — 이유 필수 */
const EXCEPT: Record<string, string> = {
  "apps/web/src/app/opengraph-image.tsx": "공유 미리보기 이미지 생성기는 CSS 토큰을 못 읽음 (색을 값으로 적음)",
  "apps/web/src/app/manifest.ts": "웹 앱 매니페스트의 색은 값이어야 함 (CSS 토큰을 못 읽음)",
  "apps/web/src/app/layout.tsx": "휴대폰 주소창 색(viewport.themeColor)은 값이어야 함 (CSS 토큰을 못 읽음)",
  "packages/ui/src/tokens.css": "색 값을 정의하는 곳",
};

/** 화면 코드에 직접 쓰면 안 되는 색 — 같은 값의 토큰이 있음 */
export const RAW = /rgba?\(\s*22\s*,\s*36\s*,\s*110\b|rgba?\(\s*234\s*,\s*244\s*,\s*242\b|#eaf4f2\b|#ffffff\b|#fff\b|#f4f6f8\b|#afd4e6\b|#d3e9ee\b/i;

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = join(dir, d.name);
    if (d.isDirectory()) return d.name === "node_modules" ? [] : files(p);
    return /\.(tsx?|css)$/.test(d.name) && !/\.test\.tsx?$/.test(d.name) ? [p] : [];
  });
}
/** 주석은 뺌 (설명 글에 색 이름을 적을 수 있음) */
const code = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

describe("색 숫자는 토큰으로 (작업 0215)", () => {
  it("검사기 자체 — 직접 쓴 색은 잡고 토큰 · 주석은 통과", () => {
    expect(RAW.test("shadow-[0_10px_24px_rgba(22,36,110,0.25)]")).toBe(true);
    expect(RAW.test('style={{ background: "#EAF4F2" }}')).toBe(true);
    expect(RAW.test("rgba(234, 244, 242, .75)")).toBe(true);
    expect(RAW.test("shadow-board var(--hav-surface)")).toBe(false);
    expect(RAW.test(code("// 하늘 종이 #EAF4F2\nconst a = 1;"))).toBe(false);
  });
  it("화면 코드(apps/web/src · packages/ui/src)에 직접 쓴 그림자 · 위 색 숫자가 없음 (예외 제외)", () => {
    const bad = DIRS.flatMap(files)
      .map((f) => relative(ROOT, f))
      .filter((f) => !(f in EXCEPT))
      .flatMap((f) =>
        code(readFileSync(join(ROOT, f), "utf8"))
          .split("\n")
          .flatMap((line, i) => (RAW.test(line) ? [`${f}:${i + 1} ${line.trim().slice(0, 80)}`] : [])),
      );
    expect(bad).toEqual([]);
  });
  it("예외 파일은 모두 이유가 있고 실제로 있는 파일", () => {
    for (const [f, why] of Object.entries(EXCEPT)) {
      expect(why.length, f).toBeGreaterThan(5);
      expect(() => readFileSync(join(ROOT, f), "utf8"), f).not.toThrow();
    }
  });
});
