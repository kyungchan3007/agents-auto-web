// 작업 0168 — 사이트 전체 디자인 변경 ① 공통 기반: 메뉴 · 글꼴 · 고양이/동전 제거 · 장식 걷기 · 문서 (소스 검사) (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//
// builder 가 할 것
//   shared/site-nav.tsx — 메뉴 순서 · 주소 (R4 · figma-spec 라우트 맵):
//     여행 타이밍 /flights · 오늘 환율 /#today · 통화 /currencies · 여행 물가 /prices · 직구 계산 /calc · 작업실 /log · GEO 측정 /geo — 소개(/about)는 메뉴에 없음
//   packages/ui/src/components/layout/nav-bar.tsx — 데스크톱: 하늘 종이(data-surface="light") 위 로고 + 메뉴 한 줄 · 모바일: 로고 + 메뉴 아이콘 버튼
//     버튼: <button> · 접근 이름에 "메뉴" · aria-expanded(열림/닫힘) · aria-controls · Esc 로 닫기 · 누르면 메뉴 7칸이 펼쳐짐 · 로고는 "/" 로 가는 링크
//     0164 의 휴대폰 두 줄 감싸기(max-[389px]:h-14 · 6.5rem)는 없어짐
//   apps/web/src/app/layout.tsx — next/font/google 으로 Gasoek_One(400) · IBM_Plex_Sans_KR(400 · 600) · 각각 variable 옵션(CSS 변수) · <html> 에 변수 클래스 · data-surface="light" · viewport.themeColor 하늘 종이 #EAF4F2 (밤 포스터면 울트라마린 — 배열 · media 가능)
//   packages/ui heading.tsx(hero · title) · big-number.tsx — font-display · 숫자 tabular-nums
//   고양이(cat-figure · money-cat · worker-cat) · 동전(coin) — apps/web · packages/ui 의 화면 코드에서 import · 이름이 모두 없어짐 (파일 삭제)
//   장식 걷기(R9): Reveal(등장 효과) · text-aurora · shadow · 그라데이션이 packages/ui · apps/web 코드에 없음
//   docs/design.md — 결정 요약 갱신 (R10)
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const WEB_SRC = resolve(__dirname, ".."); // apps/web/src
const UI_SRC = resolve(WEB_SRC, "../../../packages/ui/src");
const ROOT = resolve(WEB_SRC, "../../..");

const read = (p: string) => readFileSync(p, "utf8");
/** 테스트 · 설명 글(주석)을 뺀 화면 코드 */
const codeOf = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = join(dir, d.name);
    if (d.isDirectory()) return d.name === "node_modules" || d.name === ".next" ? [] : sources(p);
    return /\.tsx?$/.test(d.name) && !/\.test\.tsx?$/.test(d.name) ? [p] : [];
  });
}
const APP_FILES = [...sources(WEB_SRC), ...sources(UI_SRC)];

