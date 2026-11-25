// 작업 0359 — 어드민 /traffic "버튼 클릭" 표의 계산 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
// 요구: 버튼 이름(한국어) · 있는 페이지 · 최근 28일 클릭 수 · 누른 사람 수 · 하루 평균 · 보내기 시작한 날을 표 위에 · 그 전 날짜는 0 이 아니라 "기록 전" · 받지 못한 값은 빈 값 · 이유(지어내지 않음)
// 하루 평균(prd 가정): 보내기 시작한 날부터 기간 끝(어제)까지의 날 수로 나눔 · 28일이 안 차면 실제 날 수 · 기간 시작이 더 늦으면 기간 시작부터
//
// builder 가 만들 것 — apps/admin/src/features/traffic/click-view.ts (순수 함수 · 그리기는 click-table.tsx)
//   export function clickDays(range: { from: string; to: string }, since: string): number     // max(from, since) ~ to 양끝 포함 날 수 · since 가 to 보다 뒤면 0
//   export function perDayText(count: number, days: number): string                            // days 0 → "기록 전" · 아니면 count ÷ days 를 소수 한 자리 글로("2.0" · "0.5")
//   export type ClickView = { name: string; label: string; page: string; countText: string; usersText: string; perDayText: string }
//   export function clickViews(data: ClickEvents | null): ClickView[] | null
//     null → null(자료 없음) · 이벤트 표(CLICK_EVENTS) 열두 개가 모두 한 줄씩 · 보고에 없는 이벤트는 count 0 · users 0(받은 보고에서 안 나온 것 = 0번 눌림) · 많이 눌린 순(같으면 이벤트 표 순서)
//     숫자는 쉼표 글 · days 가 0 이면(시작 날이 기간 끝보다 뒤) 세 칸(클릭 수 · 누른 사람 수 · 하루 평균) 모두 "기록 전"
//   export const sinceText = (since: string) => string                                         // "이벤트를 보내기 시작한 날: 2026-11-26" (그 전 날짜는 기록 전)
import type { ClickEvents } from "@hav/shared/ga4";
import { CLICK_EVENTS } from "@hav/shared/click-events";
import { describe, expect, it } from "vitest";
import { clickDays, clickViews, perDayText, sinceText } from "./click-view";

const data = (events: { name: string; count: number; users: number }[], o: Partial<ClickEvents> = {}): ClickEvents => ({ from: "2026-11-03", to: "2026-11-30", since: "2026-11-26", events, ...o });

describe("clickDays — 하루 평균의 날 수 (작업 0359)", () => {
  it("보내기 시작한 날부터 기간 끝까지 양끝 포함", () => {
    expect(clickDays({ from: "2026-11-03", to: "2026-11-30" }, "2026-11-26")).toBe(5);
    expect(clickDays({ from: "2026-11-03", to: "2026-11-30" }, "2026-11-30")).toBe(1);
  });
  it("28일이 넘게 지났으면 기간 전체(28일)", () => {
    expect(clickDays({ from: "2026-11-03", to: "2026-11-30" }, "2026-10-01")).toBe(28);
  });
  it("시작 날이 기간 끝보다 뒤면 0 (아직 기록 전)", () => {
    expect(clickDays({ from: "2026-11-03", to: "2026-11-30" }, "2026-12-01")).toBe(0);
  });
});

describe("perDayText (작업 0359)", () => {
  it("소수 한 자리 · 0 도 그대로 · 날 수가 0 이면 기록 전", () => {
    expect(perDayText(10, 5)).toBe("2.0");
    expect(perDayText(1, 2)).toBe("0.5");
    expect(perDayText(0, 5)).toBe("0.0");
    expect(perDayText(7, 3)).toBe("2.3");
    expect(perDayText(5, 0)).toBe("기록 전");
  });
});

describe("clickViews (작업 0359)", () => {
  it("자료가 없으면 null (표 없음 · 자료 없음)", () => {
    expect(clickViews(null)).toBeNull();
  });

  it("이벤트 표 열두 개가 한 줄씩 · 한국어 이름 · 있는 페이지 · 쉼표 숫자 · 하루 평균", () => {
    const v = clickViews(data([{ name: "country_all_prices", count: 1250, users: 800 }]))!;
    expect(v).toHaveLength(12);
    const row = v.find((r) => r.name === "country_all_prices")!;
    const t = CLICK_EVENTS.find((e) => e.name === "country_all_prices")!;
    expect(row).toMatchObject({ label: t.label, page: t.page, countText: "1,250", usersText: "800", perDayText: "250.0" }); // 1250 ÷ 5일
  });

  it("보고에 없는 이벤트는 0 번(시작 날 이후라면 0 이 맞음)", () => {
    const v = clickViews(data([{ name: "country_all_prices", count: 3, users: 2 }]))!;
    const zero = v.find((r) => r.name === "empty_next")!;
    expect(zero).toMatchObject({ countText: "0", usersText: "0", perDayText: "0.0" });
  });

  it("많이 눌린 순 · 같으면 이벤트 표 순서", () => {
    const v = clickViews(data([{ name: "fx_other_pick", count: 5, users: 3 }, { name: "country_compare", count: 20, users: 9 }, { name: "home_country_link", count: 5, users: 4 }]))!;
    expect(v.slice(0, 3).map((r) => r.name)).toEqual(["country_compare", "home_country_link", "fx_other_pick"]); // 5 · 5 는 표 순서(home_country_link 가 fx_other_pick 보다 앞)
    expect(v.slice(3).every((r) => r.countText === "0")).toBe(true);
  });

  it("시작 날이 기간 끝보다 뒤면 세 칸 모두 '기록 전' — 0 으로 보이지 않음", () => {
    const v = clickViews(data([], { since: "2026-12-05" }))!;
    expect(v).toHaveLength(12);
    for (const r of v) expect([r.countText, r.usersText, r.perDayText], r.name).toEqual(["기록 전", "기록 전", "기록 전"]);
  });
});

describe("sinceText (작업 0359)", () => {
  it("표 위 한 줄", () => {
    expect(sinceText("2026-11-26")).toBe("이벤트를 보내기 시작한 날: 2026-11-26");
  });
});
