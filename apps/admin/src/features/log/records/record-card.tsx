"use client";

// 실시간 기록 (작업 0170 → 작업 0303 어드민 줄 목록) — 머지된 PR 의 실제 기록만 · 받지 못하면 이유 · 시각 옆 "몇 분 전"(30초마다 다시 셈)
// 줄 만들기 · 다시 받기는 use-record-lines (그리기만)
import type { TasksSummary } from "@hav/shared/tasks";
import type { Fetched } from "@hav/shared/api";
import { Panel, Stamp } from "@/shared/ui/panel/panel";
import { useRecordLines } from "./use-record-lines";

export function RecordCard({ buildTasks }: { buildTasks: Fetched<TasksSummary> }) {
  const r = useRecordLines(buildTasks);
  return (
    <Panel id="log-live" testId="record-card" title="실시간 기록" meta={<Stamp>한국 시간</Stamp>}>
      {!r.ok ? (
        <p className="adm-empty">기록을 받지 못했습니다 ({r.reason})</p>
      ) : r.lines.length === 0 ? (
        <p className="adm-empty">아직 머지된 기록이 없습니다</p>
      ) : (
        <ul className="adm-rows">
          {r.lines.map((l) => (
            <li key={l.key}>
              <span className="t">{l.time}</span>
              <span>
                {l.text}
                {l.rel !== null && <span className="adm-rel">{l.rel}</span>}
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
