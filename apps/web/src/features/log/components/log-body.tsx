"use client";

// 작업실 본문 — 실시간 기록 → 패치 내역 → 작업 책상 · 다 한 일 선반 → 오늘 발견된 버그 · 보안 (작업 0170: 스크롤 고정 장면을 걷고 차례로 쌓음)
import type { TasksSummary } from "@hav/shared/tasks";
import type { Fetched } from "../../../shared/api";
import { PatchLog } from "./patch-log";
import { StackedScenes } from "./scenes";
import { TaskDesks } from "./task-desks";
import { TodayPatches } from "./today-patches";
import { useLogView } from "../hooks/use-log-view";

export function LogBody({ buildTasks }: { buildTasks: Fetched<TasksSummary> }) {
  const { activity, tasks, names, blocked, patches } = useLogView(buildTasks);
  const props = { activity, names, blocked };

  return (
    <>
      <StackedScenes {...props} />
      <PatchLog tasks={tasks} />
      <TaskDesks activity={activity} tasks={tasks} />
      <TodayPatches counts={patches} />
    </>
  );
}
