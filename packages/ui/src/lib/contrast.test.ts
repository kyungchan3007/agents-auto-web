// 작업 0168 — 새 테마 "하늘 종이 · 바다 띠 · 밤 포스터" 대비 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
// 바뀐 점: 새 값을 검사하고, 밤 포스터(@media (prefers-color-scheme: dark))를 따로 잼
//   - tokens.css 에서 밤 포스터 @media 블록을 먼저 떼어 낸 뒤 readSurfaces 로 기본 값을 읽음 (블록 안의 [data-surface="light"] 가 기본 값을 덮어쓰지 않게)
//     → builder 는 contrast.ts 를 안 고쳐도 됨 · 고쳐도 되지만 이 테스트의 helper(밤 블록 떼기)는 이 파일에 있음
//   - 밤 포스터 블록은 `@media (prefers-color-scheme: dark) { [data-surface="light"] { --hav-…: #hex; … } }` 모양 (light 바탕을 짙은 울트라마린으로 · dark/elevated 는 필요하면 같은 블록에서 한 단계 밝게/짙게)
//
// 토큰 이름은 그대로 · 값만 새 테마 (sdd.md 1) — 정해진 값(R1 · R2)은 고정, 나머지 보조 값은 대비로만 판정
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { contrastRatio, luminance, readSurfaces } from "./contrast";

const CSS = readFileSync(new URL("../tokens.css", import.meta.url), "utf8");

/** `@media (prefers-color-scheme: dark) { … }` 블록 안쪽 글 (중괄호 짝 맞춰 읽음) · 없으면 "" */
function nightBlock(css: string): { inner: string; rest: string } {
  const m = /@media\s*\(\s*prefers-color-scheme:\s*dark\s*\)\s*\{/.exec(css);
  if (!m) return { inner: "", rest: css };
  let depth = 1;
  let i = m.index + m[0].length;
  for (; i < css.length && depth > 0; i++) depth += css[i] === "{" ? 1 : css[i] === "}" ? -1 : 0;
  return { inner: css.slice(m.index + m[0].length, i - 1), rest: css.slice(0, m.index) + css.slice(i) };
}

const { inner: NIGHT_CSS, rest: BASE_CSS } = nightBlock(CSS);
const base = readSurfaces(BASE_CSS);
const nightOverrides = readSurfaces(NIGHT_CSS);
/** 밤 포스터일 때 각 배경의 값 = 기본 값 위에 밤 블록 값을 덮은 것 */
const night: Record<string, Record<string, string>> = Object.fromEntries(Object.entries(base).map(([k, v]) => [k, { ...v, ...(nightOverrides[k] ?? {}) }]));

const lc = (v: string) => v.toLowerCase();
function hue(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  const h = d === 0 ? 0 : max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}

// 본문으로 쓰는 색은 4.5 (WCAG AA) — 큰 글자 3 기준이던 오로라 그라데이션은 새 테마에서 쓰지 않음 (3D 전용으로만 남김)
const BODY = ["fg", "fg-2", "accent", "cheap", "normal", "expensive"];

describe("contrastRatio", () => {
  it("검정 · 흰색은 21, 같은 색은 1", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
    expect(contrastRatio("#4ff0e0", "#4ff0e0")).toBe(1);
  });
  it("#rrggbb 가 아니면 오류", () => {
    expect(() => contrastRatio("red", "#000000")).toThrow();
  });
});

describe("tokens.css — 세 배경 (하늘 종이 light · 바다 띠 dark · elevated)", () => {
  it("밤 포스터 블록을 뗀 기본 값에 dark · elevated · light 세 배경이 모두 있다", () => {
    expect(Object.keys(base).sort()).toEqual(["dark", "elevated", "light"]);
  });

  it("R1 · R2 정해진 값 — 하늘 종이 바탕 #EAF4F2 · 글자 #16246E · 보조 #4A5A8C · 쌈 = 울트라마린 #2438A8", () => {
    expect(lc(base.light.surface)).toBe("#eaf4f2");
    expect(lc(base.light.fg)).toBe("#16246e");
    expect(lc(base.light["fg-2"])).toBe("#4a5a8c");
    expect(lc(base.light.cheap)).toBe("#2438a8");
  });

  it("바다 띠(dark) 바탕 = 울트라마린 #2438A8 · 글자 종이색/흰색 · 포인트(accent) = 해 노랑 #F7C548", () => {
    expect(lc(base.dark.surface)).toBe("#2438a8");
    expect(luminance(base.dark.fg)).toBeGreaterThanOrEqual(0.8);
    expect(lc(base.dark.accent)).toBe("#f7c548");
  });

  it("elevated(바다 띠 안의 칸) 바탕은 바다 띠보다 한 단계 짙음", () => {
    expect(luminance(base.elevated.surface)).toBeLessThan(luminance(base.dark.surface));
  });

  it("R2 판정 색은 파랑(쌈) · 빨강 계열(비쌈) 둘뿐 — 색상 각도로 확인 (모든 배경)", () => {
    for (const [name, v] of Object.entries(base)) {
      expect(hue(v.cheap), `${name} cheap`).toBeGreaterThanOrEqual(190);
      expect(hue(v.cheap), `${name} cheap`).toBeLessThanOrEqual(250);
      const e = hue(v.expensive);
      expect(e <= 25 || e >= 350, `${name} expensive 각도 ${e}`).toBe(true);
    }
  });

  it("light 의 포인트(accent)는 바다 청록 계열 (글자로도 쓰므로 대비 맞춘 진한 값)", () => {
    expect(hue(base.light.accent)).toBeGreaterThanOrEqual(160);
    expect(hue(base.light.accent)).toBeLessThanOrEqual(190);
  });

  for (const [name, v] of Object.entries(base)) {
    for (const bg of ["surface", "surface-2"]) {
      for (const fg of BODY) {
        it(`${name}: ${fg} on ${bg} ≥ 4.5`, () => {
          expect(contrastRatio(v[fg], v[bg])).toBeGreaterThanOrEqual(4.5);
        });
      }
    }
    it(`${name}: on-accent on accent ≥ 4.5 (버튼 글자)`, () => {
      expect(contrastRatio(v["on-accent"], v.accent)).toBeGreaterThanOrEqual(4.5);
    });
  }
});

