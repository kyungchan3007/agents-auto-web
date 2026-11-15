"use client";

// 실시간 기록 장면 ①~③ — 차례로 쌓음 (작업 0170: 스크롤로 장면이 바뀌는 고정 패널과 바다 띠를 걷어 냄)
import { LivePanel, type Mode } from "./live-panel";
import type { Activity } from "../hooks/use-activity";
import { Title } from "@hav/ui/text/heading";

const SCENES: { mode: Mode; title: string; body: (blocked: number) => string }[] = [
  { mode: "status", title: "에이전트의 현재 작업.", body: () => "에이전트가 도구를 쓸 때마다 이 패널이 바뀝니다. 10분 넘게 기록이 없으면 대기 중으로 표시합니다." },
  { mode: "log", title: "한 줄씩, 실시간으로.", body: () => "파일 이름과 하는 일만 보입니다. 명령 · 파일 내용 · 비밀값은 전송하지 않습니다." },
  { mode: "blocked", title: "차단된 작업도 공개합니다.", body: (n) => (n > 0 ? `오늘 하네스가 차단한 횟수: ${n}회.` : "오늘 하네스가 차단한 작업은 없습니다.") },
];

function Caption({ i, blocked }: { i: number; blocked: number }) {
  return (
    <div>
      <Title as="p">{SCENES[i].title}</Title>
      <p className="mt-3 max-w-xl text-base text-fg-2 sm:text-lead">{SCENES[i].body(blocked)}</p>
    </div>
  );
}

export type Props = { activity: Activity; names: Record<string, string>; blocked: number };

export function StackedScenes({ activity, names, blocked }: Props) {
  return (
    <div className="space-y-20 bg-surface px-4 py-16 text-fg sm:px-8">
      {SCENES.map((s, i) => (
        <div key={s.mode} className="mx-auto max-w-3xl space-y-8">
          <Caption i={i} blocked={blocked} />
          <div className="relative">
            <LivePanel activity={activity} names={names} mode={s.mode} />
          </div>
        </div>
      ))}
    </div>
  );
}
