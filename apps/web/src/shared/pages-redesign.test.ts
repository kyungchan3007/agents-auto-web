// 작업 0170 — 디자인 변경 ③ 나머지 화면: 화면별 구성 · 부품 사용 · 문구 (소스 검사) (테스트 먼저 · 구현 전에는 FAIL 이 정상)
// 순수 함수는 각 lib/*.test.ts (detail-view · flights-copy · prices-copy · calc-copy · team · criteria · geo-cards) · 그리는 모양은 sdd 검증 계획대로 로컬 빌드 캡처 대조
//
// builder · geo 가 할 것 (prd P1~P10 · figma-spec 02~08)
//   공통: 울트라마린 전면 화면 없음 — 이 화면들(통화 · 여행 타이밍 · 여행 물가 · 직구 · 작업실 · 소개 · GEO · 404)에는 data-surface="dark" · "elevated" 가 없음 (Figma 02~08 은 하늘 종이 바탕 · 바다 띠는 홈에만) · 판정은 SignalPin · 고양이 없음(0168 검사)
//   화면에 다는 표시 (e2e 가 찾음): 통화 data-testid="currency-list" · "currency-detail" / 여행 타이밍 "travel-graph" · "plane-route" · "travel-legend" · "yoy-cards" / 여행 물가 "price-bands" · "budget" / 직구 "calc-input" · "calc-result" · "customs-section" · "import-price-section" / 작업실 "status-board" · "team-desks" · "work-flow" / 소개 "criteria-card"(6개) / GEO "geo-cards" · "geo-reading"
//   그 밖의 문구 · 부품 이름은 아래 검사 그대로
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const WEB_SRC = resolve(__dirname, ".."); // apps/web/src
const SHARED_SRC = resolve(WEB_SRC, "../../../packages/shared/src");
const read = (p: string) => readFileSync(p, "utf8");
const codeOf = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
function sources(dir: string): string[] {
  const abs = join(WEB_SRC, dir);
  if (!existsSync(abs)) return [];
  return readdirSync(abs, { withFileTypes: true }).flatMap((d) => {
    const rel = join(dir, d.name);
    if (d.isDirectory()) return sources(rel);
    return /\.tsx?$/.test(d.name) && !/\.test\.tsx?$/.test(d.name) ? [rel] : [];
  });
}
const text = (files: string[]) => files.map((f) => codeOf(read(join(WEB_SRC, f)))).join("\n");
const comps = (feature: string, skip: RegExp | null = null) => sources(`features/${feature}/components`).filter((f) => !skip || !skip.test(f));

const SCREENS = {
  currencies: [...comps("currencies"), ...sources("app/currencies")],
  flights: [...sources("app/flights"), ...comps("travel-price", /price-page|price-bands|budget-planner|travel-index-section/)],
  prices: ["app/prices/page.tsx", "features/travel-price/components/price-page.tsx", "features/travel-price/components/price-bands.tsx", "features/travel-price/components/budget-planner.tsx"],
  calc: [...comps("import-calc"), "app/calc/page.tsx"],
  log: [...comps("log"), "app/log/page.tsx"],
  about: [...comps("about"), "app/about/page.tsx"],
  geo: [...comps("geo"), "app/geo/page.tsx"],
} as const;
const T = Object.fromEntries(Object.entries(SCREENS).map(([k, v]) => [k, text(v.filter((f) => existsSync(join(WEB_SRC, f))))])) as Record<keyof typeof SCREENS, string>;

describe("울트라마린 전면 화면 없음 (P10) — 이 화면들에는 바다 띠(data-surface=\"dark\" · \"elevated\")가 없음", () => {
  it("통화 · 여행 타이밍 · 여행 물가 · 직구 · 작업실 · 소개 · GEO · 404", () => {
    const files = [...Object.values(SCREENS).flat(), "app/not-found.tsx"].filter((f) => existsSync(join(WEB_SRC, f)));
    // 작업 0219: 통화 상세 계산 탑승권(converter.tsx)의 짙은 남색 칸 · 작업 0220: 새 /prices 파랑 첫 면 큰 제목(prices-header.tsx) · 작업 0221 사용자 결정: 새 /calc 파랑 첫 면 머리(calc-page.tsx)만 예외
    const bad = files.filter((f) => !f.endsWith("currencies/components/converter.tsx") && !f.endsWith("travel-price/components/prices-header.tsx") && !f.endsWith("import-calc/components/calc-page.tsx") && /data-surface="(dark|elevated)"/.test(codeOf(read(join(WEB_SRC, f)))));
    expect(bad).toEqual([]);
  });
});

