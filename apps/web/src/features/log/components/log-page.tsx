// 작업실 페이지 (예전 이름 "만드는 중" · 작업 0105) — 큰 제목 → 상태판 → 팀 책상 → 작업 흐름 → 실시간 기록 · 패치 내역 · 작업 책상 (작업 0170 · Figma 06)
import type { Fetched } from "@/shared/api";
import { REPO_URL } from "@/shared/site";
import { SiteNav } from "@/shared/site-nav";
import type { SiteStatus } from "@hav/shared/status";
import type { TasksSummary } from "@hav/shared/tasks";
import { PageFooter } from "@hav/ui/layout/page-footer";
import { Eyebrow, Title } from "@hav/ui/text/heading";
import { LogBody } from "./log-body";
import { StatusBoard } from "./status-board";
import { TeamDesks } from "./team-desks";
import { WorkFlow } from "./work-flow";

export function LogPage({ tasks, status, builtAt }: { tasks: Fetched<TasksSummary>; status: Fetched<SiteStatus>; builtAt: string }) {
  return (
    <>
      <SiteNav page="log" />
      <main className="bg-surface px-4 pt-14 pb-12 text-fg sm:px-8 sm:pt-20">
        <div className="mx-auto max-w-6xl">
          <Eyebrow>작업실</Eyebrow>
          <Title as="h1" className="mt-3 text-cheap">
            AI 에이전트 팀이 이 사이트를 만듭니다
          </Title>
          <StatusBoard build={status} builtAt={builtAt} />
          <TeamDesks />
          <WorkFlow />
        </div>
      </main>
      <LogBody buildTasks={tasks} />
      <PageFooter>
        자료: GitHub 이슈 · PR · 작업 기록 (3초마다 갱신) · 기록은 에이전트의 도구 사용 훅이 보냅니다 · 공개 일지의 원본은 <a href={REPO_URL}>GitHub 커밋 · PR</a> · <a href="/geo">GEO 측정</a> · <a href="/about">소개 · 판단 기준</a>
      </PageFooter>
    </>
  );
}
