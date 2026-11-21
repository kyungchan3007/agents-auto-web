// 작업 0216 — 파랑 메뉴 띠 · B 로고 (소스 검사 · 테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   메뉴 띠는 모든 페이지에서 브랜드 파랑(바다 띠 바탕 = data-surface="dark" → #2438A8) · 메뉴 글자 흰색 · 지금 페이지는 흰 알약(파랑 글자)
//   로고는 배지 없이 'flap' 흰색 + 'fx' 노랑(sun) · 화면 읽기 이름은 'flapfx' 그대로 (글자가 끊겨도 한 이름)
//   색은 토큰 이름으로만 (원색 값을 코드에 쓰지 않음 · no-raw-color.test)
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { contrastRatio, readSurfaces } from "../../lib/contrast";

const read = (name: string) => readFileSync(new URL(name, import.meta.url), "utf8");
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const src = () => code(read("./nav-bar.tsx"));

describe("띠 색", () => {
  it("header 가 바다 띠(data-surface=dark) 바탕 — bg-surface · 흰 하늘 종이 아님 @design", () => {
    const header = /<header[^>]*>/.exec(src())?.[0] ?? "";
    expect(header).toMatch(/data-surface="dark"/);
    expect(header).toMatch(/bg-surface/);
  });
  it("로고 — 'flap' 은 흰(text-foam) · 끝 글자(accent)는 노랑(text-sun) · 배지(네모 칸) 없음 @design", () => {
    const s = src();
    expect(s).toMatch(/text-foam/);
    expect(s).toMatch(/text-sun/);
    expect(s).toMatch(/accent/);
  });
  it("지금 페이지는 흰 알약 — bg-foam · 파랑 글자(text-pin-cheap) · aria-current 유지 @design", () => {
    const s = src();
    expect(s).toMatch(/aria-current/);
    expect(s).toMatch(/rounded-full/);
    expect(s).toMatch(/bg-foam/);
    expect(s).toMatch(/text-pin-cheap/);
  });
  it("원색 값을 쓰지 않음", () => {
    expect(src()).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });
});

describe("글자 대비 (tokens.css 값)", () => {
  const css = readFileSync(new URL("../../tokens.css", import.meta.url), "utf8");
  const dark = readSurfaces(css).dark;
  it("파랑 위 흰 글자 4.5 이상", () => {
    expect(contrastRatio("#ffffff", dark.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(dark.fg, dark.surface)).toBeGreaterThanOrEqual(4.5);
  });
  it("파랑 위 노랑 'fx' — 큰 글자(로고 22px 이상 굵게) 기준 3 이상 · 실제로는 4.5 도 넘음", () => {
    expect(contrastRatio(dark.figure, dark.surface)).toBeGreaterThanOrEqual(4.5);
  });
  it("흰 알약 위 파랑 글자 4.5 이상", () => {
    expect(contrastRatio("#ffffff", "#2438a8")).toBeGreaterThanOrEqual(4.5);
  });
});
