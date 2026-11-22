"use client";

// 실시간 기록 (작업 0170 → 작업 0303 어드민 줄 목록) — 머지된 PR 의 실제 기록만 · 받지 못하면 이유 · 시각 옆 "몇 분 전"(30초마다 다시 셈)
// 빌드 때 받은 것을 먼저 · 브라우저가 한 번 더 (use-tasks)
import type { TasksSummary } from "@hav/shared/tasks";
import { Panel, Stamp } from "@hav/ui/admin/panel";
import type { Fetched } from "../../../shared/api";
import { recordParts } from "../lib/record";
import { useNow } from "../hooks/use-now";
import { useTasks } from "../hooks/use-tasks";

const SHOWN = 3;

/** 지금과의 차이 → "방금" · "12분 전" · "6시간 전" · "2일 전" */
export function relText(ms: number): string {
  const m = Math.round(ms / 60000);
  if (m < 1) return "방금";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}시간 전` : `${Math.floor(h / 24)}일 전`;
}

export function RecordCard({ buildTasks }: { buildTasks: Fetched<TasksSummary> }) {
  const tasks = useTasks(buildTasks);
  const now = useNow(30_000);
  const lines = tasks.ok ? tasks.data.done.slice(0, SHOWN).map((d) => ({ key: d.number, ...recordParts(d) })) : [];
  return (
    <Panel id="log-live" testId="record-card" title="실시간 기록" meta={<Stamp>한국 시간</Stamp>}>
      {!tasks.ok ? (
        <p className="adm-empty">기록을 받지 못했습니다 ({tasks.reason})</p>
      ) : lines.length === 0 ? (
        <p className="adm-empty">아직 머지된 기록이 없습니다</p>
      ) : (
        <ul className="adm-rows">
          {lines.map((l) => (
            <li key={l.key}>
              <span className="t">{l.time}</span>
              <span>
                {l.text}
                {now !== null && <span className="adm-rel">{relText(now - Date.parse(l.at))}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="adm-foot">
        <p className="adm-note">자료: GitHub 이슈 · PR · 작업 기록 (3초마다 갱신)</p>
      </div>
    </Panel>
  );
}
