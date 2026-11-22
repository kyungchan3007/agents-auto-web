// 작업 0227 — 굴러가는 숫자 계산 함수 · 부품 소스 검사 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//
// builder 가 만들 것
//   packages/ui/src/lib/motion/rolling-number.ts  (순수 함수 · 시안 .tmp/motion-1119/roll/index.html · .tmp/motion-pages/m-calc.js 와 같은 값)
//     rollCells(n: number): { kind: "digit" | "comma"; digit?: number; place?: number }[]
//         // 왼쪽 → 오른쪽 칸. Math.round(n) 의 자리 · 세 자리마다 쉼표. place 0 = 일의 자리. 242136 → 2 4 2 , 1 3 6
//     rollText(n: number | null, suffix?: string, prefix?: string): string   // 242136,"원" → "242,136원" · null → "—"(접미사 없음)
//     rollDelayMs(place: number): number        // 자리마다 55ms 씩 늦게 (일의 자리 0)
//     rollSteps(from: number, to: number, dir: 1 | -1): number  // 한 자리 숫자(0~9) 사이에 굴러갈 칸 수 · 커지는 쪽(dir 1)은 +0..+9 · 작아지는 쪽(-1)은 -0..-9
//     rollDurationMs(steps: number): number     // min(1150, 520 + |steps| × 42)
//   packages/ui/src/components/motion/rolling-number.tsx  export function RollingNumber({ value, suffix, prefix, slot, className })  (DOM 계약은 e2e/calc-roll.spec.ts 맨 위)
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { rollCells, rollDelayMs, rollDurationMs, rollSteps, rollText } from "./rolling-number";

const read = (name: string) => readFileSync(new URL(name, import.meta.url), "utf8");
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const shape = (n: number) => rollCells(n).map((c) => (c.kind === "comma" ? "," : String(c.digit))).join("");

describe("rollCells — 칸 나누기", () => {
  it("자리 · 쉼표", () => {
    expect(shape(242136)).toBe("242,136");
    expect(shape(5)).toBe("5");
    expect(shape(999)).toBe("999");
    expect(shape(1000)).toBe("1,000");
    expect(shape(1234567)).toBe("1,234,567");
    expect(shape(0)).toBe("0");
  });
  it("소수는 반올림 · 음수 아님", () => {
    expect(shape(1471.94)).toBe("1,472");
    expect(shape(0.4)).toBe("0");
    expect(shape(2.5)).toBe("3");
  });
  it("place — 일의 자리 0 · 쉼표에는 place 없음", () => {
    const cells = rollCells(12345);
    expect(cells.filter((c) => c.kind === "digit").map((c) => c.place)).toEqual([4, 3, 2, 1, 0]);
    expect(cells.find((c) => c.kind === "comma")?.place).toBeUndefined();
    expect(cells.find((c) => c.kind === "comma")?.digit).toBeUndefined();
  });
  it("쉼표 개수 = floor((자릿수 − 1) / 3)", () => {
    for (const n of [9, 10, 99, 100, 999, 1000, 9999, 10000, 999999, 1000000, 123456789]) {
      const k = String(n).length;
      expect(rollCells(n).filter((c) => c.kind === "comma").length, String(n)).toBe(Math.floor((k - 1) / 3));
      expect(rollCells(n).filter((c) => c.kind === "digit").length, String(n)).toBe(k);
    }
  });
});

describe("rollText — 화면 읽기용 글", () => {
  it("쉼표 · 접미사 · 접두사", () => {
    expect(rollText(242136, "원")).toBe("242,136원");
    expect(rollText(349752, "원")).toBe("349,752원");
    expect(rollText(315, "", "$")).toBe("$315");
    expect(rollText(0, "원")).toBe("0원");
  });
  it("값 없음은 '—' 하나", () => {
    expect(rollText(null, "원")).toBe("—");
  });
  it("rollCells 와 같은 숫자", () => {
    for (const n of [7, 1234, 98765, 4231250]) expect(rollText(n).replace(/\D/g, "")).toBe(shape(n).replace(/,/g, ""));
  });
});

