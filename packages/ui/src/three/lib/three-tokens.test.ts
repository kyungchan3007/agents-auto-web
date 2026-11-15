// 작업 0168 — 3D 지구 · 비행기는 생김새 그대로 (R7) · 고양이 · 동전 파일 삭제 (R8) (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//
// builder 가 할 것
//   three/objects/globe.tsx: tokenColor("--hav-accent", …) → tokenColor("--hav-3d-arc", "#4ff0e0") — 지구 호 색이 새 테마(accent 가 바뀜)와 상관없이 그대로
//   three/scene/stage.tsx toneColor: --hav-cheap · --hav-normal · --hav-expensive → --hav-3d-cheap · --hav-3d-normal · --hav-3d-expensive (지구 점 색 · 지금 값 고정 · tokens.test.ts 에 값)
//     (이것은 sdd 에 없고 test 가 R7 을 지키려고 더함 — 새 테마에서 cheap 이 울트라마린 · expensive 가 주홍이라 지구 점 색이 바뀌게 되므로)
//   globe.tsx · plane.tsx · stage.tsx 는 사이트 테마 색 토큰(--hav-accent · --hav-aurora-* · --hav-cheap · --hav-normal · --hav-expensive · --hav-surface · --hav-fg)을 읽지 않음 — 읽는 토큰은 --hav-3d-* 뿐
//   삭제: three/characters/ 폴더 · three/objects/coin.tsx · three/scene/lazy.tsx 의 고양이 · 동전 항목 (죽은 코드를 남기지 않음)
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const THREE = fileURLToPath(new URL("..", import.meta.url)); // packages/ui/src/three/
const read = (p: string) => readFileSync(join(THREE, p), "utf8");
const SITE_THEME = /--hav-(accent|aurora-\d|cheap|normal|expensive|surface|surface-2|fg|fg-2|line|on-accent)\b/;

describe("3D 비행기 · 장면은 3D 전용 토큰만 읽음 (작업 0177 수정: 지구는 없앰)", () => {
  it("plane.tsx · stage.tsx 는 사이트 테마 색 토큰을 읽지 않음 (--hav-3d-* 만)", () => {
    for (const f of ["objects/plane.tsx", "scene/stage.tsx"]) {
      const src = read(f);
      // 설명 글(주석)은 빼고 코드만 봄
      const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
      expect(code, f).not.toMatch(SITE_THEME);
    }
  });

  it("stage.tsx toneColor 는 --hav-3d-cheap · --hav-3d-normal · --hav-3d-expensive 를 읽음 (지금 값 고정)", () => {
    const src = read("scene/stage.tsx");
    for (const t of ["--hav-3d-cheap", "--hav-3d-normal", "--hav-3d-expensive"]) expect(src, t).toContain(t);
  });

  it("지금 값이 fallback 으로 그대로 — 쌈 #4c9bff · 보통 #c7c7cc · 비쌈 #ff5a5f", () => {
    const stage = read("scene/stage.tsx").toLowerCase();
    for (const c of ["#4c9bff", "#c7c7cc", "#ff5a5f"]) expect(stage, c).toContain(c);
  });
});

describe("고양이 · 동전 3D 파일을 지움 (R8)", () => {
  it("three/characters/ 폴더 · three/objects/coin.tsx 가 없음", () => {
    expect(existsSync(join(THREE, "characters"))).toBe(false);
    expect(existsSync(join(THREE, "objects/coin.tsx"))).toBe(false);
  });

  it("three/ 안의 어느 코드도 고양이 · 동전을 가리키지 않음 (lazy.tsx 항목 포함)", () => {
    const walk = (dir: string): string[] =>
      readdirSync(join(THREE, dir), { withFileTypes: true }).flatMap((d) => {
        const rel = join(dir, d.name);
        if (d.isDirectory()) return walk(rel);
        return /\.tsx?$/.test(d.name) && !/\.test\.tsx?$/.test(d.name) ? [rel] : [];
      });
    for (const f of walk(".")) {
      expect(read(f), f).not.toMatch(/cat-figure|money-cat|worker-cat|MoneyCat|WorkerCat|CatFigure|\bCoinLazy\b|objects\/coin|\bCoin\b/);
    }
  });
});
