// 작업 0170 — 작업실(/log) 팀 책상 · 작업 흐름 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
// Figma 06 · SR-LOG-01 — "팀 책상: lead · builder · test · geo 네 역할과 맡은 일" · "작업 흐름: 요청 원문 보관 → 계획 → 테스트 먼저 → 구현 → 자동 검사 통과 → 사람이 머지"
// 역할 설명은 .agents/orchestration/team.md 와 같은 뜻 — 지금 맡은 일("지금: …")은 실제 기록에서만 (받지 못하면 비움 · 지어내지 않음 — 이 상수에 넣지 않음)
//
// builder 가 만들 것 — apps/admin/src/features/log/team/team.ts
//   export type DeskId = "lead" | "builder" | "test" | "geo"
//   export const TEAM_DESKS: readonly { id: DeskId; duty: string }[]
//   export const WORK_FLOW: readonly string[]
import { describe, expect, it } from "vitest";
import { TEAM_DESKS, WORK_FLOW } from "./team";

describe("팀 책상", () => {
  it("lead · builder · test · geo · data 다섯 역할 · 맡은 일 (작업 0303: data 더함)", () => {
    expect(TEAM_DESKS).toEqual([
      { id: "lead", duty: "계획 · 통합 · PR" },
      { id: "builder", duty: "화면 · API 구현" },
      { id: "test", duty: "테스트 먼저 작성" },
      { id: "geo", duty: "검색 노출 측정 · 알리기" },
      { id: "data", duty: "수집 상태 · 이상 값 점검" },
    ]);
  });
});

describe("작업 흐름", () => {
  it("요청 원문 보관 → 계획 → 테스트 먼저 (실패 확인) → 구현 → 자동 검사 통과 → PR · 사람 머지", () => {
    expect(WORK_FLOW).toEqual(["요청 원문 보관", "계획", "테스트 먼저 (실패 확인)", "구현", "자동 검사 통과", "PR · 사람 머지"]);
  });
});
