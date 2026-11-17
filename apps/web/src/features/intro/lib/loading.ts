// 인트로 로딩 화면(시안 A · 출발 안내판이 열림)의 단계 · 글 · 시간표 — 순수 (작업 0194)
// 흐름: 로딩(안내판 두 줄 · 진행률 % 없음) → 3D 준비 + 첫 줄이 다 맞춰진 뒤 "어디로 떠나시나요?" → 안내판이 내려가며 흐려짐 + 바탕이 위 · 아래로 열림 → 1단계
// 진행률을 지어내지 않음 — 실제 로딩 비율을 모르므로 "기다리는 중" 표시(안내판 글 · 노란 점)뿐

export const LOADING = {
  brand: "flapfx",
  sub: "환율 · 여행 타이밍",
  /** 안내판 칸 수 */
  cols: 14,
  first: "ICN → 탑승 준비 중",
  ask: "어디로 떠나시나요?",
  /** 둘째 줄 — 비어 시작해 차례로 (그때부터의 ms) */
  seconds: [
    { at: 0, text: "" },
    { at: 1500, text: "체크인 확인 중" },
    { at: 3000, text: "게이트 배정 중" },
  ],
} as const;

/** 한 줄이 다 맞춰지는 데 걸리는 시간 (flipPlan totalMs) */
export const FLIP_MS = 1100;
/** 첫 줄이 다 맞춰질 때까지는 3D 가 먼저 준비돼도 로딩을 보임 (번쩍임 방지) */
export const MIN_SHOW_MS = 1300;
/** 첫 줄이 "어디로 떠나시나요?" 로 맞춰지는 시간 — 그다음 열림 */
export const ASK_HOLD_MS = 1300;
/** 안내판이 내려가고 바탕이 열리는 시간 */
export const OPEN_MS = 900;
/** 움직임 줄이기 — 넘김 · 열림 없이 로딩이 사라지는 페이드 */
export const STILL_FADE_MS = 450;

export type LoadingStage = "wait" | "ask" | "open" | "done";

/** ready = 3D 준비됨 && 최소 표시 시간 지남 · asked = "어디로…" 가 다 맞춰짐 · opened = 열림 끝 */
export function loadingStage(f: { ready: boolean; asked: boolean; opened: boolean }): LoadingStage {
  if (!f.ready) return "wait";
  if (!f.asked) return "ask";
  return f.opened ? "done" : "open";
}

/** 안내판 두 줄 — 로딩 중에는 첫 줄 + 그때 둘째 줄 · 준비된 뒤에는 "어디로…" + 빈 줄 */
export function loadingRows(stage: LoadingStage, second: string): [string, string] {
  return stage === "wait" ? [LOADING.first, second] : [LOADING.ask, ""];
}
