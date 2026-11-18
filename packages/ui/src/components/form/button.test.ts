// 작업 0213 — 버튼 눌림(:active) 상태 · 탭 밑줄 이동은 transform (구조 검사: 소스 글자로 확인)
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const src = (f: string) => readFileSync(join(__dirname, f), "utf8");

describe("Button — 눌림 상태 (작업 0213)", () => {
  const s = src("button.tsx");
  it("세 가지 모양 모두 :active 스타일이 있음", () => {
    const variant = s.match(/const VARIANT[\s\S]*?\};/)?.[0] ?? "";
    for (const v of ["primary", "secondary", "ghost"]) {
      const line = variant.split("\n").find((l) => l.trim().startsWith(`${v}:`)) ?? "";
      expect(line, v).toContain("active:");
    }
  });
  it("공통으로 살짝 눌리는 움직임 · 움직임 줄이기를 존중", () => {
    expect(s).toContain("active:translate-y-px");
    expect(s).toContain("motion-reduce:transition-none");
    expect(s).toContain("motion-reduce:active:translate-y-0");
  });
});