describe("메뉴 — 순서 · 주소 (R4)", () => {
  const nav = read(join(WEB_SRC, "shared/site-nav.tsx"));
  const links = [...nav.matchAll(/\{\s*href:\s*"([^"]+)"\s*,\s*label:\s*"([^"]+)"/g)].map((m) => [m[2], m[1]]);

  it("여행 타이밍 · 오늘 환율 · 통화 · 여행 물가 · 직구 계산 · 작업실 · GEO 측정 순서 + 주소", () => {
    expect(links).toEqual([
      ["여행 타이밍", "/flights"],
      ["오늘 환율", "/#today"],
      ["통화", "/currencies"],
      ["여행 물가", "/prices"],
      ["직구 계산", "/calc"],
      ["작업실", "/log"],
      ["GEO 측정", "/geo"],
    ]);
  });

  it("소개(/about)는 메뉴에 없음 · 현재 페이지 표시(current)는 유지", () => {
    expect(links.map((l) => l[1])).not.toContain("/about");
    expect(nav).toMatch(/current:\s*page === "flights"/);
  });
});

describe("메뉴 바 — 모바일 메뉴 버튼 (aria-expanded)", () => {
  const src = read(join(UI_SRC, "components/layout/nav-bar.tsx"));

  it("메뉴 버튼: <button> · aria-expanded · aria-controls · 접근 이름에 '메뉴'", () => {
    expect(src).toMatch(/<button\b/);
    expect(src).toMatch(/aria-expanded=\{/);
    expect(src).toMatch(/aria-controls=/);
    expect(src).toMatch(/aria-label=\{?[^}\n]*메뉴/);
  });

  it("Esc 로 닫음 · 열림 상태를 가짐", () => {
    expect(src).toMatch(/Escape/);
    expect(src).toMatch(/useState/);
  });

  it("하늘 종이 바탕(data-surface=\"light\") · 로고는 / 로 · 예전 휴대폰 두 줄 감싸기가 없음", () => {
    expect(src).toMatch(/data-surface="light"/);
    expect(src).toMatch(/href="\/"/);
    expect(src).not.toMatch(/max-\[389px\]/);
  });
});

describe("글꼴 — next/font 로 Gasoek One · IBM Plex Sans KR (R3)", () => {
  const layout = read(join(WEB_SRC, "app/layout.tsx"));

  it("next/font/google 에서 두 글꼴을 불러옴 · 굵기 400 / 400·600 · CSS 변수 옵션", () => {
    expect(layout).toMatch(/from\s*"next\/font\/google"/);
    expect(layout).toMatch(/\bGasoek_One\b/);
    expect(layout).toMatch(/\bIBM_Plex_Sans_KR\b/);
    expect(layout).toMatch(/Gasoek_One\(\{[^}]*weight:\s*"400"/);
    expect(layout).toMatch(/IBM_Plex_Sans_KR\(\{[^}]*weight:\s*\[\s*"400"\s*,\s*"600"\s*\]/);
    expect(layout.match(/variable:\s*"--font-[a-z0-9-]+"/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it("<html> 에 두 변수 클래스 · 기본 배경 light(하늘 종이) · 주소창 색 하늘 종이", () => {
    expect(layout).toMatch(/<html[\s\S]*?className=\{[\s\S]*?\.variable[\s\S]*?\.variable[\s\S]*?>/);
    expect(layout).toMatch(/<html[^>]*data-surface="light"/);
    expect(layout).not.toMatch(/data-surface="dark"/);
    expect(layout.toLowerCase()).toContain("#eaf4f2");
    expect(layout).not.toMatch(/themeColor:\s*"#000000"/);
  });

  it("큰 제목 · 큰 숫자 컴포넌트는 font-display · 숫자는 tabular-nums", () => {
    expect(read(join(UI_SRC, "components/text/heading.tsx"))).toContain("font-display");
    const big = read(join(UI_SRC, "components/text/big-number.tsx"));
    expect(big).toContain("font-display");
    expect(big).toContain("tabular-nums");
  });
});

describe("고양이 · 동전을 화면에서 뺌 (R8)", () => {
  const GONE = /cat-figure|money-cat|worker-cat|MoneyCat|WorkerCat|CatFigure|MoneyMood|catMood|\bCoinLazy\b|coin-slot|CoinSlot|objects\/coin|three\/characters/;

  it("apps/web · packages/ui 의 어느 코드도 고양이 · 동전 import · 이름이 없음", () => {
    const bad = APP_FILES.filter((f) => GONE.test(codeOf(read(f)))).map((f) => f.replace(ROOT + "/", ""));
    expect(bad).toEqual([]);
  });

  it("고양이 · 동전 전용 파일이 없음", () => {
    for (const p of [join(WEB_SRC, "features/currencies/components/coin-slot.tsx"), join(WEB_SRC, "app/design/characters.tsx"), join(UI_SRC, "three/characters"), join(UI_SRC, "three/objects/coin.tsx")]) {
      expect(existsSync(p), p.replace(ROOT + "/", "")).toBe(false);
    }
  });
});

describe("장식을 걷어 냄 (R9) — 등장 효과 · 오로라 글자 · 그림자 · 그라데이션", () => {
  it("Reveal(등장 효과) · text-aurora 가 어느 화면 코드에도 없음 · reveal 파일도 없음", () => {
    expect(existsSync(join(UI_SRC, "components/motion/reveal.tsx"))).toBe(false);
    const bad = APP_FILES.filter((f) => /\bReveal\b|hav-reveal|text-aurora/.test(codeOf(read(f)))).map((f) => f.replace(ROOT + "/", ""));
    expect(bad).toEqual([]);
  });

  it("공통 컴포넌트(packages/ui/src/components)에 그림자(shadow) · 그라데이션이 없음", () => {
    const bad = sources(join(UI_SRC, "components"))
      .filter((f) => /\bshadow(-[\w\[\]\/.-]+)?\b|bg-gradient|linear-gradient|\bfrom-[\w/.-]+\s+to-|\bvia-[\w/.-]+/.test(codeOf(read(f))))
      .map((f) => f.replace(ROOT + "/", ""));
    expect(bad).toEqual([]);
  });
});

describe("문서 — docs/design.md 결정 요약 (R10)", () => {
  const doc = read(join(ROOT, "docs/design.md"));
  it("새 결정(색 · 글꼴 · 밤 포스터 · 3D 유지 · 고양이/동전 제거)이 적혀 있음", () => {
    expect(doc).toContain("Gasoek One");
    expect(doc).toContain("IBM Plex Sans KR");
    expect(doc.toLowerCase()).toContain("#eaf4f2");
    expect(doc).toContain("밤 포스터");
    expect(doc).toMatch(/고양이/);
    expect(doc).toMatch(/바뀐 결정/);
  });
});
