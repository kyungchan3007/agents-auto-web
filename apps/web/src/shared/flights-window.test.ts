// 작업 0229 — 여행 타이밍 '창밖 12달' 소스 검사 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   flights-page.tsx 가 hero 바로 아래(flights-back 앞)에 새 구역 부품을 끼워 넣고 · 부품 파일에 DOM 계약 testid · 움직임 줄이기 · 서버 그림부터 닫힘 CSS 조건이 있는지 · 날개 그림이 없는지
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (p: string) => readFileSync(new URL(p, import.meta.url), "utf8");
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const page = () => code(read("../features/travel-price/components/flights-page.tsx"));
const comp = () => code(read("../features/travel-price/components/window-months.tsx"));

describe("flights-page — hero 바로 아래에 새 구역", () => {
  it("부품을 가져와 쓰고 · 순서는 hero → 창밖 12달 → 표 뒤 구간", () => {
    const s = page();
    expect(s).toMatch(/from "\.\/window-months"/);
    const hero = s.indexOf('data-testid="flights-hero"');
    const win = s.search(/<WindowMonths\b/);
    const back = s.indexOf('data-testid="flights-back"');
    expect(hero).toBeGreaterThan(-1);
    expect(win).toBeGreaterThan(hero);
    expect(back).toBeGreaterThan(win);
  });
  it("기존 hero · 표 뒤 구간 요소 그대로", () => {
    const s = page();
    for (const id of ["flights-hero", "hero-board", "flights-back", "flights-ticket", "yoy-cards", "cheap-board", "flights-strip", "strip-max", "strip-min"]) expect(s, id).toContain(id);
  });
});

describe("window-months — 부품", () => {
  it("export · 계산은 lib/window-months 에서 · 홈 12달과 같은 계산(monthlyAverages)을 씀", () => {
    expect(comp()).toMatch(/export function WindowMonths\(/);
    expect(comp()).toMatch(/from "\.\.\/lib\/window-months"/);
    expect(comp() + code(read("../features/travel-price/lib/window-months.ts"))).toMatch(/monthlyAverages|travelTiming/);
  });
  it("DOM 계약 testid", () => {
    for (const id of ["window-section", "window-view", "window-shade", "window-flap", "window-season", "window-tag", "window-value", "window-cmp", "window-band", "window-month", "window-replay", "window-note"]) expect(comp(), id).toContain(id);
    for (const a of ["data-state", "data-month", "data-value", "data-final", "aria-pressed"]) expect(comp(), a).toContain(a);
  });
  it("움직임 줄이기 · 서버 그림부터 닫힘은 scripting + no-preference 조건(JS 꺼짐 · 움직임 줄이기는 열린 모양)", () => {
    const s = comp() + code(read("../app/globals.css"));
    expect(s).toMatch(/useReducedMotion|prefers-reduced-motion/);
    expect(s).toMatch(/scripting:\s*enabled/);
    expect(s).toMatch(/prefers-reduced-motion:\s*no-preference/);
    expect(s).not.toMatch(/setInterval/);
  });
  it("문구 · 날개 그림 없음", () => {
    const s = comp();
    for (const t of ["창밖으로 보는 12달", "계절이 바뀌는 동안 항공료 지수도 오르내립니다", "이 달의 국제항공료 지수", "국제항공료 지수 · 같은 달 평균", "2020년 = 100", "다시 보기", "달 고르기"]) expect(s, t).toContain(t);
    expect(s).not.toMatch(/날개|wing/i);
  });
});
