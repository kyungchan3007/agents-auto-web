"use client";

// 실시간 기록 — 시안 A(작업 0214): 같은 흰 카드 · 작은 제목 · 줄마다 위 가는 선 (예전 울트라마린 카드) — 머지된 PR 의 실제 기록만 · 받지 못하면 이유
// 빌드 때 받은 것을 먼저 · 브라우저가 한 번 더 (use-tasks · 3초 갱신 그대로)
import type { TasksSummary } from "@hav/shared/tasks";
import type { Fetched } from "../../../shared/api";
import { recordLine } from "../lib/record";
import { useTasks } from "../hooks/use-tasks";

const SHOWN = 3;

export function RecordCard({ buildTasks }: { buildTasks: Fetched<TasksSummary> }) {
  const tasks = useTasks(buildTasks);
  const lines = tasks.ok ? tasks.data.done.slice(0, SHOWN).map((d) => ({ key: d.number, text: recordLine(d) })) : [];
  return (
    <section data-testid="record-card" aria-labelledby="record-title" className="rounded-card bg-card px-6 py-5 text-fg">
      <h2 id="record-title" className="text-small font-normal text-fg-2">
        실시간 기록 (실제 기록 · 한국 시간)
      </h2>
      {!tasks.ok ? (
        <p className="mt-3 text-small">기록을 받지 못했습니다 ({tasks.reason})</p>
      ) : lines.length === 0 ? (
        <p className="mt-3 text-small">아직 머지된 기록이 없습니다</p>
      ) : (
        <ul className="mt-3 text-small whitespace-pre-wrap">
          {lines.map((l) => (
            <li key={l.key} className="border-t border-line py-2 first:border-t-0">
              {l.text}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
