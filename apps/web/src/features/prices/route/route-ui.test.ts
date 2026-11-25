// 작업 0360 — 노선 탭 화면 계산: 탭 · ✕ · 새로 고름의 상태 · 정거장 모양(지금 노선과 같은 틀) · 자세히 보기 글 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//
// builder 가 만들 것 — apps/web/src/features/prices/route/route-ui.ts (순수 함수 · tsx · 훅은 부르기만)
//   export type RouteUi = { tab: RouteTabId; removed: boolean }          // removed = 내 여행지를 이 노선에서 뺐나
//   export const onTab = (ui: RouteUi, tab: RouteTabId) => RouteUi       // 다른 탭이면 탭을 바꾸고 removed 를 거둠(false) · 같은 탭을 다시 누르면 그대로(시안 동작)
//   export const onRemove = (ui: RouteUi) => RouteUi                     // ✕ — removed true (탭 그대로)
//   export const onPick = (ui: RouteUi) => RouteUi                       // 여행지를 새로 고름(예산 카드 · 홈 검색) — removed 를 거둠 · 탭 그대로
//   export const mineOf = (picked: string | null | undefined, ui: RouteUi) => string | null   // removed 이거나 고른 게 없으면 null
//   export const detailText = (name: string) => string                   // "프랑스 자세히 보기" (끝 › 는 꾸밈으로 부품이 붙임)
//   export function uiStops(tab: RouteTabId, bands: { rows: { country: string; name: string; relative: number }[] }[], mine: string | null, ranking?: readonly string[]): RouteStop[]
//        price-route-view 의 RouteStop(country · name · value · band · side · index)에 mine: boolean 을 더한 모양 · 값 오름차순 · 한국 side "kr" · 나머지는 번갈아 up · down(rulerPins 와 같음) · index 0부터
//        물가 차이 큰 곳(기본)은 mine 이 없을 때 기존 routeStops(bands) 와 똑같음 (지금 정책 그대로 · 서버 첫 그림이 안 바뀜)
import { type PriceLevels } from "@hav/shared/prices";
import { travelBands } from "@hav/shared/travel";
import { describe, expect, it } from "vitest";
import { routeStops } from "./price-route-view";
import { detailText, mineOf, onPick, onRemove, onTab, uiStops } from "./route-ui";

const lv = (rows: [string, number][]): PriceLevels => ({ base: "KOR", rows: rows.map(([country, relative]) => ({ country, year: 2025, level: relative * 100, relative, source: "worldbank" })) });
const LEVELS = lv([["VNM", 0.46], ["IDN", 0.5], ["THA", 0.58], ["PHL", 0.6], ["MYS", 0.62], ["TWN", 0.95], ["JPN", 0.97], ["HKG", 1.05], ["ESP", 1.11], ["SGP", 1.15], ["ITA", 1.18], ["USA", 1.2], ["DEU", 1.31], ["FRA", 1.34], ["GBR", 1.49], ["CHE", 2.07]]);
const BANDS = travelBands(LEVELS).bands;
const drop = <T extends { mine?: boolean }>(s: T[]) => s.map(({ mine: _m, ...r }) => r);

describe("상태 — 탭 · ✕ · 새로 고름 (작업 0360)", () => {
  it("탭을 바꾸면 ✕ 로 뺀 것이 되살아남(시안 동작) · 같은 탭을 다시 눌러도 그대로", () => {
    expect(onTab({ tab: "spread", removed: true }, "eu")).toEqual({ tab: "eu", removed: false });
    expect(onTab({ tab: "eu", removed: true }, "eu")).toEqual({ tab: "eu", removed: true });
    expect(onTab({ tab: "eu", removed: false }, "sea")).toEqual({ tab: "sea", removed: false });
  });

  it("✕ 는 그 노선에서만 — 탭은 그대로 · removed 만 켬", () => {
    expect(onRemove({ tab: "eu", removed: false })).toEqual({ tab: "eu", removed: true });
  });

  it("여행지를 새로 고르면 뺐던 것이 돌아옴 · 탭 그대로", () => {
    expect(onPick({ tab: "eu", removed: true })).toEqual({ tab: "eu", removed: false });
  });

  it("mineOf — 뺐거나 고른 게 없으면 null · 아니면 고른 나라(✕ 가 고른 여행지 자체를 지우지는 않음)", () => {
    expect(mineOf("JPN", { tab: "eu", removed: false })).toBe("JPN");
    expect(mineOf("JPN", { tab: "eu", removed: true })).toBeNull();
    expect(mineOf(null, { tab: "eu", removed: false })).toBeNull();
    expect(mineOf(undefined, { tab: "eu", removed: false })).toBeNull();
  });
});

describe("정거장 모양 — 지금 노선과 같은 틀 (작업 0360)", () => {
  it("물가 차이 큰 곳(기본) · 내 여행지 없음 = 기존 routeStops 와 똑같음(나라 · 값 · 띠 · 위아래 · 번호)", () => {
    expect(drop(uiStops("spread", BANDS, null))).toEqual(routeStops(BANDS));
  });

  it("한국 side kr · 나머지 up · down 번갈아 · index 0 부터 · 띠 이름(값 90 미만 cheap · 110 초과 exp · 한국 base)", () => {
    const s = uiStops("sea", BANDS, null);
    expect(s.map((x) => x.country)).toEqual(["VNM", "IDN", "THA", "PHL", "MYS", "KR", "SGP"]);
    expect(s.map((x) => x.index)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(s.map((x) => x.side)).toEqual(["up", "down", "up", "down", "up", "kr", "down"]);
    expect(s.map((x) => x.band)).toEqual(["cheap", "cheap", "cheap", "cheap", "cheap", "base", "exp"]);
    expect(s.every((x) => x.mine === false)).toBe(true);
  });

  it("내 여행지가 더해지면 그 정거장 mine true · 번호와 위아래가 다시 매겨짐", () => {
    const s = uiStops("eu", BANDS, "JPN");
    expect(s.map((x) => x.country)).toEqual(["JPN", "KR", "ESP", "ITA", "DEU", "FRA", "GBR", "CHE"]);
    expect(s.map((x) => x.index)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(s.find((x) => x.mine)?.country).toBe("JPN");
    expect(s.filter((x) => x.mine)).toHaveLength(1);
    expect(s.map((x) => x.side)).toEqual(["up", "kr", "down", "up", "down", "up", "down", "up"]);
  });

  it("많이 가는 곳 · 순위를 못 정하면(빈 순위) 물가 차이 큰 곳과 같은 노선", () => {
    expect(drop(uiStops("popular", BANDS, null, []))).toEqual(drop(uiStops("spread", BANDS, null)));
  });

  it("나라가 하나도 없으면 [] (노선 없음 — 지금과 같음)", () => {
    expect(uiStops("sea", [], null)).toEqual([]);
    expect(uiStops("spread", [{ rows: [] }], null)).toEqual([]);
  });
});

describe("자세히 보기 글 (작업 0360)", () => {
  it("'{나라} 자세히 보기' — 끝 › 는 부품이 꾸밈으로 붙임", () => {
    expect(detailText("프랑스")).toBe("프랑스 자세히 보기");
    expect(detailText("아랍에미리트")).toBe("아랍에미리트 자세히 보기");
  });
});
