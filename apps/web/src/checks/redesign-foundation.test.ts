// 작업 0168 — 사이트 전체 디자인 변경 ① 공통 기반: 메뉴 · 글꼴 · 고양이/동전 제거 · 장식 걷기 · 문서 (소스 검사) (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//
// builder 가 할 것
//   shared/nav/site-nav.tsx — 메뉴 순서 · 주소 (R4 · figma-spec 라우트 맵):
//     여행 타이밍 /flights · 오늘 환율 /#today · 통화 /currencies · 여행 물가 /prices · 직구 계산 /calc · 작업실 /log · GEO 측정 /geo — 소개(/about)는 메뉴에 없음
//   packages/ui/src/components/layout/nav-bar.tsx — 데스크톱: 파랑 띠(data-surface="dark" · 작업 0216) 위 로고 + 메뉴 한 줄 · 모바일: 로고 + 메뉴 아이콘 버튼
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
import { navLinks, type Page } from "../shared/nav/nav-links";

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
  const nav = read(join(WEB_SRC, "shared/nav/site-nav.tsx")) + read(join(WEB_SRC, "shared/nav/nav-links.ts")); // 작업 0312: 링크는 nav-links.ts
  const links = [...nav.matchAll(/\{\s*href:\s*"([^"]+)"\s*,\s*label:\s*"([^"]+)"/g)].map((m) => [m[2], m[1]]);

  // 작업실 · GEO 측정은 어드민(admin.flapfx.com)으로 옮김 — 방문자 메뉴 다섯 개 · 어드민은 자기 틀 (작업 0302 · 0303)
  const pairs = (page: Page) => navLinks(page).map((l) => [l.label, l.href]);

  it("여행 타이밍 · 오늘 환율 · 통화 · 여행 물가 · 직구 계산 순서 + 주소 (작업실 · GEO 측정 없음)", () => {
    for (const page of ["home", "currencies", "prices", "flights", "calc", "about"] as const satisfies readonly Page[]) {
      expect(pairs(page)).toEqual([
        ["여행 타이밍", "/flights"],
        ["오늘 환율", "/#today"],
        ["통화", "/currencies"],
        ["여행 물가", "/prices"],
        ["직구 계산", "/calc"],
      ]);
    }
  });


  it("소개(/about)는 메뉴에 없음 · 현재 페이지 표시(current)는 유지", () => {
    expect(links.map((l) => l[1])).not.toContain("/about");
    expect(nav).toMatch(/current:\s*page === "flights"/);
  });
});

describe("메뉴 바 — 모바일 메뉴 버튼 (aria-expanded)", () => {
  // 작업 0312: 열고 닫기 · Esc 는 훅(hooks/nav/use-nav-menu.ts)으로 — 부품과 함께 읽음
  const src = read(join(UI_SRC, "components/layout/nav-bar.tsx")) + read(join(UI_SRC, "hooks/nav/use-nav-menu.ts"));

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

  it("파랑 띠 바탕(data-surface=\"dark\") · 로고는 / 로 · 예전 휴대폰 두 줄 감싸기가 없음", () => {
    expect(src).toMatch(/data-surface="dark"/); // 메뉴 띠는 파랑 (작업 0216)
    expect(src).toMatch(/href="\/"/);
    expect(src).not.toMatch(/max-\[389px\]/);
  });
});

