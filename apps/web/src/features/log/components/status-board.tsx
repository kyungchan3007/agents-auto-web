"use client";

// 사이트 상태판 — 시안: 흰 카드 4개 (오늘 환율 수집 · 사이트 빌드 · 자동 검사 (main) · 열린 작업) · 실패한 칸의 값은 주홍 (작업 0105 · 0170 Figma 06)
// 값은 API 가 준 것만 — 자동 검사 · 열린 작업은 이 사이트가 아직 받아 오지 않아 GitHub 로 연결 (숫자를 지어내지 않음)
import { REPO_URL } from "@/shared/site";
import type { SiteStatus } from "@hav/shared/status";
import type { Fetched } from "../../../shared/api";
import { runSummary } from "../lib/run-summary";
import { headlineOf, timeText } from "../lib/status-text";
import { useStatus } from "../hooks/use-status";

export function StatusBoard({ build, builtAt }: { build: Fetched<SiteStatus>; builtAt: string }) {
  const f = useStatus(build);
  return (
    <section data-testid="status-board" aria-labelledby="status-title" className="mt-10">
      <h2 id="status-title" className="sr-only">
        사이트 상태
      </h2>
      {!f.ok ? <p className="text-small text-fg-2">상태를 받지 못했습니다 ({f.reason})</p> : <Body s={f.data} builtAt={builtAt} />}
    </section>
  );
}

function Body({ s, builtAt }: { s: SiteStatus; builtAt: string }) {
  const h = headlineOf(s);
  const failed = h.tone === "bad" || s.lastRun?.status === "error";
  return (
    <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card label="오늘 환율 수집" value={runSummary(s)} tone={failed ? "text-expensive" : "text-fg"} sub={h.tone === "ok" ? undefined : h.text} />
      <Card label="사이트 빌드" value={timeText(builtAt)} />
      <Card label="자동 검사 (main)" value="GitHub 에서 확인" href={`${REPO_URL}/actions/workflows/checks.yml?query=branch%3Amain`} />
      <Card label="열린 작업" value="GitHub 에서 확인" href={`${REPO_URL}/issues`} />
    </dl>
  );
}

function Card({ label, value, sub, href, tone = "text-fg" }: { label: string; value: string; sub?: string; href?: string; tone?: string }) {
  return (
    <div className="rounded-card bg-card px-5 py-4">
      <dt className="text-small text-fg-2">{label}</dt>
      <dd className={`mt-1 text-[1.125rem] leading-snug font-semibold ${tone}`}>
        {href ? (
          <a href={href} target="_blank" rel="noreferrer" className="text-cheap underline underline-offset-2">
            {value} ↗
          </a>
        ) : (
          value
        )}
      </dd>
      {sub && <dd className="mt-1 text-small text-fg-2">{sub}</dd>}
    </div>
  );
}
