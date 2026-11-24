"use client";

// 오늘 팀이 한 일 · 자동 검사 (작업 0170 실시간 기록 → 작업 0341) — 오늘 할 일 이슈의 체크 항목 · 최근 자동 검사 결과 · 받지 못한 자료는 "자료 없음"
// 문구 계산은 today-gate · 받기는 use-today-gate (그리기만)
import type { Fetched } from "@hav/shared/api";
import type { TasksSummary } from "@hav/shared/tasks";
import { Panel, Stamp } from "@/shared/ui/panel/panel";
import { useTodayGate } from "./use-today-gate";

export function RecordCard({ buildTasks }: { buildTasks: Fetched<TasksSummary> }) {
  const r = useTodayGate(buildTasks);
  return (
    <Panel id="log-live" testId="record-card" title="오늘 팀이 한 일 · 자동 검사" meta={<Stamp>한국 시간</Stamp>}>
      {!r.ok ? (
        <p className="adm-empty">기록을 받지 못했습니다 ({r.reason})</p>
      ) : (
        <>
          {r.today ? (
            <ul className="adm-rows">
              <li>
                <span className="t">{r.today.progress}</span>
                <span data-testid="today-headline">
                  <b>{r.today.headline}</b>{" "}
                  <a className="adm-link" href={r.today.issue.href} target="_blank" rel="noopener noreferrer">
                    {r.today.issue.label}
                  </a>
                </span>
              </li>
              {r.today.items.map((i) => (
                <li key={i.key} data-testid="today-item" data-done={i.done}>
                  <span className="t">{i.mark}</span>
                  <b>{i.head}</b>
                </li>
              ))}
            </ul>
          ) : (
            <p className="adm-empty" data-testid="today-empty">
              오늘 할 일: 자료 없음
            </p>
          )}
          {r.gate ? (
            <ul className="adm-rows">
              <li data-testid="gate-count">
                <span className="t">검사</span>
                <span>{r.gate.count}</span>
              </li>
              <li data-testid="gate-time">
                <span className="t">시간</span>
                <span>{r.gate.time}</span>
              </li>
              {r.gate.failed.map((f) => (
                <li key={f.href} data-testid="gate-fail">
                  <span className="t">실패</span>
                  <a className="adm-link" href={f.href} target="_blank" rel="noopener noreferrer">
                    {f.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="adm-empty" data-testid="gate-empty">
              자동 검사: 자료 없음
            </p>
          )}
        </>
      )}
      <div className="adm-foot">
        <p className="adm-note">자료: GitHub 오늘 할 일 이슈 · 검사 실행 기록 (3초마다 갱신)</p>
      </div>
    </Panel>
  );
}
