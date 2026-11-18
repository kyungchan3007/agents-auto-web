// 작업 0216 — 바닥 띠를 시안처럼 흰 바탕 + 위쪽 옅은 선 (소스 검사 · 테스트 먼저)
//   시안 A · B 모두 맨 아래는 흰 면 위 가는 선 아래 작은 출처 글 · 예전 청록 띠(bg-band)는 새 디자인에 없음
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const code = readFileSync(new URL("./page-footer.tsx", import.meta.url), "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\/.*$/gm, "");

describe("PageFooter — 흰 바탕 + 위쪽 선 (작업 0216 · 시안)", () => {
  it("청록 띠(bg-band · text-on-band)를 쓰지 않음", () => {
    expect(code).not.toMatch(/bg-band|text-on-band/);
  });
  it("페이지 바탕(bg-surface) · 위쪽 옅은 선(border-t border-line) · 보조 글자색(text-fg-2)", () => {
    expect(code).toMatch(/bg-surface/);
    expect(code).toMatch(/border-t\b[^"]*border-line|border-line[^"]*border-t\b/);
    expect(code).toMatch(/text-fg-2/);
  });
});
