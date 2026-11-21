// 작업 0230 — 여행 물가 스크롤 노선 소스 검사 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   price-page.tsx 가 정적 자(PriceRuler · "한국보다 싼 곳 · 비슷한 곳 · 비싼 곳") 자리에 노선(PriceRoute)을 넣고 · 아래 목록은 그대로 · 부품에 DOM 계약 testid · 움직임 줄이기 · 서버 그림 조건
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (p: string) => readFileSync(new URL(p, import.meta.url), "utf8");
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const page = () => code(read("../features/travel-price/components/price-page.tsx"));
const route = () => code(read("../features/travel-price/components/price-route.tsx"));
const view = () => code(read("../features/travel-price/components/price-view.tsx"));

describe("price-page · price-view — 정적 자 자리에 노선", () => {
  it("노선 부품을 가져와 쓰고 · 정적 자(PriceRuler)는 더 쓰지 않음", () => {
    const s = page() + view();
    expect(s).toMatch(/from "\.\/price-route"/);
    expect(s).toMatch(/<PriceRoute\b/);
    expect(s).not.toMatch(/<PriceRuler\b/);
  });
  it("기존 요소 그대로 — 머리 · 예산 카드 · 세 칸 목록 · 자료 없음", () => {
    const s = page() + view();
    for (const t of ["PricesHeader", "BudgetPlanner", "PriceBands", "prices-band", "PriceView"]) expect(s, t).toContain(t);
  });
});

describe("price-route — 부품", () => {
  it("export · 정거장은 lib/price-route 에서 · 핀(rulerPins)과 같은 나라", () => {
    expect(route()).toMatch(/export function PriceRoute\(/);
    expect(route()).toMatch(/from "\.\.\/lib\/price-route"/);
    for (const f of ["routeStops", "routeFrame", "routeValue", "routeActive", "routeCardText"]) expect(route(), f).toMatch(new RegExp(`\\b${f}\\b`));
  });
  it("DOM 계약 testid", () => {
    for (const id of ["route-section", "route-stage", "route-title", "route-stops", "route-stop", "route-ruler", "route-pin", "route-kr-tag", "route-plane", "route-card", "route-card-name", "route-card-meta", "route-card-value", "route-card-pct", "route-card-budget", "route-card-signal", "route-next"]) expect(route(), id).toContain(id);
    for (const a of ["data-country", "data-value", "data-active", "data-moving", "data-dir"]) expect(route(), a).toContain(a);
  });
  it("메뉴 띠 바로 아래에 고정(sticky · --hav-nav-h) · 정거장 사이 스크롤 길이 vh", () => {
    const s = route() + code(read("../app/globals.css"));
    expect(s).toMatch(/sticky/);
    expect(s).toMatch(/--hav-nav-h/);
    expect(s).toMatch(/ROUTE_STEP_VH|36vh|30vh|vh/);
    expect(s).not.toMatch(/justify-center[^"]*sticky|sticky[^"]*justify-center/); // 세로 가운데가 아님
  });
  it("같은 값 구간(스페인 111 ↔ 아랍에미리트 111)은 비행기 제자리 — 뛰기(routeHop)를 화면에서 안 씀 (작업 0251 ㄴ)", () => {
    expect(route()).not.toMatch(/routeHop|\bhop\b/);
  });
  it("움직임 줄이기 · 서버 그림은 정적 노선(scripting + no-preference 에서만 고정 · 긴 스크롤)", () => {
    const s = route() + code(read("../app/globals.css"));
    expect(s).toMatch(/useReducedMotion|prefers-reduced-motion/);
    expect(s).toMatch(/scripting:\s*enabled/);
    expect(s).toMatch(/prefers-reduced-motion:\s*no-preference/);
    expect(s).not.toMatch(/setInterval/);
  });
  it("문구", () => {
    for (const t of ["스크롤로 떠나는 물가 노선", "내릴수록 싼 나라에서 한국을 지나 비싼 나라로 갑니다", "올리면 거꾸로 돌아옵니다", "한국 100 기준", "물가 (한국 = 100)", "한국과 비교", "하루 예산 예시", "한국에서 하루 100,000원 쓰는 만큼 · 물가 비율로 계산", "환율 없음"]) expect(route(), t).toContain(t);
    expect(route()).not.toContain("한국보다 싼 곳 · 비슷한 곳 · 비싼 곳"); // 정적 자 제목은 없어짐
    expect(route()).not.toMatch(/<Eyebrow>\s*한국 = 100/); // 작업 0251 ㄷ: 제목 위 라벨 없음
  });
});
