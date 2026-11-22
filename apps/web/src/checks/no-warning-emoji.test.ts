// 작업 0213 — 경고 표시는 이모지(⚠) 글자가 아니라 그림(SVG) 아이콘 — 윈도우 · 안드로이드마다 모양이 달라서
import { readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../../../..");
const DIRS = [join(ROOT, "apps/web/src"), join(ROOT, "packages/ui/src")];

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = join(dir, d.name);
    if (d.isDirectory()) return d.name === "node_modules" ? [] : files(p);
    return /\.tsx?$/.test(d.name) && !/\.test\.tsx?$/.test(d.name) ? [p] : [];
  });
}

describe("경고 아이콘 (작업 0213)", () => {
  it("화면 코드에 ⚠ 이모지 글자가 없음", () => {
    const bad = DIRS.flatMap(files)
      .filter((f) => /⚠/.test(readFileSync(f, "utf8")))
      .map((f) => relative(ROOT, f));
    expect(bad).toEqual([]);
  });
  it("그림 아이콘 부품은 svg · 글자색을 따르고 · 화면 읽기 도구는 건너뜀 · 장애 안내 · 환율 기준일 글이 씀", () => {
    const icon = readFileSync(join(ROOT, "packages/ui/src/components/feedback/warn-icon.tsx"), "utf8");
    expect(icon).toContain("<svg");
    expect(icon).toContain("currentColor");
    expect(icon).toContain('aria-hidden="true"');
    expect(readFileSync(join(ROOT, "apps/web/src/shared/outage/outage-notice.tsx"), "utf8")).toContain("WarnIcon");
    expect(readFileSync(join(ROOT, "packages/ui/src/components/feedback/freshness-note.tsx"), "utf8")).toContain("WarnIcon");
  });
});
