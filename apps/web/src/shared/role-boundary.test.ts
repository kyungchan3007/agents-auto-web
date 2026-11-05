// 코드 역할 분담 검사 (작업 0125) — 화면(.tsx)은 그리기만 · 상태 · 효과는 커스텀 훅(use-*.ts) · 기능 폴더끼리 직접 참조 금지
//   고치는 법: 상태 · 효과는 같은 기능 폴더의 use-*.ts 로 · 두 기능이 함께 쓰는 값은 shared/ 또는 라우트(app/)에서 props 로
import { readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = resolve(__dirname, "..");
const FEATURES = join(SRC, "features");

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = join(dir, d.name);
    if (d.isDirectory()) return files(p);
    return /\.tsx?$/.test(d.name) && !/\.test\.tsx?$/.test(d.name) ? [p] : [];
  });
}

const FORBIDDEN = /import\s*(?:type\s+)?\{([^}]*)\}\s*from\s*"(react|motion\/react|next\/navigation)"/g;

/** 화면 파일이 직접 가져온 훅 이름 */
function viewHooks(src: string): string[] {
  const out: string[] = [];
  for (const m of src.matchAll(FORBIDDEN)) {
    if (/^import\s+type/.test(m[0])) continue;
    for (const raw of m[1].split(",")) {
      const name = raw.trim();
      if (/^use[A-Z]/.test(name)) out.push(`${m[2]}:${name}`);
    }
  }
  return out;
}

/** features/<slice>/ 파일이 다른 기능 폴더를 가져온 경로 */
function crossSlice(file: string, src: string): string[] {
  const slice = relative(FEATURES, file).split("/")[0];
  const out: string[] = [];
  for (const m of src.matchAll(/from\s*"([^"]+)"/g)) {
    const spec = m[1];
    let target: string | null = null;
    if (spec.startsWith("@/features/")) target = spec.slice("@/features/".length).split("/")[0];
    else if (spec.startsWith(".")) {
      const rel = relative(FEATURES, resolve(file, "..", spec));
      if (!rel.startsWith("..")) target = rel.split("/")[0];
    }
    if (target && target !== slice) out.push(spec);
  }
  return out;
}

describe("코드 역할 분담 (작업 0125)", () => {
  const views = [...files(FEATURES), ...files(join(SRC, "shared"))].filter((f) => f.endsWith(".tsx"));

  it("검사기 자체 — 값 훅은 잡고 타입 · 커스텀 훅은 통과", () => {
    expect(viewHooks('import { useState, type ReactNode } from "react";')).toEqual(["react:useState"]);
    expect(viewHooks('import { useScroll, motion } from "motion/react";')).toEqual(["motion/react:useScroll"]);
    expect(viewHooks('import { usePathname } from "next/navigation";')).toEqual(["next/navigation:usePathname"]);
    expect(viewHooks('import type { ReactNode } from "react";\nimport { useCalcForm } from "./use-calc-form";')).toEqual([]);
  });

  it("화면 파일(.tsx)은 상태 · 효과 훅을 직접 쓰지 않음", () => {
    const bad = views.flatMap((f) => viewHooks(readFileSync(f, "utf8")).map((h) => `${relative(SRC, f)} → ${h}`));
    expect(bad).toEqual([]);
  });

  it("기능 폴더끼리 직접 가져오지 않음", () => {
    const bad = files(FEATURES).flatMap((f) => crossSlice(f, readFileSync(f, "utf8")).map((s) => `${relative(SRC, f)} → ${s}`));
    expect(bad).toEqual([]);
  });

  it("순수 로직 파일(use-* 가 아닌 .ts)은 React 를 가져오지 않음", () => {
    const logic = files(FEATURES).filter((f) => f.endsWith(".ts") && !/\/use-[^/]+\.ts$/.test(f));
    const bad = logic.filter((f) => /from\s*"(react|motion\/react)"/.test(readFileSync(f, "utf8").replace(/import type[^\n]*\n/g, ""))).map((f) => relative(SRC, f));
    expect(bad).toEqual([]);
  });

  it("앱 공용 폴더에는 이 사이트 고유 파일만 — 2개 이상 기능이 쓰는 공통 모듈 · 디자인은 @hav/ui · @hav/shared 로 승격 (작업 0126)", () => {
    const allowed = ["api.ts", "outage-notice.tsx", "outage.ts", "site-nav.tsx", "site.ts", "sitemap-entries.ts", "use-outage-visible.ts"];
    const here = files(join(SRC, "shared")).map((f) => relative(join(SRC, "shared"), f)).sort();
    expect(here).toEqual([...allowed].sort());
  });

  it("기능 폴더 안은 성격별로 — 화면은 components · 훅은 hooks · 계산은 lib (작업 0137)", () => {
    const bad = files(FEATURES)
      .map((f) => relative(FEATURES, f).split("/").slice(1).join("/"))
      .filter((f) => !/^(components\/[^/]+\.tsx|hooks\/use-[^/]+\.ts|lib\/[^/]+\.ts)$/.test(f));
    expect(bad).toEqual([]);
  });

  it("패키지 파일은 묶음 폴더 안에 — 바로 아래에 두지 않음 (작업 0137)", () => {
    const PKG = resolve(SRC, "../../../packages");
    const loose = (dir: string) => readdirSync(dir, { withFileTypes: true }).filter((d) => d.isFile() && /\.tsx?$/.test(d.name)).map((d) => join(relative(PKG, dir), d.name));
    expect([loose(join(PKG, "ui/src")), loose(join(PKG, "ui/src/components")), loose(join(PKG, "ui/src/three")), loose(join(PKG, "shared/src"))].flat()).toEqual([]);
  });

  it("API 기능 폴더끼리 직접 가져오지 않음 (작업 0126)", () => {
    const API = resolve(SRC, "../../api/src/features");
    const bad = files(API).flatMap((f) => {
      const slice = relative(API, f).split("/")[0];
      return [...readFileSync(f, "utf8").matchAll(/from\s*"(\.[^"]+)"/g)]
        .map((m) => relative(API, resolve(f, "..", m[1])))
        .filter((rel) => !rel.startsWith("..") && rel.split("/")[0] !== slice)
        .map((rel) => `${relative(API, f)} → ${rel}`);
    });
    expect(bad).toEqual([]);
  });
});
