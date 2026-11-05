"use client";

// 사이트 상태 점검판 — 작업실 맨 위 (작업 0105) · 오늘 환율 · 마지막 수집 · 사이트 빌드 · 오늘 예약 회차
import type { SiteStatus } from "@hav/shared/status";
import type { Fetched } from "../../shared/api";
import { SLOT_TEXT, headlineOf, lastRunText, timeText } from "./status-text";
import { useStatus } from "./use-status";

const TONE = { ok: "text-cheap", warn: "text-normal", bad: "text-expensive", rest: "text-fg-2" } as const;
const SLOT_TONE = { done: "text-cheap", "not-needed": "text-fg-2", upcoming: "text-fg-2", empty: "text-fg-2", error: "text-expensive", missed: "text-expensive" } as const;

export function StatusBoard({ build, builtAt }: { build: Fetched<SiteStatus>; builtAt: string }) {
  const f = useStatus(build);
  return (
    <section data-surface="dark" aria-labelledby="status-title" className="bg-surface px-4 pt-10 text-fg sm:px-8 sm:pt-14">
      <div className="mx-auto max-w-3xl rounded-card bg-surface-2 p-5 ring-1 ring-line sm:p-6">
        <p id="status-title" className="text-xs font-semibold text-fg-2">
          사이트 상태
        </p>
        {!f.ok ? (
          <p className="mt-2 text-sm text-fg-2">상태를 받지 못했습니다 ({f.reason})</p>
        ) : (
          <Body s={f.data} builtAt={builtAt} />
        )}
      </div>
    </section>
  );
}

function Body({ s, builtAt }: { s: SiteStatus; builtAt: string }) {
  const h = headlineOf(s);
  return (
    <>
      <p className={`mt-2 text-lg font-semibold tracking-tight ${TONE[h.tone]}`} aria-live="polite">
        {h.tone === "bad" ? "⚠ " : ""}
        {h.text}
      </p>
      <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <Row k="최근 환율" v={s.latestDate ?? "없음"} />
        <Row k="마지막 수집" v={lastRunText(s)} />
        <Row k="사이트 빌드" v={timeText(builtAt)} />
        <Row k="확인한 때" v={timeText(s.now)} />
      </dl>
      {s.schedule.length > 0 && (
        <ol className="mt-4 grid grid-cols-3 gap-2 text-center text-xs" aria-label="오늘 수집 예약">
          {s.schedule.map((x) => (
            <li key={x.time} className="rounded-field bg-surface px-2 py-2">
              <span className="block font-mono text-fg-2">{x.time}</span>
              <span className={`mt-0.5 block font-semibold ${SLOT_TONE[x.state]}`}>{SLOT_TEXT[x.state]}</span>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-line pt-2">
      <dt className="shrink-0 text-fg-2">{k}</dt>
      <dd className="text-right text-fg">{v}</dd>
    </div>
  );
}
