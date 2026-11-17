// 작업 0194 — 인트로 로딩 화면(시안 A · 출발 안내판이 열림)의 단계 · 글 · 시간표 (순수 함수 · 테스트 먼저 · 구현 전에는 FAIL 이 정상)
// 흐름: 로딩(안내판 두 줄 · 진행률 % 없음) → 3D 준비 + 첫 줄이 다 맞춰진 뒤 "어디로 떠나시나요?" → 안내판이 내려가며 흐려짐 + 바탕이 위 · 아래로 열림(0.9초) → 1단계
//
// builder 가 만들 것 — apps/web/src/features/intro/lib/loading.ts
//   export const LOADING = { brand: "flapfx", sub: "환율 · 여행 타이밍", cols: 14, first: "ICN → 탑승 준비 중", ask: "어디로 떠나시나요?", seconds: [{ at: 0, text: "" }, { at: 1500, text: "체크인 확인 중" }, { at: 3000, text: "게이트 배정 중" }] }
//   export const FLIP_MS = 1100 · MIN_SHOW_MS(첫 줄이 다 맞춰지는 최소 표시 시간 · FLIP_MS 이상) · ASK_HOLD_MS(첫 줄이 "어디로…" 로 맞춰지는 시간 · FLIP_MS 이상) · OPEN_MS = 900 · STILL_FADE_MS(움직임 줄이기 페이드)
//   export type LoadingStage = "wait" | "ask" | "open" | "done"
//   export function loadingStage(f: { ready: boolean; asked: boolean; opened: boolean }): LoadingStage
//     - ready = 3D 준비됨 && 최소 표시 시간이 지남 · asked = "어디로…" 가 다 맞춰짐 · opened = 열림이 끝남
//     - ready 가 아니면 wait (asked · opened 가 거짓이어야 정상) · ready 면 ask → asked 면 open → opened 면 done
//   export function loadingRows(stage: LoadingStage, second: string): [string, string]
//     - wait → [first, second(그때 둘째 줄 글)] · ask · open · done → [ask, ""] (둘째 줄은 비움)
import { describe, expect, it } from "vitest";
import { FLIP_MS, LOADING, MIN_SHOW_MS, OPEN_MS, ASK_HOLD_MS, STILL_FADE_MS, loadingRows, loadingStage } from "./loading";

describe("loadingStage", () => {
  it("3D 가 준비돼도 최소 표시 시간 전에는 wait (번쩍임 방지) · 준비되면 ask → open → done", () => {
    expect(loadingStage({ ready: false, asked: false, opened: false })).toBe("wait");
    expect(loadingStage({ ready: true, asked: false, opened: false })).toBe("ask");
    expect(loadingStage({ ready: true, asked: true, opened: false })).toBe("open");
    expect(loadingStage({ ready: true, asked: true, opened: true })).toBe("done");
  });
  it("ready 가 아니면 다른 값이 어떻든 wait", () => {
    expect(loadingStage({ ready: false, asked: true, opened: true })).toBe("wait");
  });
});

describe("loadingRows — 안내판 두 줄", () => {
  it("로딩 중: 첫 줄 'ICN → 탑승 준비 중' · 둘째 줄은 그때 글", () => {
    expect(loadingRows("wait", "체크인 확인 중")).toEqual(["ICN → 탑승 준비 중", "체크인 확인 중"]);
    expect(loadingRows("wait", "")).toEqual(["ICN → 탑승 준비 중", ""]);
  });
  it("준비 뒤: 첫 줄 '어디로 떠나시나요?' · 둘째 줄 비움", () => {
    for (const s of ["ask", "open", "done"] as const) expect(loadingRows(s, "게이트 배정 중")).toEqual(["어디로 떠나시나요?", ""]);
  });
});

describe("글 · 시간표", () => {
  it("로고 · 안내 글 · 칸 수 — 모든 글이 14칸 안에 들어감", () => {
    expect(LOADING.brand).toBe("flapfx");
    expect(LOADING.sub).toBe("환율 · 여행 타이밍");
    for (const t of [LOADING.first, LOADING.ask, ...LOADING.seconds.map((s) => s.text)]) expect(Array.from(t).length, t).toBeLessThanOrEqual(LOADING.cols);
  });
  it("둘째 줄은 비어 시작해 '체크인 확인 중' → '게이트 배정 중' 로 차례로 · 시간은 오름차순", () => {
    expect(LOADING.seconds.map((s) => s.text)).toEqual(["", "체크인 확인 중", "게이트 배정 중"]);
    const at = LOADING.seconds.map((s) => s.at);
    expect(at).toEqual([...at].sort((a, b) => a - b));
    expect(at[0]).toBe(0);
  });
  it("진행률(%)이 어디에도 없음 — 실제 로딩 비율을 모르므로", () => {
    expect(JSON.stringify(LOADING)).not.toMatch(/%|퍼센트|\d+\s*\/\s*\d+/);
  });
  it("시간: 첫 줄이 다 맞춰질 때까지 최소 표시 · '어디로…' 가 맞춰진 뒤 열림 · 열림 0.9초", () => {
    expect(FLIP_MS).toBe(1100);
    expect(MIN_SHOW_MS).toBeGreaterThanOrEqual(FLIP_MS);
    expect(ASK_HOLD_MS).toBeGreaterThanOrEqual(FLIP_MS);
    expect(OPEN_MS).toBe(900);
    expect(STILL_FADE_MS).toBeGreaterThan(0);
    expect(STILL_FADE_MS).toBeLessThanOrEqual(600);
  });
});