describe("통화 (P1 · SR-CUR-01)", () => {
  it("목록 · 상세 구성 문구 · 순수 함수 · 판정 핀", () => {
    for (const s of ["둘러보기", "실제로 바꿀 때", "1년 최저", "1년 최고", "1년 평균", "이 통화 쓰는 나라 물가 보기"]) expect(T.currencies, s).toContain(s);
    for (const fn of ["yearStats", "currencyListLabel", "pegText"]) expect(T.currencies, fn).toMatch(new RegExp(`\\b${fn}\\b`));
    // 작업 0260: 둘러보기 표에서는 판정 핀(SignalPin)과 "하위 N%" 글을 뺌(사용자 결정) — 판정 표시는 상세 본문이 pinBasis(색 점 + 근거 숫자)로 계속 보임 · 그래서 핀 부품 또는 pinBasis 둘 중 하나가 통화 화면에 있으면 됨
    expect(T.currencies).toMatch(/\b(SignalPin|pinBasis)\b/);
  });

  it("e2e 가 찾는 표시 — currency-list · currency-detail", () => {
    expect(T.currencies).toMatch(/(?:data-testid|testId)="currency-list"/); // 페이드 업 부품(FadeUpGroup)의 testId 로 이어 씀 (작업 0254)
    expect(T.currencies).toMatch(/data-testid="currency-detail"/);
  });
});

describe("여행 타이밍 /flights (P2 · SR-TRV-01)", () => {
  it("그래프 2D(시안 F): 3D 비행기를 쓰지 않음 · 옛 PlaneLazy 도 안 씀", () => {
    expect(T.flights).not.toMatch(/\bPlaneRouteLazy\b|\bPlaneLazy\b/);
  });

  it("그래프 · 범례 · 카드 표시 · 준비 중 문구 (비행기 없음)", () => {
    for (const id of ["travel-graph", "travel-legend", "yoy-cards"]) expect(T.flights, id).toMatch(new RegExp(`data-testid="${id}"`));
    expect(T.flights).not.toMatch(/data-testid="plane-route"/); // 비행기 없음
    expect(T.flights).toContain("준비 중");
    for (const s of ["국제항공료", "해외단체여행비", "원/달러 월평균"]) expect(T.flights, s).toContain(s);
  });

  it("큰 문장 · 카드는 lib 의 순수 함수 + 점 · 글(판정 핀 대신 · 작업 0218)", () => {
    for (const fn of ["flightsHeadline", "yoyCard", "cheapMonthsCard", "flightsBoard", "stripStats"]) expect(T.flights, fn).toMatch(new RegExp(`\\b${fn}\\b`));
    expect(T.flights).toMatch(/data-testid="yoy-dot"/);
    expect(T.flights).not.toMatch(/\bSignalPin\b/);
  });
});

describe("여행 물가 /prices (P3 · SR-PRC-01)", () => {
  const bands = codeOf(read(join(SHARED_SRC, "domain/travel.ts")));

  it("큰 문장(pricesHeadline) · 물가 구간 3칸 이름 · 하루 예산 · 판정 핀 · '환율 없음' 표기는 없어짐(작업 0285)", () => {
    expect(T.prices).toMatch(/\bpricesHeadline\b/);
    for (const s of ["한국보다 싼 곳", "비슷한 곳", "한국보다 비싼 곳"]) expect(`${T.prices}\n${bands}`, s).toContain(s);
    expect(T.prices).toContain("여행 하루 예산");
    expect(T.prices).not.toContain("환율 없음"); // 작업 0285: 환율 자료가 없는 나라는 표기 자체를 지움(자료가 있는 나라의 판정은 그대로)
    expect(T.prices).toMatch(/\bSignalPin\b/);
  });

  it("e2e 가 찾는 표시 (시안 04 에 없는 /flights 링크 한 줄은 요구하지 않음 — 작업 0170 시안 맞춤)", () => {
    expect(T.prices).toMatch(/(?:data-testid|testId)="price-bands"/); // 페이드 업 부품(FadeUpGroup)의 testId 로 이어 씀 (작업 0254)
    expect(T.prices).toMatch(/data-testid="budget"/);
  });
});