describe("글꼴 — next/font 로 IBM Plex Sans KR (R3 · 작업 0176: 큰 제목은 Pretendard 800 으로 바뀜 — font-pretendard.test.ts)", () => {
  const layout = read(join(WEB_SRC, "app/layout.tsx"));

  it("next/font/google 에서 두 글꼴을 불러옴 · 굵기 400 / 400·600 · CSS 변수 옵션", () => {
    expect(layout).toMatch(/from\s*"next\/font\/google"/);
    expect(layout).toMatch(/\bIBM_Plex_Sans_KR\b/);
    expect(layout).toMatch(/IBM_Plex_Sans_KR\(\{[^}]*weight:\s*\[\s*"400"\s*,\s*"600"(\s*,\s*"700")?\s*\]/); // 700 은 작업 0173 글꼴 정리 (font-readability.test.ts 가 검사)
    expect(layout.match(/variable:\s*"--font-[a-z0-9-]+"/g)?.length).toBeGreaterThanOrEqual(1);
  });

  it("<html> 에 글꼴 변수 클래스 · 기본 배경 light(하늘 종이) · 주소창 색 하늘 종이", () => {
    expect(layout).toMatch(/<html[\s\S]*?className=\{[\s\S]*?\.variable[\s\S]*?>/);
    expect(layout).toMatch(/<html[^>]*data-surface="light"/);
    expect(layout).not.toMatch(/data-surface="dark"/);
    expect(layout.toLowerCase()).toContain("#ffffff"); // 흰 바탕 (작업 0216 사용자 결정)
    expect(layout.toLowerCase()).not.toContain("#eaf4f2");
    expect(layout).not.toMatch(/themeColor:\s*"#000000"/);
  });

  it("큰 제목 · 큰 숫자 컴포넌트는 font-display · 숫자는 tabular-nums", () => {
    expect(read(join(UI_SRC, "components/text/heading.tsx"))).toContain("font-display");
    const big = read(join(UI_SRC, "components/text/big-number.tsx"));
    expect(big).toContain("font-display");
    expect(big).toContain("tabular-nums");
  });

  it("큰 숫자 색은 전용 토큰(text-figure) — 하늘 종이 위 울트라마린 · 띠 위 해 노랑 (작업 0169)", () => {
    expect(read(join(UI_SRC, "components/text/big-number.tsx"))).toContain("text-figure");
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
    // 숫자 강조 부품(emph.tsx)의 형광펜 띠는 글자를 읽히게 · 돋보이게 하는 기능이라 그라데이션을 허용 (작업 0175) · 그림자는 안내판(flap-board.tsx · 작업 0177 "벽에 걸린 물건처럼")만 허용
    // 그래프 2D(시안 F · 사용자 확정 "시안 그대로"): 그래프 부품(선 그래프 · 12달 막대 · 여행 물가 자)은 그라데이션 면 · 그림자가 시안의 핵심이라 허용 — SVG 의 linearGradient · feDropShadow (아래 GRAPH_PARTS)
    // 0227: rolling-number.tsx 는 mask-image 가리개만 허용(위 코드) — 아래 두 줄 테스트가 그 예외를 확인
    const GRAPH_PARTS = ["line-chart.tsx", "month-bars.tsx", "ruler-chart.tsx"];
    // 작업 0250 — 그림자 예외(사용자 결정): 여행지 고르기 팝업(pick-trip.tsx) "팝업 그림자는 사용해야지 안그러면 구분이 안되니까" · 국기 옅은 테두리(flag.tsx · 0249 · 18번 · 흰 바탕에서 흰 부분이 사라지지 않게)
    // 작업 0370 — 그림자 예외(사용자 요청): 사이드바 · 바텀 시트(side-panel.tsx)의 본문과 구분되는 경계 그림자 ("이거 경계 이거 구분해") · 요청 원문 .agents/specs/0370-side-morph/request.md
    const SHADOW_OK = ["pick-trip.tsx", "flag.tsx", "side-panel.tsx"];
    const bad = sources(join(UI_SRC, "components"))
      .filter((f) => {
        if (GRAPH_PARTS.some((g) => f.endsWith(g))) return false;
        let code = codeOf(read(f));
        // 굴러가는 숫자(작업 0227): 굴러가는 칸의 위아래 가장자리 흐림 — 색 그라데이션이 아니라 mask-image 가리개만 예외 (시안 .rc.moving) · 그 밖 그라데이션 · 그림자는 그대로 금지
        if (f.endsWith("rolling-number.tsx")) code = code.replace(/\[(?:-webkit-)?mask-image:linear-gradient\([^\]]*\)\]/g, "");
        const gradient = !f.endsWith("emph.tsx") && /bg-gradient|linear-gradient|\bfrom-[\w/.-]+\s+to-|\bvia-[\w/.-]+/.test(code);
        return gradient || (!f.endsWith("flap-board.tsx") && !SHADOW_OK.some((g) => f.endsWith(g)) && /\bshadow(-[\w\[\]\/.-]+)?\b/.test(code));
      })
      .map((f) => f.replace(ROOT + "/", ""));
    expect(bad).toEqual([]);
  });
});

describe("문서 — docs/design.md 결정 요약 (R10)", () => {
  const doc = read(join(ROOT, "docs/design.md"));
  it("새 결정(색 · 글꼴 · 3D 유지 · 고양이/동전 제거)이 적혀 있음", () => {
    expect(doc).toContain("Pretendard"); // 큰 제목 · 큰 숫자 (작업 0176 · 예전 Gasoek One 결정은 font-pretendard.test.ts 가 '예전 줄에만' 검사)
    expect(doc).toContain("IBM Plex Sans KR");
    expect(doc).toMatch(/흰 바탕/); // 작업 0216 사용자 결정 — 하늘 종이 대신 흰 바탕
    // 밤 포스터는 작업 0173 에서 없앰 — 문서 결정은 light-only.test.ts 가 검사
    expect(doc).toMatch(/고양이/);
    expect(doc).toMatch(/바뀐 결정/);
  });
});

// 작업 0227 — 굴러가는 숫자의 가장자리 흐림은 mask-image 가리개만 (색 그라데이션 · 그림자 아님)
describe("굴러가는 숫자 흐림 예외 (작업 0227)", () => {
  const f = join(UI_SRC, "components", "motion", "rolling-number.tsx");
  it("mask-image 가리개가 있고 · 그 밖 그라데이션 · 그림자 · 색 그라데이션 클래스는 없음", () => {
    const code = codeOf(read(f));
    expect(code).toMatch(/\[mask-image:linear-gradient\(/);
    const rest = code.replace(/\[(?:-webkit-)?mask-image:linear-gradient\([^\]]*\)\]/g, "");
    expect(rest).not.toMatch(/bg-gradient|linear-gradient|\bfrom-[\w/.-]+\s+to-|\bvia-[\w/.-]+/);
    expect(rest).not.toMatch(/\bshadow(-[\w[\]/.-]+)?\b/);
  });
});
