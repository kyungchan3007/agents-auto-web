"use client";

// 작업실 본문 자료 — 실시간 기록 · 작업 목록 · 오늘 패치 수 · 움직임 줄이기
import type { TasksSummary } from "@hav/shared/tasks";
import { todayPatchCounts } from "@hav/shared/tasks";
import { useReducedMotion } from "motion/react";
import type { Fetched } from "../../../shared/api";
import { moodOf } from "../lib/mood";
import { liveStatus, todayStats } from "../lib/status";
import { useActivity } from "./use-activity";
import { useTasks } from "./use-tasks";

export function useLogView(buildTasks: Fetched<TasksSummary>) {
  const activity = useActivity();
  const tasks = useTasks(buildTasks);
  return {
    activity,
    tasks,
    names: tasks.ok ? tasks.data.names : {},
    blocked: todayStats(activity.events, activity.now).blocked,
    mood: moodOf(liveStatus(activity.events, activity.now)),
    reduce: useReducedMotion(),
    // activity.now 는 브라우저에서만 채워짐 — 그 전(빌드 그림)에는 0 이라 날짜가 달라 0 으로 보임
    patches: todayPatchCounts(tasks.ok ? tasks.data.done : [], activity.now),
  };
}
