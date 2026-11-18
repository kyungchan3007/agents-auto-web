// 작업 0169 — 디자인 변경 ② 홈: 구성 · 자료 · 문구 · 죽은 코드 (소스 검사) (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//
// builder 가 할 것 (prd H1~H10 · sdd)
//   app/page.tsx — api.indicator("kosis-cpi:air-fare", 60) 를 받음 · 새 홈이 안 쓰는 priceLevels · 1년 USD 기록 · changes 는 받지 않음 (빌드 때 D1 읽기도 줄어듦)
//   features/home/lib/travel-timing.ts(travelTiming · travelTimingCopy) · destinations.ts(cheapestDestination · destinationRows · cheapestCopy · NO_RATE_COPY) — 각 *.test.ts 머리 주석
//   features/home/components/** 위 → 아래: 여행 타이밍(선 그래프 + 비행기) → 오늘 환율 바다 띠(id="today" · data-surface="dark" · 3D 지구 + 이번 주 가장 싼 곳) → 도착지별 환전 타이밍(도착지 줄 4개 · 줄 전체가 /currencies/{통화} 링크) → 바닥 띠(자료 출처 · 비행기 모델 출처)
//   e2e 가 찾는 표시: data-testid="travel-graph"(선 그래프) · data-testid="plane-route"(비행기 자리) — 지수가 없으면 둘 다 그리지 않음 · id="today" · id="destinations"(도착지별 환전 타이밍)
//   쓰지 않는 기존 장면(hero-section · trips-section · trip-scenes · calc-section · year-section · currencies-section 중)은 지움 — 이 파일의 "죽은 코드" 검사
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const WEB_SRC = resolve(__dirname, ".."); // apps/web/src
const read = (p: string) => readFileSync(join(WEB_SRC, p), "utf8");
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

const COMPONENTS = sources("features/home/components");
const HOME_UI = [...COMPONENTS, "app/page.tsx"].map((f) => codeOf(read(f))).join("\n");
const HOME_ALL = [...COMPONENTS, ...sources("features/home/lib"), "app/page.tsx"].map((f) => codeOf(read(f))).join("\n");

