// 작업실 팀 책상 · 작업 흐름 (작업 0170 · Figma 06) — 역할 설명은 .agents/orchestration/team.md 와 같은 뜻
// 지금 맡은 일("지금: …")은 실제 기록에서만 보여 주고 여기에는 넣지 않음 (받지 못하면 비움 · 지어내지 않음)
export type DeskId = "lead" | "builder" | "test" | "geo";

export const TEAM_DESKS: readonly { id: DeskId; duty: string }[] = [
  { id: "lead", duty: "계획 · 통합 · PR" },
  { id: "builder", duty: "화면 · API 구현" },
  { id: "test", duty: "테스트 먼저 작성" },
  { id: "geo", duty: "검색 노출 측정" },
];

export const WORK_FLOW: readonly string[] = ["요청 원문 보관", "계획", "테스트 먼저 (실패 확인)", "구현", "자동 검사 통과", "PR · 사람 머지"];
