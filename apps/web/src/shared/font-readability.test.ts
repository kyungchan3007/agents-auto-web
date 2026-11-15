// 작업 0173 — 글꼴 정리: 포스터 글씨(Gasoek One · font-display)는 맨 위 큰 제목 · 큰 숫자 · 로고에만 (소스 검사) (테스트 먼저 · 구현 전에는 FAIL 이 정상)
// 사용자 "폰트가 두껍다… 가독성이 떨어지는 것 같아" → 비교안 A: 큰 제목 · 큰 숫자만 Gasoek, 나머지 제목 · 도시는 IBM Plex Sans KR 굵게(700). 크기 · 배치 · 색은 그대로 (글꼴 · 굵기만)
//
// builder 가 할 것 (prd F1~F5 · sdd)
//   font-display 를 직접 쓰는 곳은 아래 허용 목록 6개 파일뿐 (주석 설명은 세지 않음):
//     packages/ui components/text/heading.tsx (Title — 맨 위 큰 제목) · components/text/big-number.tsx (큰 숫자) · components/layout/nav-bar.tsx (로고 tripfx) ·
//     apps/web features/home/components/today-band.tsx (바다 띠 큰 문장 · 노란 큰 숫자) · features/currencies/components/currency-detail.tsx (통화 큰 환율) · features/import-calc/components/calc-result.tsx (직구 결과 금액)
//     (홈 여행 타이밍 큰 문장 · 직구 큰 문장 · 각 화면 맨 위 제목은 Title 부품을 통해 Gasoek — 직접 쓰지 않음)
//   heading.tsx: 새 부품 SectionTitle(구간 제목 · 카드 제목) — font-sans + font-bold (font-display 아님) · Title 은 font-display 유지
//   구간 제목 · 카드 제목 · 단계 제목 · 역할 이름 · 도시 이름은 font-display 대신 SectionTitle 이나 font-bold 를 씀 (아래 목록 파일) — 도착지 줄의 도시 이름(dest-city)은 font-bold
//   apps/web/src/app/layout.tsx: IBM_Plex_Sans_KR 굵기에 700 추가 (400 · 600 · 700)
//   크기 토큰(--text-section · --text-city …)은 그대로 — packages/ui/src/lib/tokens.test.ts 가 값을 계속 검사
//   ※ 허용 목록에 없는 큰 숫자(여행 타이밍 카드 값 · GEO 측정 카드 수치 · 작업 흐름 단계 번호)는 IBM Plex 굵게가 됨 — 큰 숫자로 남기려면 lead 가 허용 목록에 더함 (보고에 적음)
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const WEB_SRC = resolve(__dirname, ".."); // apps/web/src
const UI_SRC = resolve(WEB_SRC, "../../../packages/ui/src");
const ROOT = resolve(WEB_SRC, "../../..");
const rel = (f: string) => f.replace(`${ROOT}/`, "");
const codeOf = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const read = (f: string) => codeOf(readFileSync(f, "utf8"));
function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = join(dir, d.name);
    if (d.isDirectory()) return d.name === "node_modules" || d.name === ".next" ? [] : sources(p);
    return /\.tsx?$/.test(d.name) && !/\.test\.tsx?$/.test(d.name) ? [p] : [];
  });
}
const ALL = [...sources(WEB_SRC), ...sources(UI_SRC)];

const ALLOWED = [
  "packages/ui/src/components/text/heading.tsx",
  "packages/ui/src/components/text/big-number.tsx",
  "packages/ui/src/components/layout/nav-bar.tsx",
  "packages/ui/src/components/data/flap-board.tsx", // 작업 0177 출발 안내판 칸 글자 (옛 today-band 자리)
  "apps/web/src/features/currencies/components/currency-detail.tsx",
  "apps/web/src/features/import-calc/components/calc-result.tsx",
];

describe("font-display(Gasoek One)는 허용 목록 파일에서만 (F1)", () => {
  it("허용 목록 밖의 어느 코드도 font-display 를 쓰지 않음", () => {
    const bad = ALL.filter((f) => /\bfont-display\b/.test(read(f))).map(rel).filter((f) => !ALLOWED.includes(f));
    expect(bad).toEqual([]);
  });

  it("허용 목록 파일은 실제로 있음 (이름이 바뀌면 이 목록도 같이)", () => {
    for (const f of ALLOWED) expect(existsSync(join(ROOT, f)), f).toBe(true);
  });

  it("큰 제목 · 큰 숫자는 font-display(작업 0176: Pretendard 800) — heading(Title) · big-number (로고는 글꼴을 따로 고를 수 있어 여기서 안 봄)", () => {
    for (const f of ["components/text/heading.tsx", "components/text/big-number.tsx"]) expect(read(join(UI_SRC, f)), f).toMatch(/\bfont-display\b/);
  });

  it("글꼴 변수는 그대로 — tokens.css 가 --font-display(작업 0176: Pretendard) · --font-sans(IBM Plex Sans KR) 를 정의", () => {
    const css = readFileSync(join(UI_SRC, "tokens.css"), "utf8");
    expect(css).toMatch(/--font-display\s*:[^;]*Pretendard/);
    expect(css).toMatch(/--font-sans\s*:[^;]*IBM Plex Sans KR/);
  });
});

