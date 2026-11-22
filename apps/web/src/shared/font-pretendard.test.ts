// 작업 0176 — 큰 제목 · 큰 숫자 글꼴 Pretendard 800 (소스 검사) (테스트 먼저 · 구현 전에는 FAIL 이 정상)
// 사용자 "귀엽긴 한데 너무 뚱뚱해서 보기 힘들다 … A안 Pretendard 800" — --font-display 를 Gasoek One → Pretendard 굵기 800 · 자간 -0.03em · 자체 호스팅(외부 글꼴 요청 없음) · 본문 IBM Plex · 색 · 배치 · 숫자 강조는 그대로
//
// builder 가 할 것 (prd R1~R6 · sdd)
//   글꼴 파일: pretendard 패키지(node_modules/pretendard/dist/web/static/woff2-dynamic-subset)의 Pretendard-ExtraBold.subset.{0..91}.woff2 92개를 apps/web/public/fonts/pretendard/ 에 같은 이름으로 복사 (패키지와 같은 내용 · 합계 약 1.3MB)
//   @font-face: 패키지의 Pretendard-ExtraBold.css 를 경로만 바꿔 사이트 CSS 로 — 92개 블록 · font-family Pretendard · font-weight 800 · font-display swap · src url(/fonts/pretendard/…woff2) format('woff2') · unicode-range 는 패키지 값 그대로 (브라우저가 글자에 맞는 조각만 받음)
//     CSS 위치는 자유(예 apps/web/src/app/fonts.css · globals.css 가 @import 하거나 layout.tsx 가 import) — 단 실제로 불러와져야 함
//   tokens.css: --font-display 가 Pretendard 로 시작(대체: IBM Plex Sans KR · 시스템 고딕) · Gasoek One 없음
//   큰 제목 · 큰 숫자 부품(Title · BigNumber)과 font-display 를 직접 쓰는 곳(today-band · currency-detail · calc-result …): 굵기 800(font-extrabold) · 자간 -0.03em(tracking-[-0.03em] 또는 --tracking-display 토큰) · font-normal · tracking-tight 는 없어짐 · 숫자는 tabular-nums 유지
//   Gasoek One: 쓰면 로고(nav-bar 의 / 링크)에만 · 안 쓰면 layout.tsx 에서 제거 — 쓰지 않는 글꼴을 불러오지 않음
//   외부 글꼴 주소(fonts.googleapis · gstatic · jsdelivr · unpkg 등)가 소스 · CSS 에 없음 (next/font 의 빌드 때 받기는 허용 — 런타임 외부 요청 아님)
//   0173 의 font-display 허용 목록 · 0168 의 Gasoek 필수 검사는 새 규칙으로 고침 (font-readability.test.ts · redesign-foundation.test.ts · tokens.test.ts)
//   docs/design.md: 글꼴 결정 Pretendard 800 (Gasoek 은 예전 결정 줄에만)
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const WEB_SRC = resolve(__dirname, ".."); // apps/web/src
const WEB = resolve(WEB_SRC, "..");
const ROOT = resolve(WEB, "../..");
const UI_SRC = join(ROOT, "packages/ui/src");
const PUBLIC_FONTS = join(WEB, "public/fonts/pretendard");
const PKG = [join(ROOT, "node_modules/pretendard/dist/web/static"), join(WEB, "node_modules/pretendard/dist/web/static")].find((d) => existsSync(d)) ?? "";
const PKG_WOFF2 = join(PKG, "woff2-dynamic-subset");

const stripCss = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "");
const stripTs = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const read = (p: string) => readFileSync(p, "utf8");
const sha = (p: string) => createHash("sha256").update(readFileSync(p)).digest("hex");
function walk(dir: string, re: RegExp): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = join(dir, d.name);
    if (d.isDirectory()) return d.name === "node_modules" || d.name === ".next" ? [] : walk(p, re);
    return re.test(d.name) && !/\.test\.tsx?$/.test(d.name) ? [p] : [];
  });
}
const rel = (f: string) => f.replace(`${ROOT}/`, "");
const SUBSETS = Array.from({ length: 92 }, (_, i) => i);

