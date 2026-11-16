// 작업 0185 — 창문 전환 끝에서 3D 장면이 다시 보이던 버그 방지 (소스 검사)
// 창문이 화면을 덮은 뒤 3D 층을 숨기고, 전환이 시작되면 위쪽 띠 · 출처 줄을 숨기고, 사진이 줄어드는 동안 둘레에는 홈만 보이게(덮개 바탕이 불투명하지 않게)
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const INTRO = resolve(__dirname, "../features/intro");
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const read = (p: string) => code(readFileSync(join(INTRO, p), "utf8"));

describe("창문 전환 순서", () => {
  const hook = read("hooks/use-intro.ts");
  const ui = read("components/intro.tsx");

  it("창문(2단계)이 나온 뒤 → 3D 그리기 멈춤 + 3D 층 숨김 → 덧문(3단계) 순서", () => {
    const win = hook.slice(hook.indexOf("const windowTransition"));
    const p2 = win.indexOf("setPhase(2)");
    const hide = win.indexOf("scene.current.hidden = true");
    const off = win.indexOf("setStageOff(true)");
    const p3 = win.indexOf("setPhase(3)");
    expect(p2).toBeGreaterThan(-1);
    expect(hide).toBeGreaterThan(p2);
    expect(off).toBeGreaterThan(hide);
    expect(p3).toBeGreaterThan(off);
  });

  it("3D 층은 숨김이 되면 visibility hidden", () => {
    expect(ui).toMatch(/visibility:\s*s\.stageOff\s*\?\s*"hidden"/);
  });

  it("전환이 시작되면(phase ≠ 0) 위쪽 띠 · 출처 줄이 안 보임", () => {
    expect(ui.match(/s\.phase === 0 \? "opacity-100" : "opacity-0"/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it("덮개 바탕은 전환 중(phase ≠ 0)에 불투명하지 않음 — 사진이 줄어드는 동안 둘레에 홈이 보임", () => {
    expect(ui).toMatch(/s\.phase === 0 \? "bg-surface" : ""/);
  });
});
