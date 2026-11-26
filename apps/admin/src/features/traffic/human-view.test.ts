// 작업 0374 — 어드민 /traffic 날짜별 표의 "참여 세션" 칸 · 인스타 유입 줄의 계산 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
// 요구: 날짜별 표에 지금 사용자 수와 같이 참여 세션 기준 값을 보임 · 인스타 유입은 링크(리퍼러)와 utm 을 나눠 보임 · 받지 못한 값은 빈 글(0 · 대시로 채우지 않음)
//
// builder 가 만들 것 — apps/admin/src/features/traffic/human-view.ts (순수 함수 · 그리기는 tsx · tsx 에 계산 없음)
//   export type HumanCells = { engagedText: string; engagedRateText: string; secondsPerUserText: string }
//   export function humanCells(human: HumanReport | null, day: string): HumanCells
//     human 이 null 이거나 그 날 줄이 없으면 세 칸 모두 "" (첫 수집 전 · 그 날 못 받음)
//     engagedText = 참여 세션 쉼표 글(받은 0 은 "0" · null 은 "")
//     engagedRateText = 참여 세션 ÷ 세션 × 100 을 소수 한 자리 + "%" ("60.0%") · 세션이 0 이거나 참여 세션이 null 이면 ""
//     secondsPerUserText = 참여 시간(초) ÷ 사용자 를 소수 한 자리 글("12.5") · 사용자가 0 이거나 참여 시간이 null 이면 ""
//   export type InstagramView = { kind: "link" | "utm"; label: string; sessionsText: string; usersText: string }
//   export function instagramViews(instagram: Ga4Report["instagram"]): InstagramView[] | null
//     null → null(받지 못함 · 표를 그리지 않음) · 아니면 두 줄: link("인스타(링크)") · utm("인스타(utm)") · 쉼표 글 · 받은 0 은 "0"
import type { Ga4Report, HumanReport } from "@hav/shared/ga4";
import { describe, expect, it } from "vitest";
import { humanCells, instagramViews } from "./human-view";

const human = (days: HumanReport["days"]): HumanReport => ({ from: "2026-11-03", to: "2026-11-30", days, devices: [], countries: [] });
const day = (d: string, users: number, sessions: number, engagedSessions: number | null, engagementSeconds: number | null) => ({ day: d, users, sessions, engagedSessions, engagementSeconds });

describe("humanCells — 날짜별 참여 칸 (작업 0374)", () => {
  it("참여 세션(쉼표) · 참여율(소수 한 자리 %) · 사용자당 참여 시간(초, 소수 한 자리)", () => {
    const h = human([day("2026-11-25", 374, 380, 1520, 4675)]);
    expect(humanCells(h, "2026-11-25")).toEqual({ engagedText: "1,520", engagedRateText: "400.0%", secondsPerUserText: "12.5" });
    const h2 = human([day("2026-11-24", 116, 200, 120, 580)]);
    expect(humanCells(h2, "2026-11-24")).toEqual({ engagedText: "120", engagedRateText: "60.0%", secondsPerUserText: "5.0" });
  });

  it("받은 0 은 0 — 참여 세션 0 · 참여율 0.0% · 참여 시간 0.0", () => {
    expect(humanCells(human([day("2026-11-25", 5, 6, 0, 0)]), "2026-11-25")).toEqual({ engagedText: "0", engagedRateText: "0.0%", secondsPerUserText: "0.0" });
  });

  it("받지 못한 값(null)은 빈 글 — 0 · 대시로 채우지 않음", () => {
    expect(humanCells(human([day("2026-11-25", 5, 6, null, null)]), "2026-11-25")).toEqual({ engagedText: "", engagedRateText: "", secondsPerUserText: "" });
    expect(humanCells(human([day("2026-11-25", 5, 6, 3, null)]), "2026-11-25").secondsPerUserText).toBe("");
    expect(humanCells(human([day("2026-11-25", 5, 6, null, 30)]), "2026-11-25").engagedRateText).toBe("");
  });

  it("0 으로 나눌 때는 빈 글 — 세션 0 이면 참여율 · 사용자 0 이면 사용자당 시간 (NaN · Infinity 가 화면에 나오지 않음)", () => {
    const c = humanCells(human([day("2026-11-25", 0, 0, 0, 0)]), "2026-11-25");
    expect(c).toEqual({ engagedText: "0", engagedRateText: "", secondsPerUserText: "" });
    for (const v of Object.values(c)) expect(v).not.toMatch(/NaN|Infinity/);
  });

  it("자료가 없거나(null) 그 날 줄이 없으면 세 칸 모두 빈 글 (첫 수집 전 · 그 날 못 받음)", () => {
    const empty = { engagedText: "", engagedRateText: "", secondsPerUserText: "" };
    expect(humanCells(null, "2026-11-25")).toEqual(empty);
    expect(humanCells(human([day("2026-11-24", 1, 1, 1, 1)]), "2026-11-25")).toEqual(empty);
  });

  it("다른 날 값이 섞이지 않음", () => {
    const h = human([day("2026-11-24", 10, 10, 1, 10), day("2026-11-25", 20, 20, 2, 40)]);
    expect(humanCells(h, "2026-11-25").engagedText).toBe("2");
    expect(humanCells(h, "2026-11-24").engagedText).toBe("1");
  });
});

describe("instagramViews — 인스타 유입 두 줄 (작업 0374)", () => {
  it("받지 못했으면(null) null — 표를 그리지 않음", () => {
    expect(instagramViews(null)).toBeNull();
  });

  it("링크(리퍼러)와 utm 을 나눈 두 줄 · 이름 · 쉼표 숫자", () => {
    expect(instagramViews({ link: { sessions: 1234, users: 1000 }, utm: { sessions: 56, users: 40 } })).toEqual([
      { kind: "link", label: "인스타(링크)", sessionsText: "1,234", usersText: "1,000" },
      { kind: "utm", label: "인스타(utm)", sessionsText: "56", usersText: "40" },
    ]);
  });

  it("받은 0 은 0 으로 보임", () => {
    const v = instagramViews({ link: { sessions: 0, users: 0 }, utm: { sessions: 0, users: 0 } })!;
    expect(v.map((x) => [x.sessionsText, x.usersText])).toEqual([["0", "0"], ["0", "0"]]);
  });
});