describe("글꼴 파일 — 굵기 800 동적 서브셋 92개 (패키지와 같은 내용)", () => {
  it("pretendard 패키지가 있고 굵기 800 서브셋이 92개", () => {
    expect(PKG, "pretendard 패키지").not.toBe("");
    expect(SUBSETS.every((n) => existsSync(join(PKG_WOFF2, `Pretendard-ExtraBold.subset.${n}.woff2`)))).toBe(true);
  });

  it("apps/web/public/fonts/pretendard/ 에 92개가 모두 있음", () => {
    for (const n of SUBSETS) expect(existsSync(join(PUBLIC_FONTS, `Pretendard-ExtraBold.subset.${n}.woff2`)), `subset.${n}`).toBe(true);
  });

  it("내용이 패키지 파일과 같음 (sha256 · 패키지 버전이 바뀌면 다시 복사해야 함)", () => {
    expect(SUBSETS.filter((n) => existsSync(join(PUBLIC_FONTS, `Pretendard-ExtraBold.subset.${n}.woff2`))).length, "복사된 조각").toBe(92);
    for (const n of SUBSETS) {
      const [site, pkg] = [join(PUBLIC_FONTS, `Pretendard-ExtraBold.subset.${n}.woff2`), join(PKG_WOFF2, `Pretendard-ExtraBold.subset.${n}.woff2`)];
      if (existsSync(site)) expect(sha(site), `subset.${n}`).toBe(sha(pkg));
    }
  });

  it("굵기 800 조각만 — 다른 굵기 · 폭 없는 큰 파일을 싣지 않음 · 합계 1.5MB 이하", () => {
    const files = existsSync(PUBLIC_FONTS) ? readdirSync(PUBLIC_FONTS) : [];
    const extra = files.filter((f) => !/^Pretendard-ExtraBold\.subset\.\d+\.woff2$/.test(f) && !/\.css$/.test(f) && !/(LICENSE|OFL)/i.test(f));
    expect(extra).toEqual([]);
    const total = files.filter((f) => f.endsWith(".woff2")).reduce((n, f) => n + statSync(join(PUBLIC_FONTS, f)).size, 0);
    expect(total).toBeGreaterThan(1_000_000);
    expect(total).toBeLessThanOrEqual(1_500_000);
  });
});

