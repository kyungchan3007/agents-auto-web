// 작업 0215 — 그림자 · 하늘 토큰 값은 예전에 화면 코드에 직접 쓰던 값과 같음 (화면 모양 그대로)
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(resolve(__dirname, "../../../.."), "packages/ui/src/tokens.css"), "utf8");
const tokenOf = (name: string) => css.match(new RegExp(`${name}:\\s*([^;]+);`))?.[1].trim();

describe("토큰 값 = 예전 직접 쓴 값 (작업 0215)", () => {
  const shadows: Record<string, string> = {
    "--shadow-board": "0 10px 24px rgba(22, 36, 110, 0.25)",
    "--shadow-chip": "0 14px 30px -16px rgba(22, 36, 110, 0.7)",
    "--shadow-pass": "0 18px 40px -16px rgba(22, 36, 110, 0.6)",
    "--shadow-panel": "0 18px 40px -18px rgba(22, 36, 110, 0.35)",
    "--shadow-ticket": "0 20px 40px -22px rgba(22, 36, 110, 0.5)",
  };
  for (const [name, value] of Object.entries(shadows)) it(`${name}`, () => expect(tokenOf(name)).toBe(value));
  it("창문 그림자 두 가지(인트로) — 안쪽 흰 줄은 카드색 토큰", () => {
    expect(tokenOf("--shadow-window")).toBe("inset 0 2px 0 var(--hav-card), 0 0 0 1px #d3dae2, 0 34px 60px -26px rgba(22, 36, 110, 0.45)");
    expect(tokenOf("--shadow-glass")).toBe("0 0 0 7px #eef2f5, 0 0 0 8px #c9d2db, inset 0 8px 18px rgba(22, 36, 110, 0.28)");
  });
  it("하늘 · 창문 색 토큰 (인트로)", () => {
    expect(tokenOf("--hav-sky-top")).toBe("#afd4e6");
    expect(tokenOf("--hav-sky-mid")).toBe("#d3e9ee");
    expect(tokenOf("--hav-window-shade")).toBe("#f4f6f8");
  });
});
