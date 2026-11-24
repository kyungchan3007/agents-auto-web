// 작업실 칸 "오늘 팀이 한 일 · 자동 검사"의 문구 계산 (작업 0341 · 순수 함수 · 그리기는 record-card.tsx)
import type { GateRuns } from "@hav/shared/tasks";

/** 맨 위 한 줄 — "6개 중 4개 끝남" */
export const todayHeadline = (items: { done: boolean }[]): string => `${items.length}개 중 ${items.filter((i) => i.done).length}개 끝남`;

/** 걸린 시간 — 60초 미만은 초 · 이상은 분(소수 한 자리) */
export const durationText = (sec: number): string => (sec < 60 ? `${Math.round(sec)}초` : `${(sec / 60).toFixed(1)}분`);

const orNone = (sec: number | null) => (sec === null ? "자료 없음" : durationText(sec));

/** 최근 자동 검사 줄 — 개수 · 시간 · 실패(PR 을 알면 PR 주소 · 모르면 실행 주소) */
export function gateLines(g: GateRuns): { count: string; time: string; failed: { label: string; href: string }[] } {
  return {
    count: `최근 ${g.total}번 · 통과 ${g.pass} · 실패 ${g.fail}`,
    time: `걸린 시간 가운데 값 ${orNone(g.medianSec)} · 최근 ${orNone(g.latestSec)}`,
    failed: g.failed.map((f) => ({ label: f.prNumber === null ? f.branch : `PR #${f.prNumber} · ${f.branch}`, href: f.prUrl ?? f.runUrl })),
  };
}
