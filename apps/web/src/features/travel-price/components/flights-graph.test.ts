// 작업 0181 — /flights 그래프 화면 소스 검사: 값과 무관한 가로 눈금선 없음 · 범례는 누르는 칩(aria-pressed) · 값 없는 선은 라벨을 만들지 않음 · 안내 글 · 비행기 그대로
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const src = code(readFileSync(new URL("./flights-graph.tsx", import.meta.url), "utf8"));

describe("FlightsGraph 소스", () => {
  it("값과 무관한 가로 눈금선 3개를 그리지 않음 (세 선의 단위가 달라 공통 눈금이 없음) · 대신 단위 안내", () => {
    expect(src).not.toMatch(/\[0\.2,\s*0\.5,\s*0\.8\]/);
    expect(src).not.toMatch(/stroke="var\(--hav-line\)"/);
    expect(src).toMatch(/UNIT_NOTE/);
    expect(src).toMatch(/INDEX_BASE_NOTE/);
  });

  it("범례 칩은 button · aria-pressed · 누르면 강조 전환 · 칩 글에 최근 값(legendText)", () => {
    expect(src).toMatch(/<button[^>]*type="button"/);
    expect(src).toMatch(/aria-pressed=\{focus === l\.id\}/);
    expect(src).toMatch(/onClick=\{\(\) => toggle\(l\.id\)\}/);
    expect(src).toMatch(/legendText\(/);
  });

  it("선 굵기 · 불투명도는 lineStyle 로(주인공 3 · 나머지 2 · 옅게) · 값이 없는 선은 목록에 넣지 않아 그리지도 라벨도 만들지도 않음", () => {
    expect(src).toMatch(/lineStyle\(focus,/);
    expect(src).toMatch(/tourVals\.length > 0/);
    expect(src).toMatch(/fxVals\.length > 0/);
  });

  it("최저 · 최고 라벨 글은 seriesStats · extremeTexts(받은 값)에서 · 선 끝 이름 + 최근 값은 endLabelText · 가로축은 axisTicks", () => {
    for (const f of ["seriesStats(", "extremeTexts(", "endLabelText(", "axisTicks(", "spreadLabels("]) expect(src, f).toContain(f);
  });

  it("가로축 눈금 — axisTicks(처음 · 끝은 늘 보임) · 줄바꿈 금지(whitespace-nowrap) · 끝 눈금은 안쪽으로 붙임(-100%)", () => {
    expect(src).toContain("axisTicks(");
    expect(src).toMatch(/data-testid="month-tick" className="absolute whitespace-nowrap"/);
    expect(src).toMatch(/"-100%"/);
  });

  it("3D 비행기 · 노란 점은 그대로 — PlaneRouteLazy 가 항공료 선 점들을 따라감 · 노란 점(--hav-sun)", () => {
    expect(src).toMatch(/PlaneRouteLazy/);
    expect(src).toMatch(/var\(--hav-sun\)/);
    expect(src).toMatch(/data-testid="plane-route"/);
  });
});