describe("홈 자료 — app/page.tsx", () => {
  const page = codeOf(read("app/page.tsx"));

  it("국제항공료 지수(kosis-cpi:air-fare)를 받음", () => {
    expect(page).toMatch(/api\.indicator\(\s*"kosis-cpi:air-fare"/);
  });

  it("새 홈이 안 쓰는 자료는 받지 않음 — 1년 USD 기록 · 1개월 변화 (물가 수준 priceLevels 는 작업 0185 공항 인트로 2단계 '물가'가 씀 · intro-structure.test.ts 가 받는지 검사)", () => {
    expect(page).not.toMatch(/api\.changes/);
    expect(page).not.toMatch(/api\.history\(/);
  });

  it("오늘 환율 · 신호는 그대로 받음", () => {
    expect(page).toMatch(/api\.latest\(\)/);
    expect(page).toMatch(/api\.signals\(\)/);
  });
});

describe("홈 구성 — 순서 · 구간", () => {
  it("오늘 환율 구간: id=\"today\" 가 한 번 (작업 0177: 울트라마린 전체 띠는 없어지고 출발 안내판으로 — home-flap-board.test.ts 가 검사)", () => {
    expect(HOME_UI.match(/id="today"/g)?.length).toBe(1);
    expect(HOME_UI).not.toMatch(/<(section|div)\b[^>]*(id="today"[^>]*data-surface="dark"|data-surface="dark"[^>]*id="today")/);
  });

  it("도착지별 환전 타이밍 구간: id=\"destinations\" · 제목", () => {
    expect(HOME_UI).toMatch(/id="destinations"/);
    expect(HOME_UI).toContain("도착지별 환전 타이밍");
  });

  it("여행 타이밍 라벨 · 12달 막대 · 안내판 · 도착지 목록 컴포넌트를 씀 (지구 · 3D 비행 경로는 없앰 · 작업 0217)", () => {
    expect(HOME_UI).toContain("여행 타이밍");
    expect(HOME_UI).toMatch(/\bMonthBars\b/); // 그래프 2D(시안 F): 12달 막대는 공통 부품 MonthBars — 표시 data-testid="year-bars" 는 그 부품 안
    expect(readFileSync(join(__dirname, "../../../../packages/ui/src/components/data/month-bars.tsx"), "utf8")).toMatch(/data-testid="year-bars"/);
    expect(HOME_UI).not.toMatch(/data-testid="plane-route"|data-testid="travel-graph"/);
    expect(HOME_UI).not.toMatch(/\bGlobeLazy\b/); // 작업 0177 수정: 3D 지구를 없앰
    expect(HOME_UI).toMatch(/\bFlapBoard\b/); // 작업 0177 출발 안내판
    expect(HOME_UI).not.toMatch(/\bPlaneRouteLazy\b/);
    expect(HOME_UI).toMatch(/\bDestinationTable\b/);
  });

  it("계산은 lib 의 순수 함수로 — travelTiming · travelTimingCopy · cheapestDestination · cheapestCopy · destinationRows", () => {
    for (const fn of ["travelTiming", "travelTimingCopy", "cheapestDestination", "cheapestCopy", "destinationRows"]) expect(HOME_ALL, fn).toMatch(new RegExp(`\\b${fn}\\b`));
  });

  it("도착지 줄 전체가 통화 상세 링크 (/currencies/{통화})", () => {
    expect(HOME_UI).toMatch(/href=\{[^}]*\.href\b/); // destinationRows 가 만든 row.href
  });
});

describe("도착지 줄 핀 근거 숫자 (작업 0170 추가 요청)", () => {
  it("목록 줄이 pinText('하위 12% · 쌈' 근거 숫자)와 막대 위치(position)를 그림 — 옛 pct 가 아님 (작업 0217)", () => {
    expect(HOME_UI).toMatch(/\.pinText\b/);
    expect(HOME_UI).toMatch(/data-position=/);
    expect(HOME_UI).not.toMatch(/\bpct=/);
  });
});

describe("자료가 없을 때 문구 (H1 · H8) — 숫자를 지어내지 않음", () => {
  it("오늘 환율이 없을 때 · 신호가 없을 때 문구가 코드에 있음 (lib 의 NO_RATE_COPY · '신호 없음')", () => {
    expect(HOME_ALL).toMatch(/NO_RATE_COPY|오늘 환율을 아직 받지 못했습니다/);
    expect(HOME_ALL).toContain("신호 없음");
    expect(HOME_ALL).toContain("국제항공료 지수를 아직 받지 못했습니다");
  });

  it("Figma 예시 숫자 · '예시 숫자입니다' 가 코드에 없음 (912 · 1,486 · 1,382 · 39.8 · 4.1%)", () => {
    expect(HOME_ALL).not.toMatch(/\b912\b|1,486|1,382|39\.8|4\.1%|예시 숫자/);
  });
});

describe("바닥 띠 — 자료 출처 · 비행기 모델 출처 (H9)", () => {
  it("한국수출입은행 · 통계청 · 관세청 · 한국은행 · 세계은행", () => {
    for (const name of ["한국수출입은행", "통계청", "관세청", "한국은행", "세계은행"]) expect(HOME_UI, name).toContain(name);
  });

  it("홈에는 3D 비행기가 없으므로 비행기 모델 출처 줄도 없음 (그래프 2D · lead 지시) — 인트로(intro.tsx)는 비행기를 쓰므로 거기서 그대로 보임", () => {
    expect(HOME_UI).not.toMatch(/PLANE_CREDIT|Poly by Google/);
    expect(HOME_ALL).not.toMatch(/PLANE_CREDIT|Poly by Google|CC-BY 4\.0/);
  });
});

describe("죽은 코드를 남기지 않음 (H10)", () => {
  it("features/home/components · hooks 의 모든 파일을 다른 코드가 가져다 씀", () => {
    const all = sources(".");
    const owned = [...sources("features/home/components"), ...sources("features/home/hooks")];
    const unused = owned.filter((f) => {
      const stem = f.replace(/\.tsx?$/, "");
      const base = stem.split("/").pop() as string;
      return !all.some((o) => o !== f && new RegExp(`from\\s*"[^"]*/${base}"`).test(read(o)));
    });
    expect(unused).toEqual([]);
  });
});

// 작업 0217 사용자 지적 — 표 가장자리 홈은 파인 홈 (시안 B/home.html .perf: 표 overflow hidden 이 홈을 카드 안쪽으로 자름 · 홈 색 = 뒤 바탕 파랑 · 파랑 면 끝 = 홈 아래 끝)
describe("탑승권 홈 — 파인 홈", () => {
  const code = codeOf(read("features/home/components/ticket.tsx"));

  it("홈은 가짜 요소(before · after)가 아니라 진짜 요소 둘(data-testid=ticket-hole) · 틀(ticket-hole-clip)이 overflow-hidden 으로 카드 안쪽에서 자름 · 절취선 표시(ticket-perf)", () => {
    expect(code).toMatch(/data-testid="ticket-hole-clip"[^>]*overflow-hidden|overflow-hidden[^>]*data-testid="ticket-hole-clip"/);
    expect((code.match(/data-testid="ticket-hole"/g) ?? []).length).toBe(2);
    expect(code).toMatch(/data-testid="ticket-perf"/);
    expect(code).not.toMatch(/before:rounded-full|after:rounded-full/);
  });

  it("홈 색은 파랑 면 토큰(bg-pin-cheap) — 뒤 바탕과 같은 색", () => {
    for (const m of code.matchAll(/<[^>]*data-testid="ticket-hole"[^>]*>/g)) expect(m[0]).toMatch(/bg-pin-cheap/);
  });

  it("파랑 띠가 첫 줄보다 홈 아래 끝(절취선 + 13px)까지 내려옴 — 띠에 음수 아래 여백(-mb-)", () => {
    expect(/<div[^>]*data-testid="ticket-band"[^>]*>/.exec(code)?.[0] ?? "").toMatch(/-mb-/);
  });
});
