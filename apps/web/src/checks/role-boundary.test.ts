// 코드 자리 검사 (작업 0125 · 0126 · 0137 · 0312) — 화면 · 훅 · 로직 · 기능 경계는 src/role-boundary.test.ts (어드민과 같은 규칙)
//   여기는 운영 앱에만 있는 자리 규칙: 앱 공통(src/shared)의 목록 · 패키지 파일은 묶음 폴더 안 · API 기능 폴더끼리 직접 가져오지 않음
import { readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = resolve(__dirname, "..");

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = join(dir, d.name);
    if (d.isDirectory()) return files(p);
    return /\.tsx?$/.test(d.name) && !/\.test\.tsx?$/.test(d.name) ? [p] : [];
  });
}

describe("코드 자리 (작업 0126 · 0137 · 0312)", () => {
  it("앱 공통(src/shared)에는 이 사이트 고유 파일만 · 묶음 폴더(nav · seo · outage · signal)로 — 두 앱이 함께 쓰면 @hav/shared · @hav/ui · @hav/edge", () => {
    // nav: 상단 메뉴 · 링크 / seo: 검색 · 공유 정보(메타 · 구조화 자료 · sitemap · 공유 이미지 글꼴) / outage: 장애 안내 / signal: 신호 점 색 · 신호 맵(두 기능 이상이 씀)
    const allowed = [
      "nav/nav-links.ts",
      "nav/site-nav.tsx",
      "outage/outage-notice.tsx",
      "outage/outage.ts",
      "outage/use-outage-visible.ts",
      "seo/json-ld.tsx",
      "seo/og-fonts.server.ts",
      "seo/seo.ts",
      "seo/sitemap-entries.ts",
      "signal/signal-maps.ts",
      "signal/signal-tone.ts",
      "site.ts",
    ];
    const here = files(join(SRC, "shared")).map((f) => relative(join(SRC, "shared"), f)).sort();
    expect(here).toEqual([...allowed].sort());
  });

  it("패키지 파일은 묶음 폴더 안에 — 바로 아래에 두지 않음 (작업 0137)", () => {
    const PKG = resolve(SRC, "../../../packages");
    const loose = (dir: string) => readdirSync(dir, { withFileTypes: true }).filter((d) => d.isFile() && /\.tsx?$/.test(d.name)).map((d) => join(relative(PKG, dir), d.name));
    expect([loose(join(PKG, "ui/src")), loose(join(PKG, "ui/src/components")), loose(join(PKG, "shared/src"))].flat()).toEqual([]);
  });

  it("API 기능 폴더끼리 직접 가져오지 않음 (작업 0126)", () => {
    const API = resolve(SRC, "../../api/src/features");
    const bad = files(API).flatMap((f) => {
      const slice = relative(API, f).split("/")[0];
      return [...readFileSync(f, "utf8").matchAll(/from\s*"(\.[^"]+)"/g)]
        .map((m) => relative(API, resolve(f, "..", m[1]!)))
        .filter((rel) => !rel.startsWith("..") && rel.split("/")[0] !== slice)
        .map((rel) => `${relative(API, f)} → ${rel}`);
    });
    expect(bad).toEqual([]);
  });
});
