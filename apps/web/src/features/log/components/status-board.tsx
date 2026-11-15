"use client";

// 사이트 상태판 — 작업실 맨 위 (작업 0105 · 0170 Figma 06) · 오늘 환율 수집 · 사이트 빌드 · 자동 검사 · 열린 작업 · 실패한 칸은 주홍
// 값은 API 가 준 것만 — 자동 검사 · 열린 작업은 이 사이트가 아직 받아 오지 않아 GitHub 로 연결 (숫자를 지어내지 않음)
import { REPO_URL } from "@/shared/site";
import type { SiteStatus } from "@hav/shared/status";
import type { Fetched } from "../../../shared/api";
import { SLOT_TEXT, headlineOf, lastRunText, timeText } from "../lib/status-text";
import { useStatus } from "../hooks/use-status";

const TONE = { ok: "text-cheap", warn: "text-normal", bad: "text-expensive", rest: "text-fg-2" } as const;
const SLOT_TONE = { done: "text-cheap", "not-needed": "text-fg-2", upcoming: "text-fg-2", empty: "text-fg-2", error: "text-expensive", missed: "text-expensive" } as const;

export function StatusBoard({ build, builtAt }: { build: Fetched<SiteStatus>; builtAt: string }) {
  const f = useStatus(build);
  return (
    <section data-testid="status-board" aria-labelledby="status-title" className="mt-12">
      <h2 id="status-title" className="font-display text-city font-normal tracking-tight">
        사이트 상태
      </h2>
      {!f.ok ? <p className="mt-4 text-small text-fg-2">상태를 받지 못했습니다 ({f.reason})</p> : <Body s={f.data} builtAt={builtAt} />}
    </section>
  );
}

function Body({ s, builtAt }: { s: SiteStatus; builtAt: string }) {
  const h = headlineOf(s);
  const failed = h.tone === "bad" || s.lastRun?.status === "error";
  return (
    <>
      <p className={`mt-4 text-body font-semibold ${TONE[h.tone]}`} aria-live="polite">
        {h.tone === "bad" ? "⚠ " : ""}
        {h.text}
      </p>
      <dl className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="오늘 환율 수집" value={lastRunText(s)} tone={failed ? "text-expensive" : "text-fg"} />
        <Card label="사이트 빌드" value={timeText(builtAt)} sub={`확인한 때 ${timeText(s.now)}`} />
        <Card label="자동 검사 (main)" value="GitHub 에서 확인" href={`${REPO_URL}/actions`} />
        <Card label="열린 작업" value="GitHub 에서 확인" href={`${REPO_URL}/issues`} />
      </dl>
      {s.schedule.length > 0 && (
        <ol className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-small" aria-label="오늘 수집 예약">
          {s.schedule.map((x) => (
            <li key={x.time}>
              <span className="font-mono text-fg-2">{x.time}</span> <span className={`font-semibold ${SLOT_TONE[x.state]}`}>{SLOT_TEXT[x.state]}</span>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}

function Card({ label, value, sub, href, tone = "text-fg" }: { label: string; value: string; sub?: string; href?: string; tone?: string }) {
  return (
    <div className="border-t-2 border-line pt-3">
      <dt className="text-small text-fg-2">{label}</dt>
      <dd className={`mt-1 text-body font-semibold ${tone}`}>
        {href ? (
          <a href={href} target="_blank" rel="noreferrer" className="text-accent underline underline-offset-2">
            {value} ↗
          </a>
        ) : (
          value
        )}
      </dd>
      {sub && <dd className="mt-0.5 text-small text-fg-2">{sub}</dd>}
    </div>
  );
}
