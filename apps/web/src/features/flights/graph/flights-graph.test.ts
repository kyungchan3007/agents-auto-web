// 작업 0181 → 0218 그래프 2D — /flights 그래프 화면 소스 검사: 공통 LineChart · 범례는 누르는 칩(aria-pressed) · 값 없는 선은 라벨을 만들지 않음 · 안내 글 · 비행기 없음
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
// 작업 0312: 계산은 옆 flights-chart.ts 로 — 화면과 함께 읽음
const src = ["./flights-graph.tsx", "./flights-chart.ts"].map((f) => code(readFileSync(new URL(f, import.meta.url), "utf8"))).join("\n");

describe("FlightsGraph 소스", () => {
  it("값과 무관한 가로 눈금선 3개를 그리지 않음 (세 선의 단위가 달라 공통 눈금이 없음) · 대신 단위 안내", () => {
    expect(src).not.toMatch(/\[0\.2,\s*0\.5,\s*0\.8\]/);
    expect(src).not.toMatch(/stroke="var\(--hav-line\)"/);
    expect(src).toMatch(/UNIT_NOTE/);
    expect(src).toMatch(/INDEX_BASE_NOTE/);
  });

  it("범례 칩은 button · aria-pressed · 누르면 강조 전환 · 칩 글은 선 이름만 — 숫자(legendText · 최근 값)를 쓰지 않음 (작업 0261 · 예전: 칩 글에 최근 값)", () => {
    expect(src).toMatch(/<button[^>]*type="button"/);
    expect(src).toMatch(/aria-pressed=\{focus === l\.id\}/);
    expect(src).toMatch(/onClick=\{\(\) => toggle\(l\.id\)\}/);
    expect(src).not.toMatch(/legendText\(/); // 범례 글에 값을 만드는 함수를 부르지 않음
    for (const name of ["국제항공료", "해외단체여행비", "원/달러 월평균"]) expect(src, `범례 이름 ${name}`).toContain(name);
    expect(src).not.toMatch(/원\/달러 월평균\s*[\d$]/); // 이름 뒤에 값이 붙지 않음
  });

  it("그래프 2D(시안 F): 공통 LineChart 로 그림 · 칩 강조는 focus 를 넘김 · 값이 없는 선은 목록에 넣지 않아 그리지도 라벨도 만들지도 않음", () => {
    expect(src).toMatch(/<LineChart/);
    expect(src).toMatch(/focus=\{focus\}/);
    expect(src).toMatch(/tourVals\.length > 0/);
    expect(src).toMatch(/fxVals\.length > 0/);
  });

  it("최저 · 최고 꼬리표 글은 seriesStats · extremeTexts(받은 값)에서 · 끝 말풍선은 이름 + 최근 값(END_NAME · lastOf) · 가로축 눈금은 monthTicks", () => {
    for (const f of ["seriesStats(", "extremeTexts(", "monthTicks(", "END_NAME", "lastOf("]) expect(src, f).toContain(f);
    expect(src).toMatch(/marks=\{(\w+\.)?marks\}/);
  });

  it("가로축 눈금은 LineChart 의 xTicks(날짜 글) · 겹치면 부품이 솎음 — 화면 코드는 줄바꿈 · 위치 계산을 하지 않음", () => {
    expect(src).toMatch(/xTicks=\{/);
    expect(src).not.toMatch(/data-testid="month-tick"/);
  });

  it("3D 비행기는 없음 · 최고(빨강) · 최저(노랑) 점은 항공료 선 위 꼬리표", () => {
    expect(src).not.toMatch(/PlaneRouteLazy|data-testid="plane-route"/);
    expect(src).toMatch(/kind: "max"/);
    expect(src).toMatch(/kind: "min"/);
    expect(src).toMatch(/tone: "red"/);
    expect(src).toMatch(/tone: "sun"/);
  });
});
