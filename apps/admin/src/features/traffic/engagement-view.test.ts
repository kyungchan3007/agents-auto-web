// 작업 0349 — 어드민 /traffic "페이지별 머무름" 표의 계산 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
// 요구: 페이지 · 페이지뷰 · 참여율 · 이탈률 · 다른 페이지로 넘어감(= 세션당 페이지뷰, 가정) + 기준값(시작 날) 대비 오르내림 · 기준값이 없으면 오르내림 칸 비움 · 자료가 없으면 "자료 없음"
//
// builder 가 만들 것 — apps/admin/src/features/traffic/engagement-view.ts (순수 함수 · tsx 는 그리기만)
//   export const ratePercent = (rate: number): string                    // 0.6523 → "65.2%" (소수 한 자리)
//   export const perSessionText = (v: number): string                    // 1.8412 → "1.8쪽"
//   export type Delta = { text: string; dir: "up" | "down" | "same" }
//   export function rateDelta(now: number, before: number): Delta        // 비율 차이를 퍼센트포인트로: "+5.2%p" · "-3.1%p" · 반올림해 0 이면 { text: "변화 없음", dir: "same" }
//   export function perSessionDelta(now: number, before: number): Delta  // "+0.3쪽" · "-0.2쪽" · 0 이면 변화 없음
//   export type EngagementView = { path: string; viewsText: string; engagement: Cell; bounce: Cell; perSession: Cell }
//   type Cell = { text: string; delta: Delta | null }                    // delta: 기준값이 없거나 그 페이지가 기준값에 없으면 null (칸 비움 · 지어내지 않음)
//   export function engagementViews(current: PageEngagement | null, baseline: PageEngagement | null): EngagementView[] | null   // current 가 null 이면 null("자료 없음") · 줄 순서는 받은 순서(페이지뷰 많은 순)
//   export function baselineNote(baseline: PageEngagement | null): string  // "기준값: 2026-10-28 ~ 2026-11-24 (시작 날 고정)" · 없으면 "기준값 없음"
import type { PageEngagement } from "@hav/shared/ga4";
import { describe, expect, it } from "vitest";
import { baselineNote, engagementViews, perSessionDelta, perSessionText, ratePercent, rateDelta } from "./engagement-view";

const page = (path: string, views: number, eng: number, vps: number) => ({ path, views, sessions: Math.round(views / vps), engagementRate: eng, bounceRate: Math.round((1 - eng) * 10000) / 10000, viewsPerSession: vps });
const CUR: PageEngagement = { from: "2026-10-29", to: "2026-11-25", pages: [page("/prices/JPN", 1200, 0.6523, 1.8412), page("/", 4000, 0.55, 1.2), page("/new", 30, 0.4, 1)] };
const BASE: PageEngagement = { from: "2026-10-28", to: "2026-11-24", pages: [page("/", 3900, 0.5, 1.1), page("/prices/JPN", 900, 0.6, 1.5)] };

describe("표기", () => {
  it("비율은 퍼센트 소수 한 자리 · 세션당 페이지뷰는 '쪽'", () => {
    expect(ratePercent(0.6523)).toBe("65.2%");
    expect(ratePercent(0.5)).toBe("50.0%");
    expect(ratePercent(0)).toBe("0.0%");
    expect(ratePercent(1)).toBe("100.0%");
    expect(perSessionText(1.8412)).toBe("1.8쪽");
    expect(perSessionText(1)).toBe("1.0쪽");
  });
});

describe("오르내림", () => {
  it("비율은 퍼센트포인트 차이 — 오르면 + · 내리면 -", () => {
    expect(rateDelta(0.6523, 0.6)).toEqual({ text: "+5.2%p", dir: "up" });
    expect(rateDelta(0.5, 0.531)).toEqual({ text: "-3.1%p", dir: "down" });
  });

  it("반올림해 0 이면 '변화 없음'", () => {
    expect(rateDelta(0.5004, 0.5)).toEqual({ text: "변화 없음", dir: "same" });
    expect(perSessionDelta(1.804, 1.8)).toEqual({ text: "변화 없음", dir: "same" });
  });

  it("세션당 페이지뷰는 쪽 차이", () => {
    expect(perSessionDelta(1.8412, 1.5)).toEqual({ text: "+0.3쪽", dir: "up" });
    expect(perSessionDelta(1.1, 1.3)).toEqual({ text: "-0.2쪽", dir: "down" });
  });
});

describe("표 줄 — 기준값 대비 (요구: 시작 날 기준값과 비교)", () => {
  it("받은 순서 그대로 · 페이지뷰는 쉼표 · 기준값이 있는 페이지는 오르내림", () => {
    const v = engagementViews(CUR, BASE)!;
    expect(v.map((r) => r.path)).toEqual(["/prices/JPN", "/", "/new"]);
    expect(v[0]).toEqual({
      path: "/prices/JPN",
      viewsText: "1,200",
      engagement: { text: "65.2%", delta: { text: "+5.2%p", dir: "up" } },
      bounce: { text: "34.8%", delta: { text: "-5.2%p", dir: "down" } },
      perSession: { text: "1.8쪽", delta: { text: "+0.3쪽", dir: "up" } },
    });
    expect(v[1].engagement).toEqual({ text: "55.0%", delta: { text: "+5.0%p", dir: "up" } });
  });

  it("기준값에 없는 페이지(새 나라 페이지 등)는 그 줄의 오르내림만 비움 — 지어내지 않음", () => {
    const row = engagementViews(CUR, BASE)!.find((r) => r.path === "/new")!;
    expect(row.engagement).toEqual({ text: "40.0%", delta: null });
    expect(row.bounce.delta).toBeNull();
    expect(row.perSession.delta).toBeNull();
  });

  it("기준값이 아예 없으면 모든 줄의 오르내림 칸이 비어 있음 · 값은 그대로", () => {
    const v = engagementViews(CUR, null)!;
    expect(v).toHaveLength(3);
    for (const r of v) for (const c of [r.engagement, r.bounce, r.perSession]) expect(c.delta).toBeNull();
    expect(v[0].engagement.text).toBe("65.2%");
  });

  it("오늘 값이 없으면 null — 화면이 '자료 없음' (기준값만 있어도 표를 만들지 않음)", () => {
    expect(engagementViews(null, BASE)).toBeNull();
    expect(engagementViews(null, null)).toBeNull();
  });

  it("오늘 값 페이지가 비어 있으면 빈 배열 (null 과 구분)", () => {
    expect(engagementViews({ ...CUR, pages: [] }, BASE)).toEqual([]);
  });
});

describe("기준값 안내 글 — 기준 기간을 화면에 보임", () => {
  it("기간 · 시작 날 고정", () => {
    expect(baselineNote(BASE)).toBe("기준값: 2026-10-28 ~ 2026-11-24 (시작 날 고정)");
  });
  it("없으면 '기준값 없음'", () => {
    expect(baselineNote(null)).toBe("기준값 없음");
  });
});
