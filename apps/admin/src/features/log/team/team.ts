// 작업실 팀 · 작업 흐름 (작업 0170 · Figma 06 → 작업 0303: data 자리 더함 · geo 는 알리기까지) — 역할 설명은 .agents/orchestration/team.md 와 같은 뜻
// 지금 맡은 일("지금: …")은 실제 기록에서만 보여 주고 여기에는 넣지 않음 (받지 못하면 비움 · 지어내지 않음)
export type DeskId = "lead" | "builder" | "test" | "geo" | "data";

export const TEAM_DESKS: readonly { id: DeskId; duty: string }[] = [
  { id: "lead", duty: "계획 · 통합 · PR" },
  { id: "builder", duty: "화면 · API 구현" },
  { id: "test", duty: "테스트 먼저 작성" },
  { id: "geo", duty: "검색 노출 측정 · 알리기" },
  { id: "data", duty: "수집 상태 · 이상 값 점검" },
];

export const WORK_FLOW: readonly string[] = ["요청 원문 보관", "계획", "테스트 먼저 (실패 확인)", "구현", "자동 검사 통과", "PR · 사람 머지"];

/** 완료 기준 칸 — 위 파란 선 + "완료 기준" 표시 (작업 0303 · 0312 에 work-flow.tsx 에서 옮김) */
export const WORK_FLOW_KEY = "자동 검사 통과";
export const workFlowSteps = () => WORK_FLOW.map((step) => ({ step, key: step === WORK_FLOW_KEY }));
