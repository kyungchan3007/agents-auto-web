// 작업 0216 — 카운트업 · 들어오기 부품 (소스 검사 · 테스트 먼저 · 구현 전에는 FAIL 이 정상)
//
// builder 가 만들 것
//   packages/ui/src/hooks/view/use-in-view-once.ts   export function useInViewOnce<T extends Element>(): { ref: RefObject<T | null>; seen: boolean }   // 화면에 처음 들어올 때 한 번 true · 다시 false 가 되지 않음
//   packages/ui/src/hooks/motion/use-count-up.ts       export function useCountUp(final: number, opts?: { digits?: number; durationMs?: number }): { ref: RefObject<HTMLElement | null>; value: number; progress: number }
//        // 서버 첫 그림 · 움직임 줄이기 = progress 1 · value = final / 화면에 들어올 때 한 번 progress 0 → 1 (끝나면 정확히 final)
//   packages/ui/src/components/motion/count-up.tsx   export function CountUp({ value, digits, prefix, suffix, className }) — 숫자 글은 한 번만(보이는 값 하나 · 복사본 없음) · tabular-nums
//   packages/ui/src/components/motion/slide-in.tsx   export function SlideIn({ from = "left", children, className }) — 들어올 때 한 번 · ease-out 약 0.7초 · 움직임 줄이기면 바로 제자리 · 서버 첫 그림은 제자리(자바스크립트 없이도 보임)
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (name: string) => readFileSync(new URL(name, import.meta.url), "utf8");
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

describe("CountUp 부품", () => {
  const s = () => code(read("./count-up.tsx"));
  it("export · props(value · digits · prefix · suffix) · 훅 · 계산 함수를 씀", () => {
    expect(s()).toMatch(/export function CountUp\(/);
    for (const p of ["value", "digits", "prefix", "suffix"]) expect(s(), p).toMatch(new RegExp(`\\b${p}\\b`));
    expect(s()).toMatch(/useCountUp(<[^>]*>)?\(/);
    expect(s()).toMatch(/formatCount\(/);
  });
  it("숫자 글은 한 번만 — sr-only 복사본 · aria-hidden 없음 · 글자 폭 고정(tabular-nums)", () => {
    expect(s()).not.toMatch(/sr-only/);
    expect(s()).not.toMatch(/aria-hidden/);
    expect(s()).toMatch(/tabular-nums/);
  });
  it("e2e 표시 — data-testid=count-up · data-final", () => {
    expect(s()).toMatch(/data-testid="count-up"/);
    expect(s()).toMatch(/data-final=/);
  });
});

describe("useCountUp 훅", () => {
  const s = () => code(read("../../hooks/motion/use-count-up.ts"));
  it("움직임 줄이기면 움직이지 않음 · 계산은 lib/count-up", () => {
    expect(s()).toMatch(/useReducedMotion/);
    expect(s()).toMatch(/lib\/motion\/count-up/); // 작업 0312: lib 묶음 폴더
    expect(s()).toMatch(/useInViewOnce/);
  });
  it("진행 비율(progress)도 돌려줌 — 홈 동그라미가 같이 움직일 때 씀", () => {
    expect(s()).toMatch(/progress/);
  });
});

describe("SlideIn 부품", () => {
  const s = () => code(read("./slide-in.tsx")) + code(read("../../hooks/motion/use-slide-in.ts")); // 작업 0312: 효과는 훅으로
  it("export · from 방향(기본 left) · 훅 · 움직임 줄이기", () => {
    expect(s()).toMatch(/export function SlideIn\(/);
    expect(s()).toMatch(/from\s*=\s*"left"/);
    expect(s()).toMatch(/useInViewOnce/);
    expect(s()).toMatch(/useReducedMotion/);
  });
  it("끝에서 느려짐(ease-out) · 약 0.7초 · 한 번 (다시 숨지 않음)", () => {
    expect(s()).toMatch(/ease-out|cubic-bezier/);
    expect(s()).toMatch(/700|0\.7s/);
  });
});

describe("useInViewOnce 훅", () => {
  it("IntersectionObserver · 한 번 보이면 관찰을 끝냄", () => {
    const s = code(read("../../hooks/view/use-in-view-once.ts"));
    expect(s).toMatch(/IntersectionObserver/);
    expect(s).toMatch(/disconnect\(\)/);
  });
});
