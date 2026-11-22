"use client";

// 작업실 (작업 0105 → 작업 0303 어드민 · 시안 Version 6)
//   머리(라벨 · 제목 · 기록 갱신 · 다시 받기) → 사이트 상태 숫자 4 → 실시간 기록 · 팀(같은 높이) → 작업 흐름 한 줄 → 이 사이트를 어떻게 만들었나
import type { SiteStatus } from "@hav/shared/status";
import type { TasksSummary } from "@hav/shared/tasks";
import { AdminNav } from "@/shared/nav/admin-nav";
import { Stamp } from "../../shared/ui/panel/panel";
import type { Fetched } from "@hav/shared/api";
import { RecordCard } from "./records/record-card";
import { useSiteStatus } from "./status/use-site-status";
import { RefreshButton, StatusBoard } from "./status/status-board";
import { StorySection } from "./story/story-section";
import { TeamDesks } from "./team/team-desks";
import { WorkFlow } from "./team/work-flow";

export function LogPage({ tasks, status, builtAt }: { tasks: Fetched<TasksSummary>; status: Fetched<SiteStatus>; builtAt: string }) {
  const s = useSiteStatus(status);
  return (
    <AdminNav page="log">
      <div className="adm-top">
        <div>
          <p className="adm-eyebrow">작업실</p>
          <h1>AI 에이전트 팀이 이 사이트를 만듭니다</h1>
        </div>
        <div className="adm-topr">
          <Stamp live>기록 3초마다 갱신</Stamp>
          <RefreshButton busy={s.busy} left={s.left} onClick={() => void s.refresh()} />
        </div>
      </div>
      <StatusBoard s={s} builtAt={builtAt} />
      <div className="adm-grid eq">
        <RecordCard buildTasks={tasks} />
        <TeamDesks />
      </div>
      <WorkFlow />
      <StorySection />
    </AdminNav>
  );
}