describe("직구 계산 /calc (P4 · SR-CALC-01)", () => {
  it("노란 도장(Stamp) · '면세 한도 안' · 큰 문장(calcHeadline)", () => {
    expect(T.calc).toMatch(/\bStamp\b/);
    expect(T.calc).toContain("면세 한도 안");
    expect(T.calc).toMatch(/\bcalcHeadline\b/);
  });

  it("구간 이름 · 기존 안내(예상 금액 IMP-04) 유지 · 표시", () => {
    for (const s of ["이번 주 과세환율", "수입물가와 환율", "예상 금액"]) expect(T.calc, s).toContain(s);
    for (const id of ["calc-input", "calc-result", "customs-section", "import-price-section"]) expect(T.calc, id).toMatch(new RegExp(`data-testid="${id}"`));
  });
});

describe("작업실 /log (P5 · SR-LOG-01)", () => {
  it("큰 제목 · 팀 책상(TEAM_DESKS) · 작업 흐름(WORK_FLOW)", () => {
    expect(T.log).toContain("AI 에이전트 팀이 이 사이트를 만듭니다");
    expect(T.log).toMatch(/\bTEAM_DESKS\b/);
    expect(T.log).toMatch(/\bWORK_FLOW\b/);
    for (const id of ["status-board", "team-desks", "work-flow"]) expect(T.log, id).toMatch(new RegExp(`data-testid="${id}"`));
  });

  it("상태판 칸 이름 · 실패는 주홍(expensive 색)", () => {
    for (const s of ["오늘 환율 수집", "사이트 빌드", "자동 검사 (main)", "열린 작업"]) expect(T.log, s).toContain(s);
    expect(T.log).toMatch(/expensive/);
  });

  it("지금 맡은 일(\"지금:\")을 상수에 박아 두지 않음 — 실제 기록에서만", () => {
    expect(codeOf(readFileSync(join(WEB_SRC, "features/log/lib/team.ts"), "utf8"))).not.toMatch(/지금:/);
  });
});

describe("소개 /about (P7 · SR-ABT-01)", () => {
  it("큰 제목 · 기준 카드 8개(ABOUT_CARDS) 표시", () => {
    expect(T.about).toContain("어떤 자료를, 어떤 기준으로 보여 주나요");
    expect(T.about).toMatch(/\bABOUT_CARDS\b/);
    expect(T.about).toMatch(/data-testid="criteria-card"/);
  });
});

describe("GEO 측정 /geo (P6 · SR-GEO-01) — geo 소유 화면", () => {
  it("자세한 기록을 되살림(작업 0180) — 시안에 없어도 표 · 측정 방법 · 한계가 화면에 있음", () => {
    expect(T.geo).toMatch(/\bgeoDetail\b/);
    for (const id of ["geo-answers", "geo-search", "geo-bots", "geo-method", "geo-questions"]) expect(T.geo, id).toMatch(new RegExp(`(data-testid=|id=)"${id}"`)); // Card 는 id 를 prop 으로 받아 data-testid 로 붙임
    for (const word of ["질문별 결과", "측정한 날마다 기록", "상위 검색어", "AI 봇별 방문", "측정의 한계", "아직 연결하지 않은 자료"]) expect(T.geo, word).toContain(word);
    expect(T.geo).toMatch(/<details/);
    expect(T.geo).toMatch(/\bDataTable\b/);
  });

  it("큰 제목 · 측정 수치 카드(geoCards) · 읽는 법(geoReading)", () => {
    expect(T.geo).toContain("AI 검색에서 이 사이트가 어떻게 쓰이는지 잽니다");
    expect(T.geo).toContain("이 수치를 읽는 법");
    for (const fn of ["geoCards", "geoReading"]) expect(T.geo, fn).toMatch(new RegExp(`\\b${fn}\\b`));
    for (const id of ["geo-cards", "geo-reading"]) expect(T.geo, id).toMatch(new RegExp(`data-testid="${id}"`));
  });
});

describe("디자인 /design · 404 (P8)", () => {
  it("/design 이 새 부품(판정 핀 · 도착지 줄 · 노란 도장)을 진열", () => {
    const design = text(sources("app/design"));
    for (const c of ["SignalPin", "DestinationRow", "Stamp"]) expect(design, c).toMatch(new RegExp(`\\b${c}\\b`));
  });

  it("검색 제외 유지 — PUBLIC_PAGES 에 /design 이 없음", () => {
    expect(read(join(WEB_SRC, "shared/site.ts"))).not.toMatch(/PUBLIC_PAGES[^;]*"\/design"/);
  });
});
