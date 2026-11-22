// 사이트 상태 숫자 칸에 보일 값 (작업 0105 · 0303 · 0312 에 status-board.tsx 에서 옮김) · 순수 함수 · 값은 API 가 준 것만
import type { SiteStatus } from "@hav/shared/status";
import { splitTime } from "@/shared/text/split-big";
import { kstStamp } from "@/shared/time/time-text";
import { runSummary } from "./run-summary";
import { headlineOf } from "./status-text";

/** 자동 검사 · 열린 작업은 이 사이트가 아직 받아 오지 않아 GitHub 로 연결 (숫자를 지어내지 않음) */
export const statusLinks = (repoUrl: string) => ({
  checks: `${repoUrl}/actions/workflows/checks.yml?query=branch%3Amain`,
  issues: `${repoUrl}/issues`,
});

export type StatusBoardView = {
  /** 실패면 붉은 글자 (어드민 bad) */
  failed: boolean;
  /** 오늘 환율 수집 칸 — 큰 글자(시각) */
  run: string;
  /** 그 아래 작은 줄 — 나머지 글 · 정상이 아니면 맨 위 한 줄 */
  sub: string;
  /** 사이트 빌드 칸 */
  built: string;
};

export function statusBoardView(st: SiteStatus, builtAt: string): StatusBoardView {
  const h = headlineOf(st);
  const run = splitTime(runSummary(st));
  return {
    failed: h.tone === "bad" || st.lastRun?.status === "error",
    run: run.big,
    sub: [run.rest, h.tone === "ok" ? "" : h.text].filter(Boolean).join(" · "),
    built: kstStamp(builtAt),
  };
}