describe("@font-face — unicode-range 로 필요한 조각만", () => {
  const cssFiles = [...walk(WEB_SRC, /\.css$/), ...walk(join(WEB, "public/fonts"), /\.css$/)];
  const css = cssFiles.map((f) => stripCss(read(f))).join("\n");
  const blocks = [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map((m) => m[1]).filter((b) => /font-family:\s*['"]?Pretendard['"]?/i.test(b));
  /** 패키지 CSS 의 조각 번호 → unicode-range */
  const pkgRange = new Map<number, string>();
  if (PKG) for (const m of stripCss(read(join(PKG, "Pretendard-ExtraBold.css"))).matchAll(/@font-face\s*\{([^}]*)\}/g)) {
    const n = /subset\.(\d+)\.woff2/.exec(m[1])?.[1];
    const r = /unicode-range:\s*([^;]+);/.exec(m[1])?.[1];
    if (n && r) pkgRange.set(Number(n), r.replace(/\s+/g, " ").trim());
  }

  it("Pretendard 800 @font-face 가 92개 (조각마다 하나)", () => {
    expect(blocks.length).toBe(92);
  });

  it("조각마다 굵기 800 · font-display swap · woff2 · src 가 /fonts/pretendard/ 의 파일 · 그 파일이 실제로 있음", () => {
    expect(blocks.length, "Pretendard @font-face").toBeGreaterThan(0);
    for (const b of blocks) {
      expect(b, "font-weight").toMatch(/font-weight:\s*800\b/);
      expect(b, "font-display").toMatch(/font-display:\s*swap/);
      const url = /url\(\s*['"]?(\/fonts\/pretendard\/Pretendard-ExtraBold\.subset\.(\d+)\.woff2)['"]?\s*\)\s*format\(\s*['"]woff2['"]\s*\)/.exec(b);
      expect(url, `src(${b.slice(0, 80)})`).not.toBeNull();
      if (url) expect(existsSync(join(WEB, "public", url[1])), url[1]).toBe(true);
    }
  });

  it("unicode-range 가 패키지 값 그대로 (조각마다 · 글자에 맞는 조각만 받게)", () => {
    expect(blocks.length, "Pretendard @font-face").toBeGreaterThan(0);
    for (const b of blocks) {
      const n = Number(/subset\.(\d+)\.woff2/.exec(b)?.[1]);
      const r = /unicode-range:\s*([^;]+);/.exec(b)?.[1]?.replace(/\s+/g, " ").trim();
      expect(r, `subset.${n} unicode-range`).toBeDefined();
      expect(r).toBe(pkgRange.get(n));
    }
  });

  it("@font-face 를 담은 CSS 가 실제로 불러와짐 — globals.css 의 @import 또는 layout.tsx 의 import · link", () => {
    const holders = cssFiles.filter((f) => /@font-face/.test(stripCss(read(f))) && /Pretendard/.test(read(f)));
    expect(holders.length).toBeGreaterThan(0);
    const loaders = stripTs(read(join(WEB_SRC, "app/layout.tsx"))) + stripCss(read(join(WEB_SRC, "app/globals.css")));
    expect(holders.some((f) => loaders.includes(f.split("/").pop() as string)), "CSS 를 부르는 곳").toBe(true);
  });
});

describe("토큰 — --font-display 는 Pretendard", () => {
  const css = stripCss(read(join(UI_SRC, "tokens.css")));
  const display = /--font-display\s*:\s*([^;]+);/.exec(css)?.[1] ?? "";

  it("Pretendard 로 시작 · 대체 글꼴 IBM Plex Sans KR · Gasoek One 없음", () => {
    expect(display).toMatch(/^\s*["']?Pretendard["']?\s*,/);
    expect(display).toContain("IBM Plex Sans KR");
    expect(display).not.toMatch(/Gasoek/i);
  });

  it("본문(--font-sans)은 그대로 IBM Plex Sans KR", () => {
    expect(/--font-sans\s*:\s*([^;]+);/.exec(css)?.[1] ?? "").toContain("IBM Plex Sans KR");
  });
});

describe("큰 제목 · 큰 숫자 — 굵기 800 · 자간 -0.03em · 숫자는 tabular-nums", () => {
  const tokens = stripCss(read(join(UI_SRC, "tokens.css")));
  /** font-display 가 들어간 className 문자열 (첫 따옴표 · 백틱 · ${ 전까지) */
  const classes = (f: string) => [...stripTs(read(f)).matchAll(/className=\{?[`"']([^`"'$]*font-display[^`"'$]*)/g)].map((m) => m[1]);
  const FILES = [join(UI_SRC, "components/text/heading.tsx"), join(UI_SRC, "components/text/big-number.tsx"), join(UI_SRC, "components/layout/nav-bar.tsx"), join(UI_SRC, "components/data/flap-board.tsx"), join(WEB_SRC, "features/currencies/detail/currency-detail.tsx"), join(WEB_SRC, "features/import-calc/calculator/calc-result.tsx")];

  it("font-display 를 쓰는 모든 곳이 font-extrabold(800) · 자간 -0.03em · font-normal 아님 · tracking-tight 아님", () => {
    const all = FILES.flatMap((f) => classes(f).map((c) => [rel(f), c] as const));
    expect(all.length, "font-display 사용처").toBeGreaterThanOrEqual(5);
    for (const [f, c] of all) {
      expect(c, `${f} 굵기`).toMatch(/\bfont-extrabold\b|\bfont-\[800\]/);
      // 로고 flapfx(nav-bar)만 -0.05em (작업 0216 · 시안 B 로고) · 나머지는 -0.03em
      expect(c, `${f} 자간`).toMatch(f.endsWith("layout/nav-bar.tsx") ? /tracking-\[-0\.05em\]/ : /tracking-\[-0\.03em\]|\btracking-display\b/);
      expect(c, `${f} font-normal`).not.toMatch(/\bfont-normal\b/);
      expect(c, `${f} 옛 자간`).not.toMatch(/\btracking-(tight|tighter)\b/);
    }
  });

  it("자간 토큰(tracking-display)을 쓴다면 tokens.css 가 -0.03em 으로 정의", () => {
    const usesToken = FILES.some((f) => classes(f).some((c) => /\btracking-display\b/.test(c)));
    if (usesToken) expect(tokens).toMatch(/--tracking-display\s*:\s*-0\.03em/);
  });

  it("숫자를 그리는 곳은 tabular-nums 유지 — big-number · flap-board(작업 0177) · currency-detail · calc-result", () => {
    for (const f of [FILES[1], FILES[3], FILES[4], FILES[5]]) expect(classes(f).some((c) => /\btabular-nums\b/.test(c)), rel(f)).toBe(true);
  });

  it("제목 속 숫자 강조는 그대로 — Emph(노란 띠 · 주홍)가 글꼴 클래스를 덮어쓰지 않음", () => {
    const emph = stripTs(read(join(UI_SRC, "components/text/emph.tsx")));
    expect(emph).not.toMatch(/font-(display|normal|bold|extrabold|sans)/);
  });
});

describe("Gasoek One — 로고 밖에서는 안 쓰임", () => {
  const SRC = [...walk(WEB_SRC, /\.(tsx?|css)$/), ...walk(UI_SRC, /\.(tsx?|css)$/)];
  const code = (f: string) => (f.endsWith(".css") ? stripCss(read(f)) : stripTs(read(f)));
  const users = SRC.filter((f) => /gasoek/i.test(code(f))).map(rel);
  const ALLOWED = ["apps/web/src/app/layout.tsx", "packages/ui/src/tokens.css", "packages/ui/src/components/layout/nav-bar.tsx"];

  it("Gasoek 를 말하는 파일은 layout · tokens · nav-bar(로고)뿐", () => {
    expect(users.filter((f) => !ALLOWED.includes(f))).toEqual([]);
  });

  it("nav-bar 에서는 로고 링크(href=\"/\") 안에서만", () => {
    const nav = code(join(UI_SRC, "components/layout/nav-bar.tsx")).replace(/<a\b[^>]*href="\/"[^>]*>/g, "");
    expect(nav).not.toMatch(/gasoek|font-logo/i);
  });

  it("쓰지 않는 글꼴을 불러오지 않음 — layout 이 Gasoek_One 을 불러오면 로고가 써야 하고, 로고가 안 쓰면 layout 에서도 없음", () => {
    const layout = code(join(WEB_SRC, "app/layout.tsx"));
    const logoUses = /gasoek|font-logo/i.test(code(join(UI_SRC, "components/layout/nav-bar.tsx")));
    expect(/Gasoek_One/.test(layout)).toBe(logoUses);
  });

  it("Gasoek 를 불러오더라도 큰 제목 · 큰 숫자 토큰(--font-display)에는 없음", () => {
    expect(/--font-display\s*:[^;]*Gasoek/i.test(stripCss(read(join(UI_SRC, "tokens.css"))))).toBe(false);
  });
});

describe("외부 글꼴 요청 없음 — 자체 호스팅", () => {
  const files = [...walk(WEB_SRC, /\.(tsx?|css)$/), ...walk(UI_SRC, /\.(tsx?|css)$/), ...walk(join(WEB, "public/fonts"), /\.css$/)];
  const HOST = /(fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com|unpkg\.com|use\.typekit\.net|fonts\.bunny\.net)/;

  it("소스 · CSS 에 외부 글꼴 주소 · 외부 @import 가 없음", () => {
    const bad = files.filter((f) => HOST.test(f.endsWith(".css") ? stripCss(read(f)) : stripTs(read(f))) || /@import\s+(url\()?\s*['"]?https?:/.test(read(f))).map(rel);
    expect(bad).toEqual([]);
  });

  it("layout 에 글꼴 <link> 가 없음", () => {
    expect(stripTs(read(join(WEB_SRC, "app/layout.tsx")))).not.toMatch(/<link\b[^>]*font/i);
  });
});

describe("문서 — docs/design.md 글꼴 결정", () => {
  const doc = read(join(ROOT, "docs/design.md"));

  it("큰 제목 · 큰 숫자는 Pretendard 800 이라고 적혀 있음", () => {
    expect(doc).toMatch(/Pretendard[^|\n]*800|800[^|\n]*Pretendard/);
  });

  it("Gasoek One 은 현재 결정이 아님 — 예전 결정 · 로고 줄에만", () => {
    for (const l of doc.split("\n").filter((x) => /Gasoek/.test(x))) expect(l, l).toMatch(/바뀐 결정|예전|없앴|없앰|로고|제거/);
  });
});