describe("rollDelayMs — 자리마다 조금씩 늦게", () => {
  it("일의 자리 0 · 자리마다 55ms", () => {
    expect(rollDelayMs(0)).toBe(0);
    expect(rollDelayMs(1)).toBe(55);
    expect(rollDelayMs(6)).toBe(330);
  });
});

describe("rollSteps — 한 자리 굴러가는 칸 수", () => {
  it("커지는 쪽(위로)은 0~9 · 한 바퀴를 넘지 않음", () => {
    expect(rollSteps(2, 7, 1)).toBe(5);
    expect(rollSteps(7, 2, 1)).toBe(5); // 7 → 8 9 0 1 2
    expect(rollSteps(9, 0, 1)).toBe(1);
    expect(rollSteps(4, 4, 1)).toBe(0);
  });
  it("작아지는 쪽(아래로)은 −0~−9", () => {
    expect(rollSteps(7, 2, -1)).toBe(-5);
    expect(rollSteps(2, 7, -1)).toBe(-5); // 2 → 1 0 9 8 7
    expect(rollSteps(0, 9, -1)).toBe(-1);
    expect(rollSteps(4, 4, -1) + 0).toBe(0); // -0 도 0 으로 봄
  });
  it("모든 쌍 — 도착 숫자가 정확히 맞음 (굴러간 뒤 (from + steps) mod 10 = to)", () => {
    for (let a = 0; a < 10; a++) for (let b = 0; b < 10; b++) for (const dir of [1, -1] as const) {
      const s = rollSteps(a, b, dir);
      expect((((a + s) % 10) + 10) % 10, `${a}→${b} dir ${dir}`).toBe(b);
      expect(Math.abs(s)).toBeLessThanOrEqual(9);
      expect(Math.sign(s) === 0 || Math.sign(s) === dir).toBe(true);
    }
  });
});

describe("rollDurationMs", () => {
  it("520ms + 칸당 42ms · 1150ms 를 넘지 않음", () => {
    expect(rollDurationMs(0)).toBe(520);
    expect(rollDurationMs(5)).toBe(730);
    expect(rollDurationMs(-5)).toBe(730);
    expect(rollDurationMs(9)).toBe(898);
    expect(rollDurationMs(100)).toBe(1150);
  });
});

describe("RollingNumber 부품 소스", () => {
  const s = () => code(read("../../components/motion/rolling-number.tsx")) + code(read("../../hooks/motion/use-rolling-number.ts")) + code(read("./rolling-number.ts")); // 작업 0312: 상태 · 효과는 훅 · 계산은 lib
  it("export · props", () => {
    expect(s()).toMatch(/"use client"|'use client'/);
    expect(read("../../components/motion/rolling-number.tsx")).toMatch(/use client/);
    expect(s()).toMatch(/export function RollingNumber\(/);
    for (const p of ["value", "suffix", "prefix", "slot", "className"]) expect(s(), p).toMatch(new RegExp(`\\b${p}\\b`));
  });
  it("계산 함수를 씀 · 같은 값을 두 번 계산하지 않도록 lib 에서 가져옴", () => {
    expect(s()).toMatch(/from "\.\.\/\.\.\/lib\/motion\/rolling-number"/); // 작업 0312: lib 묶음 폴더
    for (const f of ["rollCells", "rollText", "rollDelayMs", "rollSteps", "rollDurationMs"]) expect(s(), f).toMatch(new RegExp(`\\b${f}\\b`));
  });
  it("움직임 줄이기를 확인함 · 타이머로 숫자를 바꾸지 않음(웹 애니메이션) · 화면 읽기용 글 한 번", () => {
    expect(s()).toMatch(/prefers-reduced-motion/);
    expect(s()).toMatch(/\.animate\(/);
    expect(s()).not.toMatch(/setInterval/);
    expect(s()).toMatch(/aria-hidden/);
    expect(s()).toMatch(/roll-sr/);
  });
  it("DOM 계약 testid", () => {
    for (const id of ["rolling-number", "roll-cell", "roll-strip", "roll-suffix", "roll-sr"]) expect(s(), id).toContain(id);
    for (const a of ["data-slot", "data-value", "data-final", "data-state", "data-moving", "data-digit", "data-kind"]) expect(s(), a).toContain(a);
  });
});
