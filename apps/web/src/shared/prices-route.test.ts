// 작업 0230 → 0266(스크롤 고정을 풀고 나라 단추로 고르기) — 여행 물가 노선 소스 검사 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   price-page.tsx 가 정적 자(PriceRuler · "한국보다 싼 곳 · 비슷한 곳 · 비싼 곳") 자리에 노선(PriceRoute)을 넣고 · 아래 목록은 그대로 · 부품에 DOM 계약 testid · 움직임 줄이기 · 서버 그림 조건
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (p: string) => readFileSync(new URL(p, import.meta.url), "utf8");
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const page = () => code(read("../features/prices/price-page.tsx"));
const route = () => code(read("../features/prices/route/price-route.tsx"));
const view = () => code(read("../features/prices/price-view.tsx"));
const hook = () => code(read("../features/prices/route/use-price-route.ts"));

describe("price-page · price-view — 정적 자 자리에 노선", () => {
  it("노선 부품을 가져와 쓰고 · 정적 자(PriceRuler)는 더 쓰지 않음", () => {
    const s = page() + view();
    expect(s).toMatch(/from "\.\/route\/price-route"/);
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
    expect(route()).toMatch(/from "\.\/price-route-view"/);
    for (const f of ["routeStops", "routeCardText"]) expect(route(), f).toMatch(new RegExp(`\\b${f}\\b`));
  });
  it("DOM 계약 testid", () => {
    for (const id of ["route-section", "route-stage", "route-title", "route-stops", "route-stop", "route-ruler", "route-pin", "route-kr-tag", "route-plane", "route-card", "route-card-name", "route-card-meta", "route-card-value", "route-card-pct", "route-card-budget", "route-card-signal", "route-next"]) expect(route(), id).toContain(id);
    for (const a of ["data-country", "data-value", "data-active", "data-dir"]) expect(route(), a).toContain(a);
  });
  it("스크롤 고정을 풂 — sticky · 스크롤 진행 계산(routeFrame · ROUTE_STEP_VH · scroll 리스너 · vh 길이)이 없음 · 나라 단추로 고름 (작업 0266 사용자 결정)", () => {
    const s = route() + hook();
    expect(s).not.toMatch(/sticky/);
    expect(s).not.toMatch(/\brouteFrame\b|ROUTE_STEP_VH/);
    expect(s).not.toMatch(/addEventListener\(\s*["']scroll["']|useScroll\b|onScroll=/);
    expect(s).not.toMatch(/\b(36|30)vh\b/);
    expect(route()).toMatch(/onClick=/); // 단추를 눌러 고름
    expect(route()).toContain("route-stop");
  });
  it("휴대폰(760 이하)은 세로 노선 — 가로 단추 줄은 숨기고 PriceRouteList(한 줄씩 · 누르면 펼침 · 다시 누르면 접힘 · 옆으로 밀지 않음)를 보임 · 넓은 화면은 가로 노선 그대로 (작업 0283 · 시안 64 A안 + 접기)", () => {
    expect(route()).toMatch(/from "\.\/price-route-list"/);
    expect(route()).toMatch(/<PriceRouteList\b/);
    expect(route()).toMatch(/route-stops[^\n]*max-\[760px\]:hidden|max-\[760px\]:hidden[^\n]*route-stops/); // 단추 줄은 휴대폰에서 숨김
    expect(route()).toMatch(/hidden max-\[760px\]:block/); // 세로 노선은 휴대폰에서만 보임
    const list = code(read("../features/prices/route/price-route-list.tsx"));
    for (const id of ["route-list", "route-row", "route-row-item", "route-row-plane"]) expect(list, id).toContain(id);
    expect(list).toMatch(/aria-expanded=\{/);
    expect(list).toMatch(/aria-controls=/);
    expect(list).not.toMatch(/overflow-x-auto|overflow-x-scroll/); // 옆으로 밀지 않음
    expect(list).not.toMatch(/sticky/);
  });
  it("같은 값 구간(스페인 111 ↔ 아랍에미리트 111)은 비행기 제자리 — 뛰기(routeHop)를 화면에서 안 씀 (작업 0251 ㄴ)", () => {
    expect(route()).not.toMatch(/routeHop|\bhop\b/);
  });
  it("움직임 줄이기 — useReducedMotion 이나 prefers-reduced-motion 을 존중 · setInterval 없음 (정적 노선을 합칠지는 builder 가 정함)", () => {
    const s = route() + hook() + code(read("../app/globals.css"));
    expect(s).toMatch(/useReducedMotion|prefers-reduced-motion|motion-reduce/);
    expect(s).not.toMatch(/setInterval/);
  });
  it("문구", () => {
    for (const t of ["나라별 물가 노선", "나라 이름을 누르면 그 나라로 갑니다 · 싼 나라에서 한국을 지나 비싼 나라 순서입니다", "한국 100 기준", "물가 (한국 = 100)", "한국과 비교", "하루 예산 예시", "한국에서 하루 100,000원 쓰는 만큼 · 물가 비율로 계산"]) expect(route(), t).toContain(t);
    expect(route(), "환율 없음 표기는 지움(작업 0285)").not.toContain("환율 없음");
    expect(route(), "정거장 번호 글(정거장 N / M)은 지움(작업 0285)").not.toMatch(/정거장\s*\$?\{?[^"']{0,20}\/\s*\$?\{?/);
    for (const old of ["스크롤로 떠나는 물가 노선", "올리면 거꾸로 돌아옵니다"]) expect(route(), `옛 문구 ${old}`).not.toContain(old); // 작업 0266: 새 제목 · 설명으로 바뀜
    expect(route()).not.toContain("한국보다 싼 곳 · 비슷한 곳 · 비싼 곳"); // 정적 자 제목은 없어짐
    expect(route()).not.toMatch(/<Eyebrow>\s*한국 = 100/); // 작업 0251 ㄷ: 제목 위 라벨 없음
  });
});
