// 작업 0213 — 탭 밑줄 이동은 left · width 가 아니라 transform (레이아웃을 다시 계산하지 않음) · 모션 줄이기를 존중
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Tabs 밑줄 (작업 0213)", () => {
  const s = readFileSync(join(__dirname, "tabs.tsx"), "utf8");
  const indicator = s.match(/<BaseTabs\.Indicator[\s\S]*?\/>/)?.[0] ?? "";
  it("transform 으로 움직이고 left 를 바꾸지 않음", () => {
    expect(indicator).toContain("translate-x-(--active-tab-left)");
    expect(indicator).toContain("transition-transform");
    expect(indicator).not.toMatch(/(?<![-\w])left-\(--active-tab-left\)/);
    expect(indicator).not.toContain("transition-all");
  });
  it("움직임 줄이기면 바로 옮김", () => {
    expect(indicator).toContain("motion-reduce:transition-none");
  });
});
