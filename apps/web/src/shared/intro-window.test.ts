// 작업 0223 — 인트로 끝 "그냥 사라지기" (소스 검사 · 테스트 먼저) — 예전 작업 0185 창문 전환(창문 → 창밖 사진 → 홈 사진 자리로 줄어듦)을 바꿈
// 끝: 막 뜬 비행기가 날아 나가는 동안 화면이 파랑 면(메뉴 띠와 같은 토큰)으로 → 로고가 홈 메뉴 로고의 실제 자리로 → 인트로 층이 사라지며 새 홈 · 움직임 줄이기는 끝 장면 없이 바로
// 3D 층은 파랑 면이 덮은 뒤에 멈춤 · 숨김 (마지막 프레임이 다시 보이지 않게) · 위쪽 띠 · 출처 줄은 끝이 시작되면 안 보임 · 창밖 사진을 더는 쓰지 않음
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const INTRO = resolve(__dirname, "../features/intro");
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const read = (p: string) => code(readFileSync(join(INTRO, p), "utf8"));

describe("끝 장면 순서 (use-intro)", () => {
  const hook = read("hooks/use-intro.ts");
  const end = hook.slice(hook.indexOf("const endFade"), hook.indexOf("const begin4")); // 끝 장면 함수만

  it("파랑 면(1) → 3D 멈춤 · 층 숨김 → 로고 이동(2) → 층이 사라짐(3) → 닫힘 순서", () => {
    const p1 = end.indexOf("setPhase(1)");
    const hide = end.lastIndexOf("scene.current.hidden = true");
    const off = end.indexOf("setStageOff(true)");
    const p2 = end.indexOf("setPhase(2)");
    const persist = end.lastIndexOf("persist()"); // 움직임 줄이기 갈래(앞)가 아니라 끝 장면 갈래(뒤)
    const p3 = end.indexOf("setPhase(3)");
    const closed = end.lastIndexOf("setClosed(true)");
    expect(p1).toBeGreaterThan(-1);
    expect(hide).toBeGreaterThan(p1);
    expect(off).toBeGreaterThan(hide);
    expect(p2).toBeGreaterThan(off);
    expect(persist).toBeGreaterThan(p2);
    expect(p3).toBeGreaterThan(persist);
    expect(closed).toBeGreaterThan(p3);
  });

  it("로고가 갈 자리는 홈 메뉴 로고의 실제 자리(getBoundingClientRect) — 값을 코드에 박지 않음", () => {
    expect(end).toMatch(/header a\[href=\\?"\/\\?"\]/);
    expect(hook).toMatch(/getBoundingClientRect\(/);
  });

  it("움직임 줄이기는 끝 장면 없이 바로 닫음", () => {
    expect(end).toMatch(/still/);
  });

  it("창문 · 창밖 사진 · 홈 사진 자리를 더는 쓰지 않음", () => {
    for (const f of ["hooks/use-intro.ts", "components/intro.tsx", "components/window-transition.tsx"]) {
      const s = read(f);
      expect(s, f).not.toMatch(/shadow-window|shadow-glass|windowTransition|zoomIn/);
    }
  });
});

describe("그리기 (intro.tsx · window-transition.tsx)", () => {
  const ui = read("components/intro.tsx");
  const wt = read("components/window-transition.tsx");

  it("3D 층은 숨김이 되면 visibility hidden", () => {
    expect(ui).toMatch(/visibility:\s*s\.stageOff\s*\?\s*"hidden"/);
  });

  it("끝이 시작되면(phase ≠ 0) 위쪽 띠 · 출처 줄이 안 보임", () => {
    expect(ui.match(/s\.phase === 0 \? "opacity-100" : "opacity-0"/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it("인트로 층이 끝에 사라짐 — 투명해짐(phase 3) · 덮개 바탕은 끝 동안 불투명하지 않음", () => {
    expect(ui).toMatch(/opacity:\s*s\.phase >= 3 \? 0 : 1/);
    expect(ui).toMatch(/s\.phase === 0 \? "bg-surface" : ""/);
  });

  it("파랑 면은 메뉴 띠와 같은 토큰(bg-pin-cheap) · 로고는 흰 flap + 노랑 fx · e2e 표시", () => {
    expect(wt).toMatch(/bg-pin-cheap/);
    expect(wt).toMatch(/text-foam/);
    expect(wt).toMatch(/text-sun/);
    expect(wt).toMatch(/data-testid="intro-end-tint"/);
    expect(wt).toMatch(/data-testid="intro-end-logo"/);
  });
});
