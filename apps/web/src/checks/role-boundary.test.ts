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
  it("앱 공통(src/shared)에는 이 사이트 고유 파일만 · 묶음 폴더(nav · seo · outage · signal · customs)로 — 두 앱이 함께 쓰면 @hav/shared · @hav/ui · @hav/edge", () => {
    // nav: 상단 메뉴 · 링크 / seo: 검색 · 공유 정보(메타 · 구조화 자료 · sitemap · 공유 이미지 글꼴) / outage: 장애 안내
    // signal: 판정 핀 · 점 색 · 판정 글 · 신호 맵 · 눈금 위치 / trip: 여행지 고르기 · 바꾸기 · 도착지 줄 / rate: 통화 국기 · 1년 그래프 · 기준일 안내 (운영만 쓰는 도메인 UI · 작업 0312 에 @hav/ui 에서 옮김)
    // facts: 숫자 칸(글래스) 계산 · 그리기 · 홈 hero 와 나라 물가가 함께 씀 (작업 0396)
    // customs: 직구 면세 한도 · 과세환율 고르기 · 금액 읽기 (홈 블프 hero 와 /calc 가 함께 씀 · 기능 폴더끼리 가져오기 금지라 shared 로 · 작업 0381)
    const allowed = [
      "customs/customs-rate.ts",
      "customs/parse-amount.ts",
      "customs/rules.ts",
      "facts/facts-card.tsx",
      "facts/facts.css",
      "facts/facts.ts",
      "nav/nav-links.ts",
      "nav/site-nav.tsx",
      "outage/outage-notice.tsx",
      "outage/outage.ts",
      "outage/use-outage-visible.ts",
      "seo/analytics-script.tsx",
      "seo/analytics.ts",
      "seo/json-ld.tsx",
      "seo/og-fonts.server.ts",
      "seo/seo.ts",
      "seo/sitemap-entries.ts",
      "seo/track-click.ts",
      "seo/use-analytics-enabled.ts",
      "seo/use-click-tracking.ts",
      "seo/verification.ts",
      "rate/currency-flag.tsx",
      "rate/freshness-note.tsx",
      "rate/use-freshness.ts",
      "rate/use-year-chart.ts",
      "rate/year-chart-scale.ts",
      "rate/year-chart.tsx",
      "signal/scale-position.ts",
      "signal/signal-maps.ts",
      "signal/signal-pin-text.ts",
      "signal/signal-pin.tsx",
      "signal/signal-tone.ts",
      "trip/destination-row.tsx",
      "trip/pick-trip.tsx",
      "trip/trip-copy.ts",
      "trip/trip-switcher.tsx",
      "trip/use-pick-trip.ts",
      "trip/use-picked-trip.ts",
      "trip/use-trip-switcher.ts",
      "site.ts",
    ];
    const here = files(join(SRC, "shared")).map((f) => relative(join(SRC, "shared"), f)).sort();
    expect(here).toEqual([...allowed].sort());
  });

  it("패키지 파일은 묶음 폴더 안에 — 바로 아래에 두지 않음 (작업 0137)", () => {
    const PKG = resolve(SRC, "../../../packages");
    const loose = (dir: string) => readdirSync(dir, { withFileTypes: true }).filter((d) => d.isFile() && /\.tsx?$/.test(d.name) && !/\.test\.tsx?$/.test(d.name)).map((d) => join(relative(PKG, dir), d.name));
    expect([loose(join(PKG, "ui/src")), loose(join(PKG, "ui/src/components")), loose(join(PKG, "ui/src/hooks")), loose(join(PKG, "ui/src/lib")), loose(join(PKG, "shared/src"))].flat()).toEqual([]);
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
