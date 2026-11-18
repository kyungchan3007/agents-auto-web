// 작업실 페이지 (예전 이름 "만드는 중" · 작업 0105) — 시안(작업 0170 · Figma 06): 라벨 → 큰 제목 2줄 → 이 사이트를 어떻게 만들었나(작업 0172) → 상태판 카드 4 → 팀 책상 카드 4 → 작업 흐름 칩 → 실시간 기록 카드 → 바닥 띠
// 시안에 없는 구간(스크롤 장면 · 작업 책상 · 오늘 패치 수 · 패치 내역)은 화면에서 뺌
import type { Fetched } from "@/shared/api";
import { SiteNav } from "@/shared/site-nav";
import type { SiteStatus } from "@hav/shared/status";
import type { TasksSummary } from "@hav/shared/tasks";
import { PageFooter } from "@hav/ui/layout/page-footer";
import { Eyebrow, Title } from "@hav/ui/text/heading";
import { RecordCard } from "./record-card";
import { StatusBoard } from "./status-board";
import { StorySection } from "./story-section";
import { TeamDesks } from "./team-desks";
import { WorkFlow } from "./work-flow";

export function LogPage({ tasks, status, builtAt }: { tasks: Fetched<TasksSummary>; status: Fetched<SiteStatus>; builtAt: string }) {
  return (
    <>
      <SiteNav page="log" />
      <main id="main" tabIndex={-1} className="bg-surface px-4 pt-8 pb-10 text-fg sm:px-8 sm:pt-10">
        <div className="mx-auto max-w-page">
          <Eyebrow>작업실</Eyebrow>
          <Title as="h1" size="page" aria-label="AI 에이전트 팀이 이 사이트를 만듭니다" className="mt-6 text-cheap">
            <span aria-hidden className="block">
              AI 에이전트 팀이
            </span>{" "}
            <span aria-hidden className="block">
              이 사이트를 만듭니다
            </span>
          </Title>
          <StorySection />
          <StatusBoard build={status} builtAt={builtAt} />
          <TeamDesks />
          <WorkFlow />
          <div className="mt-6">
            <RecordCard buildTasks={tasks} />
          </div>
        </div>
      </main>
      <PageFooter width="max-w-page">자료: GitHub 이슈 · PR · 작업 기록 (3초마다 갱신)</PageFooter>
    </>
  );
}
