"use client";

// 작업실 본문 — 패치 내역 → 가운데 패널 장면 ①~③ → ④ 작업 책상 · 다 한 일 선반 → 오늘 발견된 버그 · 보안
import type { TasksSummary } from "@hav/shared/tasks";
import type { Fetched } from "../../shared/api";
import { PatchLog } from "./patch-log";
import { PinnedScenes, StackedScenes } from "./scenes";
import { TaskDesks } from "./task-desks";
import { TodayPatches } from "./today-patches";
import { useLogView } from "./use-log-view";

export function LogBody({ buildTasks }: { buildTasks: Fetched<TasksSummary> }) {
  const { activity, tasks, names, blocked, mood, reduce, patches } = useLogView(buildTasks);
  const props = { activity, names, blocked, mood };

  return (
    <>
      <PatchLog tasks={tasks} />
      {reduce ? <StackedScenes {...props} /> : <PinnedScenes {...props} />}
      <TaskDesks activity={activity} tasks={tasks} />
      <TodayPatches counts={patches} />
    </>
  );
}
