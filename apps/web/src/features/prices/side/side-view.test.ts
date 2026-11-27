// 작업 0361 2단계 — 여행 물가 목록 → 나라 사이드바 · 시트의 계산 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
// 요구(request.md): 사이드바(1024px 이상) · 바텀 시트(1024px 미만) · 넓은 화면 오른쪽 420px 에 뒤를 덮지 않고 밀어냄 · 뒤 스크롤 잠그지 않음 · 좁은 화면 아래 78% 시트 · 뒤를 덮고 스크롤 잠금 ·
//   연 채로 ‹ › 로 앞뒤 나라(지금 순서 · "n / 전체") · 내용: 경로 "여행 물가 › 나라" · 오늘 통화 한 줄 답(없으면 "아직 환율을 받지 않아 물가만") · 맨 아래 "{나라} 물가 자세히 보기 ›"
//
// 작업 0397: rateLine(오늘 기준 한 줄 답)은 지움 — 사이드 시트에도 한 줄 답 없음
//
// builder 가 만들 것 — apps/web/src/features/prices/side/side-view.ts (순수 함수 · tsx 는 그리기만)
//   export const SIDE_BREAKPOINT = 1024            // 이 폭 이상이 사이드바
//   export const SIDE_WIDTH = 420                  // 여행 물가 사이드바 폭(px) — 공통 부품(통화 상세는 440)에 선택 값으로 넘김
//   export const SHEET_HEIGHT_PCT = 78             // 좁은 화면 시트 높이(화면 높이의 %) — 공통 부품(통화 상세는 85)에 선택 값으로 넘김
//   export function panelModeOf(innerWidth: number): { kind: "side" | "sheet"; backdrop: boolean; lock: boolean }
//        1024 이상 = side(막 없음 · 잠금 없음 · 본문을 밀어냄) · 미만 = sheet(막 있음 · 잠금 있음)
//   export function neighbors(order: string[], code: string): { index: number; prev: string | null; next: string | null }   // order = 지금 목록 순서의 나라 코드 · 없으면 index -1 · prev · next null
//   export function posText(order: string[], code: string): string   // "3 / 39" · 순서에 없으면 ""
//   export function swapDir(order: string[], from: string, to: string): 1 | -1   // 뒤로(순서가 더 뒤) = 1 · 앞으로 = -1 (내용이 옆으로 바뀌는 방향) · 같거나 모르면 1
//   export function rateLine(p: { oneLine: { label: string; text: string } | null; currency: string | null }): { label: string; text: string; none: boolean }
//        한 줄 답이 있으면 그대로(none false) · 없으면 { label: "오늘 기준 한 줄 답", text: "이 나라 통화(THB)는 아직 환율을 받지 않아 물가만 보여 드립니다" · 통화가 없으면 "이 나라 통화는 아직 …", none: true }
//   export const crumbText = (name: string) => string        // "여행 물가 › 일본"
//   export const detailLinkText = (name: string) => string   // "일본 물가 자세히 보기" (끝 › 는 꾸밈으로 붙임)
import { describe, expect, it } from "vitest";
import { SHEET_HEIGHT_PCT, SIDE_BREAKPOINT, SIDE_WIDTH, crumbText, detailLinkText, neighbors, panelModeOf, posText, swapDir } from "./side-view";

describe("사이드바 · 시트 갈림 (작업 0361)", () => {
  it("상수: 1024px · 폭 420 · 시트 높이 78%", () => {
    expect(SIDE_BREAKPOINT).toBe(1024);
    expect(SIDE_WIDTH).toBe(420);
    expect(SHEET_HEIGHT_PCT).toBe(78);
  });

  it("1024 이상은 사이드바(막 없음 · 잠금 없음) · 미만은 시트(막 · 잠금)", () => {
    for (const w of [1024, 1100, 1440, 1920]) expect(panelModeOf(w), String(w)).toEqual({ kind: "side", backdrop: false, lock: false });
    for (const w of [1023, 900, 768, 390, 375, 0]) expect(panelModeOf(w), String(w)).toEqual({ kind: "sheet", backdrop: true, lock: true });
  });
});

describe("‹ › · n / 전체 (작업 0361)", () => {
  const order = ["VNM", "THA", "JPN", "USA", "FRA"];

  it("앞 · 뒤 나라 · 처음과 끝은 null(단추를 막음)", () => {
    expect(neighbors(order, "JPN")).toEqual({ index: 2, prev: "THA", next: "USA" });
    expect(neighbors(order, "VNM")).toEqual({ index: 0, prev: null, next: "THA" });
    expect(neighbors(order, "FRA")).toEqual({ index: 4, prev: "USA", next: null });
  });

  it("순서에 없는 나라 · 빈 순서는 index -1 · 앞뒤 없음", () => {
    expect(neighbors(order, "XXX")).toEqual({ index: -1, prev: null, next: null });
    expect(neighbors([], "JPN")).toEqual({ index: -1, prev: null, next: null });
  });

  it("n / 전체 — 지금 순서의 번호 · 전체는 순서 길이", () => {
    expect(posText(order, "VNM")).toBe("1 / 5");
    expect(posText(order, "JPN")).toBe("3 / 5");
    expect(posText(order, "FRA")).toBe("5 / 5");
    expect(posText(order, "XXX")).toBe("");
  });

  it("바뀌는 방향 — 뒤 나라로 1 · 앞 나라로 -1 · 같거나 모르면 1", () => {
    expect(swapDir(order, "THA", "FRA")).toBe(1);
    expect(swapDir(order, "FRA", "THA")).toBe(-1);
    expect(swapDir(order, "JPN", "JPN")).toBe(1);
    expect(swapDir(order, "XXX", "JPN")).toBe(1);
  });
});

describe("내용 글 (작업 0361)", () => {
  it("경로 · 자세히 보기 글", () => {
    expect(crumbText("일본")).toBe("여행 물가 › 일본");
    expect(detailLinkText("아랍에미리트")).toBe("아랍에미리트 물가 자세히 보기");
  });
});