describe("구간 제목 · 카드 제목 부품 — IBM Plex 굵게 (F2 · F3)", () => {
  const heading = read(join(UI_SRC, "components/text/heading.tsx"));
  /** export function NAME( … 다음 export 전까지 */
  const slice = (name: string) => new RegExp(`export function ${name}\\b[\\s\\S]*?(?=\\nexport |$)`).exec(heading)?.[0] ?? "";

  it("SectionTitle 이 있고 font-sans + font-bold · font-display 아님", () => {
    const s = slice("SectionTitle");
    expect(s, "SectionTitle 부품").not.toBe("");
    expect(s).toMatch(/\bfont-sans\b/);
    expect(s).toMatch(/\bfont-bold\b/);
    expect(s).not.toMatch(/\bfont-display\b/);
  });

  it("Title(맨 위 큰 제목)은 font-display 유지 (작업 0176: Pretendard 800)", () => {
    expect(slice("Title")).toMatch(/\bfont-display\b/);
  });

  it("홈 '도착지별 환전 타이밍' 구간 제목은 SectionTitle (Title 아님)", () => {
    const f = read(join(WEB_SRC, "features/home/components/destinations-section.tsx"));
    expect(f).toMatch(/\bSectionTitle\b/);
    expect(f).not.toMatch(/<Title\b/);
  });
});

describe("구간 · 카드 · 단계 제목 · 역할 이름 · 도시 이름은 굵은 IBM Plex (font-display 아님)", () => {
  const FILES = [
    "apps/web/src/features/currencies/components/converter.tsx", // 실제로 바꿀 때
    "apps/web/src/features/import-calc/components/customs-section.tsx", // 이번 주 과세환율
    "apps/web/src/features/import-calc/components/import-price-section.tsx", // 수입물가와 환율
    "apps/web/src/features/travel-price/components/budget-planner.tsx", // 여행 하루 예산
    "apps/web/src/features/travel-price/components/price-bands.tsx", // 물가 구간 제목
    "apps/web/src/features/log/components/story-section.tsx", // 이 사이트를 어떻게 만들었나 · 단계 제목
    "apps/web/src/features/log/components/team-desks.tsx", // 팀 책상 역할 이름
    "apps/web/src/features/about/components/about-page.tsx", // 기준 카드 제목
  ];
  const present = FILES.filter((f) => existsSync(join(ROOT, f)));

  it("목록 파일이 대부분 그대로 있음 (이름 바뀐 것만 빠져도 6개 이상)", () => {
    expect(present.length).toBeGreaterThanOrEqual(6);
  });

  for (const f of FILES.filter((x) => existsSync(join(ROOT, x)))) {
    it(`${f.split("/").pop()} — SectionTitle 또는 font-bold 를 쓰고 font-display 는 없음`, () => {
      const src = read(join(ROOT, f));
      expect(src).not.toMatch(/\bfont-display\b/);
      expect(src).toMatch(/\bSectionTitle\b|\bfont-bold\b/);
    });
  }

  it("도착지 줄 도시 이름(dest-city)은 font-bold · font-display 아님", () => {
    const row = read(join(UI_SRC, "components/data/destination-row.tsx"));
    const tag = /<[^>]*data-testid="dest-city"[^>]*>/.exec(row)?.[0] ?? "";
    expect(tag, "dest-city 요소").not.toBe("");
    expect(tag).toMatch(/\bfont-bold\b/);
    expect(tag).not.toMatch(/\bfont-display\b/);
  });
});

describe("글꼴 불러오기 — IBM Plex Sans KR 700 (F2)", () => {
  const layout = read(join(WEB_SRC, "app/layout.tsx"));

  it("굵기 400 · 600 · 700 을 next/font 로 함께 불러옴 (Gasoek One 은 작업 0176 에서 큰 제목을 떠나 로고에만 · 불러오는지는 font-pretendard.test.ts 가 검사)", () => {
    expect(layout).toMatch(/IBM_Plex_Sans_KR\(\{[^}]*weight:\s*\[\s*"400"\s*,\s*"600"\s*,\s*"700"\s*\]/);
  });
});
