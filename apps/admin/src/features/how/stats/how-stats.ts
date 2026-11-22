// 만드는 방식 숫자 칸 (작업 0303 · 0312 에 how-page.tsx 에서 옮김) · 순수 함수 — 못 센 칸(null)은 뺌
import { numberText } from "@hav/shared/format";
import type { HowCounts } from "../repo-counts/repo-counts";

export type HowStat = { k: string; v: string; unit: string; s: string };

export function howStats(counts: HowCounts): HowStat[] {
  const all: { k: string; v: number | null; unit: string; s: string }[] = [
    { k: "작업", v: counts.tasks, unit: "개", s: "작업마다 요청 원문 · 계획 보관" },
    { k: "에이전트 자리", v: 5, unit: "자리", s: "lead · builder · test · geo · data" },
    { k: "보호 파일 규칙", v: counts.protectedRules, unit: "줄", s: "바뀌면 사람 승인 없이 CI 통과 안 됨" },
    { k: "훅", v: counts.hooks, unit: "개", s: "실행 전 · 응답 끝에 자동으로 검사" },
  ];
  return all.flatMap((x) => (x.v === null ? [] : [{ ...x, v: numberText(x.v) }]));
}
