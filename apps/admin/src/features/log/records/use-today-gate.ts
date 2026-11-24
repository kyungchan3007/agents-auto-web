"use client";

// 작업실 칸 "오늘 팀이 한 일 · 자동 검사"의 화면 값 (작업 0341) — 빌드 때 받은 것을 먼저 · 브라우저가 한 번 더 · 자료가 없으면 null (지어내지 않음)
import type { Fetched } from "@hav/shared/api";
import type { TasksSummary } from "@hav/shared/tasks";
import { gateLines, todayHeadline } from "./today-gate";
import { useTasks } from "./use-tasks";

export function useTodayGate(buildTasks: Fetched<TasksSummary>) {
  const tasks = useTasks(buildTasks);
  if (!tasks.ok) return { ok: false as const, reason: tasks.reason };
  const { today, gate } = tasks.data;
  return {
    ok: true as const,
    today: today && {
      headline: todayHeadline(today.items),
      progress: `${today.items.filter((i) => i.done).length}/${today.items.length}`,
      issue: { label: `#${today.number}`, href: today.url },
      items: today.items.map((i, n) => ({ key: n, done: i.done, mark: i.done ? "끝남" : "남음", head: i.head })),
    },
    // 실패 줄의 키는 실행 주소 — 같은 PR 의 실패 실행이 둘이면 PR 주소가 겹쳐 옛 줄이 남았음 (작업 0352 · gateLines 의 모양은 그대로)
    gate: gate && (() => {
      const lines = gateLines(gate);
      return { ...lines, failed: lines.failed.map((f, i) => ({ ...f, key: gate.failed[i].runUrl })) };
    })(),
  };
}
