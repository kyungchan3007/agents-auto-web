// 작업실 페이지 (예전 이름 "만드는 중" · 작업 0105) — 사이트 상태 점검판 → 가운데 고정 패널 ①~③ → ④ 작업 책상 → 끝 숫자 (docs/design.md)
import type { Fetched } from "@/shared/api";
import { SiteNav } from "@/shared/site-nav";
import type { SiteStatus } from "@hav/shared/status";
import type { TasksSummary } from "@hav/shared/tasks";
import { REPO_URL } from "@/shared/site";
import { LogBody } from "./log-body";
import { StatusBoard } from "./status-board";
import { TextLink } from "@hav/ui/text-link";
import { PageFooter } from "@hav/ui/page-footer";

export function LogPage({ tasks, status, builtAt }: { tasks: Fetched<TasksSummary>; status: Fetched<SiteStatus>; builtAt: string }) {
  return (
    <>
      <SiteNav page="log" />

      {/* 큰 시작 제목은 뺌 (2026-10-29 · 작업 0057) — 바로 장면 ① 부터 · 제목은 화면 읽기용으로만 */}
      <h1 className="sr-only">작업실 — AI 코딩 에이전트가 이 사이트를 만드는 과정</h1>

      {/* 사이트 상태 — 오늘 환율 · 수집 · 빌드 · 예약 회차 (작업 0105) */}
      <StatusBoard build={status} builtAt={builtAt} />

      <LogBody buildTasks={tasks} />

      <PageFooter>
          기록은 에이전트의 도구 사용 훅이 보냅니다 · 공개 일지의 원본은{" "}
          <TextLink href={REPO_URL}>
            GitHub 커밋 · PR
          </TextLink>{" "}
          ·{" "}
          <TextLink href="/about">
            소개 · 판단 기준
          </TextLink>
      </PageFooter>
    </>
  );
}
