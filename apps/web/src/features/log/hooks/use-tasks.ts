"use client";

// 지난 작업 · 작업 이름 — 빌드 때 받은 것을 먼저 보여 주고, 브라우저에서 /bff/tasks 로 한 번 더 (빌드가 저장보다 먼저 끝나도 채워지게)
import type { TasksSummary } from "@hav/shared/tasks";
import { useLive } from "@hav/ui/hooks/use-live";
import { type Fetched, LIVE, api } from "../../../shared/api";

const load = () => api.tasks(LIVE);

export const useTasks = (build: Fetched<TasksSummary>) => useLive(build, load);