describe("판정 핀 글자 대비 (흰 글 on 쌈 · 비쌈 바탕 · 남색 글 on 흰 바탕 · 하늘 종이 위)", () => {
  it("하늘 종이(light) 위 핀: 흰 글 on cheap · expensive ≥ 4.5 (핀 글은 13px SemiBold 라 본문 기준 · 핀은 하늘 종이 위 도착지 줄에 놓임)", () => {
    // Figma 의 비쌈 주홍 #D9452B 는 흰 글 4.34 · 하늘 종이 위 글자 3.87 로 4.5 에 못 미침 → builder 는 조금 더 진한 주홍(예: #C13A22 = 5.39 / 4.81)을 써야 함 (lead 판단 필요 — 보고에 적음)
    for (const fill of ["cheap", "expensive"]) expect(contrastRatio("#ffffff", base.light[fill]), fill).toBeGreaterThanOrEqual(4.5);
  });

  it("보통 핀: 흰 바탕 위 남색(fg) 글 ≥ 4.5 · 보조색(fg-2) 2px 테두리 ≥ 3 (하늘 종이 기준)", () => {
    expect(contrastRatio(base.light.fg, "#ffffff")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(base.light["fg-2"], "#ffffff")).toBeGreaterThanOrEqual(3);
  });
});

describe("밤 포스터 — @media (prefers-color-scheme: dark)", () => {
  it("밤 블록이 있고 light 바탕을 덮어씀", () => {
    expect(NIGHT_CSS.length).toBeGreaterThan(0);
    expect(Object.keys(nightOverrides)).toContain("light");
  });

  it("바탕은 짙은 울트라마린(#121C5C 근처) — 파랑 계열 · 매우 어두움 · 글자는 종이색", () => {
    const v = night.light;
    expect(luminance(v.surface)).toBeLessThanOrEqual(0.03);
    expect(hue(v.surface)).toBeGreaterThanOrEqual(215);
    expect(hue(v.surface)).toBeLessThanOrEqual(250);
    expect(luminance(v.fg)).toBeGreaterThanOrEqual(0.8);
    expect(lc(v.surface)).not.toBe(lc(base.light.surface));
  });

  it("바다 띠(dark)는 밤에도 밤 바탕과 구분됨 (명암 대비 1.2 이상 — 한 단계 밝거나 짙게)", () => {
    expect(contrastRatio(night.dark.surface, night.light.surface)).toBeGreaterThanOrEqual(1.2);
  });

  for (const name of ["light", "dark", "elevated"]) {
    for (const bg of ["surface", "surface-2"]) {
      for (const fg of BODY) {
        it(`밤 ${name}: ${fg} on ${bg} ≥ 4.5`, () => {
          expect(contrastRatio(night[name][fg], night[name][bg])).toBeGreaterThanOrEqual(4.5);
        });
      }
    }
    it(`밤 ${name}: on-accent on accent ≥ 4.5`, () => {
      expect(contrastRatio(night[name]["on-accent"], night[name].accent)).toBeGreaterThanOrEqual(4.5);
    });
  }

  it("밤에도 판정 색은 파랑(쌈) · 빨강 계열(비쌈)", () => {
    for (const [name, v] of Object.entries(night)) {
      expect(hue(v.cheap), `밤 ${name} cheap`).toBeGreaterThanOrEqual(190);
      expect(hue(v.cheap), `밤 ${name} cheap`).toBeLessThanOrEqual(250);
      const e = hue(v.expensive);
      expect(e <= 30 || e >= 345, `밤 ${name} expensive 각도 ${e}`).toBe(true);
    }
  });
});

// 큰 숫자 전용 색 --hav-figure (text-figure · 작업 0169) — 하늘 종이 위 울트라마린 · 바다 띠 · 칸 위 해 노랑 · 밤 포스터 해 노랑
// 큰 숫자(Gasoek One · 26px 이상)라 큰 글자 기준 3 이상 (builder 계산은 본문 4.5 도 넘음: 종이 8.49 · 띠 5.91 · 밤 9.68)
describe("큰 숫자 색 --hav-figure", () => {
  it("값 — 하늘 종이 #2438A8 · 바다 띠 · elevated #F7C548 · 밤 포스터 light 도 #F7C548", () => {
    expect(lc(base.light.figure)).toBe("#2438a8");
    expect(lc(base.dark.figure)).toBe("#f7c548");
    expect(lc(base.elevated.figure)).toBe("#f7c548");
    expect(lc(night.light.figure)).toBe("#f7c548");
  });

  for (const [mode, surfaces] of [["", base], ["밤 ", night]] as const) {
    for (const [name, v] of Object.entries(surfaces)) {
      for (const bg of ["surface", "surface-2"]) {
        it(`${mode}${name}: figure on ${bg} ≥ 3 (큰 글자)`, () => {
          expect(contrastRatio(v.figure, v[bg])).toBeGreaterThanOrEqual(3);
        });
      }
    }
  }
});
