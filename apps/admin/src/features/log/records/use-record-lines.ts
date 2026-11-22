"use client";

// 실시간 기록 카드의 줄 (작업 0303 · 0312 에 record-card.tsx 에서 옮김) — 빌드 때 받은 것을 먼저 · 브라우저가 한 번 더 · "몇 분 전"은 30초마다 다시 셈
import type { TasksSummary } from "@hav/shared/tasks";
import type { Fetched } from "@hav/shared/api";
import { agoText } from "@/shared/time/time-text";
import { recordLines } from "./record";
import { useNow } from "./use-now";
import { useTasks } from "./use-tasks";

const SHOWN = 3;

export function useRecordLines(buildTasks: Fetched<TasksSummary>) {
  const tasks = useTasks(buildTasks);
  const now = useNow(30_000);
  if (!tasks.ok) return { ok: false as const, reason: tasks.reason };
  const lines = recordLines(tasks.data, SHOWN).map((l) => ({ ...l, rel: now === null ? null : agoText(now - Date.parse(l.at)) }));
  return { ok: true as const, lines };
}
