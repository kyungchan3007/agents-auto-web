// 작업 0175 추가 요청 — 통화 상세 그래프의 최고 · 최저 금액 (소스 검사) (테스트 먼저 · 구현 전에는 FAIL 이 정상)
// C1 최고 · 최저 지점 점 + 금액 라벨("최고 1,554.4원" 비쌈 색 · "최저 1,322.6원" 쌈 색) · C2 기간 버튼을 바꾸면 그 기간 값 · C3 오늘 점 · 평균 점선은 그대로 · 겹치면 비킴 · C4 카드와 같은 계산
//
// builder 가 할 것
//   packages/ui/src/lib/extreme-labels.ts: placeExtremeLabels (extreme-labels.test.ts)
//   packages/ui/src/components/data/year-chart.tsx: 최고 · 최저 점 + 라벨(시안 모양 compact 에서도 · 예전엔 compact 가 뺐음) — placeExtremeLabels 로 위치 · data-testid="extreme-max"(비쌈 색) · "extreme-min"(쌈 색) · 오늘 점(판정 색) · 평균 점선 · aria-label 의 최저 · 최고 글은 유지 · 라벨 글은 props 로 받음(extremeText: { max: string; min: string })
//   apps/web/src/features/currencies/components/period-chart.tsx: 고른 기간(shown)의 extremeDays · extremeLabelText 로 글을 만들어 YearChart 에 넘김 — 카드(yearStats)와 같은 값
//   e2e: pages.spec.ts "그래프 최고 · 최저 금액" (실행은 lead)
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const WEB_SRC = resolve(__dirname, ".."); // apps/web/src
const UI_SRC = resolve(WEB_SRC, "../../../packages/ui/src");
const codeOf = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const read = (p: string) => codeOf(readFileSync(p, "utf8"));
const chart = () => read(join(UI_SRC, "components/data/year-chart.tsx"));
const period = () => read(join(WEB_SRC, "features/currencies/components/period-chart.tsx"));

describe("YearChart — 최고 · 최저 점과 금액 라벨", () => {
  it("라벨 위치는 placeExtremeLabels 로 (겹치면 비킴 · 화면 안)", () => {
    expect(chart()).toMatch(/placeExtremeLabels\(/);
    expect(chart()).toMatch(/from\s*"\.\.\/\.\.\/lib\/extreme-labels"/);
  });

  it("e2e 가 찾는 표시 — extreme-max · extreme-min", () => {
    expect(chart()).toMatch(/data-testid="extreme-max"/);
    expect(chart()).toMatch(/data-testid="extreme-min"/);
  });

  it("색 — 최고는 비쌈(expensive) · 최저는 쌈(cheap)", () => {
    const c = chart();
    const tag = (id: string) => new RegExp(`<[^>]*data-testid="${id}"[^>]*>`).exec(c)?.[0] ?? "";
    expect(tag("extreme-max")).toMatch(/expensive/);
    expect(tag("extreme-min")).toMatch(/cheap/);
  });

  it("시안 모양(compact)에서도 보임 — 최고 · 최저 라벨이 !compact 조건 안에 있지 않음 (예전엔 compact 가 뺐음)", () => {
    const c = chart();
    for (const id of ["extreme-max", "extreme-min"]) {
      const i = c.indexOf(`data-testid="${id}"`);
      expect(i, id).toBeGreaterThan(0);
      expect(c.slice(Math.max(0, i - 160), i), `${id} 앞`).not.toMatch(/!compact\s*&&/);
    }
    expect(c).not.toMatch(/!compact\s*&&\s*<(circle|Label)\b[^>]*(max|min)/);
  });

  it("그대로 — 오늘 점(판정 색) · 평균 점선 · 접근성 이름(aria-label)의 최저 · 최고", () => {
    const c = chart();
    expect(c).toMatch(/lastTone/);
    expect(c).toMatch(/strokeDasharray/);
    expect(c).toMatch(/aria-label=\{label\}/);
    expect(c).toMatch(/최저 \$\{c\.min\.date\}/);
    expect(c).toMatch(/최고 \$\{c\.max\.date\}/);
  });

  it("라벨 글은 YearChart 안에서 만들지 않고 props(extremeText)로 받음 — 단위 · 형식은 통화 화면 몫", () => {
    expect(chart()).toMatch(/extremeText\??:\s*\{\s*max:\s*string\s*;\s*min:\s*string\s*\}/);
  });
});

describe("PeriodChart — 고른 기간의 최고 · 최저 (C2 · C4)", () => {
  it("기간을 자른 값(shown)으로 extremeDays · extremeLabelText 를 만들어 넘김", () => {
    expect(period()).toMatch(/extremeDays\(\s*shown\s*\)/);
    expect(period()).toMatch(/extremeLabelText\(/);
    expect(period()).toMatch(/marks=\{marks\}/); // 그래프 2D(시안 F): 최고 · 최저 글은 공통 LineChart 의 marks(꼬리표)로 넘김
  });

  it("카드와 같은 계산 — 같은 yearStats 계열 함수를 씀(detail-view)", () => {
    expect(period()).toMatch(/from\s*"\.\.\/lib\/detail-view"/);
  });
});
