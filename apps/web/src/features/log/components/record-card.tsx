"use client";

// 실시간 기록 — 울트라마린 카드 하나 · 노란 제목 · 흰 글 세 줄 (작업 0170 · Figma 06) — 머지된 PR 의 실제 기록만 · 받지 못하면 이유
// 빌드 때 받은 것을 먼저 · 브라우저가 한 번 더 (use-tasks) · 카드는 어느 배경(밤 포스터 포함)에서도 같은 울트라마린 · 흰 글 (--hav-pin-cheap)
import type { TasksSummary } from "@hav/shared/tasks";
import type { Fetched } from "../../../shared/api";
import { recordLine } from "../lib/record";
import { useTasks } from "../hooks/use-tasks";

const SHOWN = 3;

export function RecordCard({ buildTasks }: { buildTasks: Fetched<TasksSummary> }) {
  const tasks = useTasks(buildTasks);
  const lines = tasks.ok ? tasks.data.done.slice(0, SHOWN).map((d) => ({ key: d.number, text: recordLine(d) })) : [];
  return (
    <section data-testid="record-card" aria-labelledby="record-title" className="rounded-card bg-pin-cheap px-6 py-5 text-foam sm:px-5">
      <h2 id="record-title" className="text-lg font-semibold text-sun">
        실시간 기록 (실제 기록 · 한국 시간)
      </h2>
      {!tasks.ok ? (
        <p className="mt-3 text-small">기록을 받지 못했습니다 ({tasks.reason})</p>
      ) : lines.length === 0 ? (
        <p className="mt-3 text-small">아직 머지된 기록이 없습니다</p>
      ) : (
        <ul className="mt-3 space-y-2 text-small whitespace-pre-wrap">
          {lines.map((l) => (
            <li key={l.key}>{l.text}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
