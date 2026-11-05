"use client";

// 가운데 패널 장면 ①~③ — 고정 패널(스크롤로 장면 바뀜) · 움직임 줄이기면 차례로 쌓음
import { AnimatePresence, motion } from "motion/react";
import type { Mood } from "@hav/ui/three/worker-cat";
import { WorkerCatLazy } from "@hav/ui/three/lazy";
import { LivePanel, type Mode } from "./live-panel";
import { MOOD_TEXT } from "./mood";
import type { Activity } from "./use-activity";
import { usePinnedScene } from "./use-pinned-scene";
import { Title } from "@hav/ui/heading";

const SCENES: { mode: Mode; title: string; body: (blocked: number) => string }[] = [
  { mode: "status", title: "에이전트의 현재 작업.", body: () => "에이전트가 도구를 쓸 때마다 이 패널이 바뀝니다. 10분 넘게 기록이 없으면 대기 중으로 표시합니다." },
  { mode: "log", title: "한 줄씩, 실시간으로.", body: () => "파일 이름과 하는 일만 보입니다. 명령 · 파일 내용 · 비밀값은 전송하지 않습니다." },
  { mode: "blocked", title: "차단된 작업도 공개합니다.", body: (n) => (n > 0 ? `오늘 하네스가 차단한 횟수: ${n}회.` : "오늘 하네스가 차단한 작업은 없습니다.") },
];

function Caption({ i, blocked }: { i: number; blocked: number }) {
  return (
    <div className="text-center">
      <Title as="p">{SCENES[i].title}</Title>
      <p className="mx-auto mt-3 max-w-xl text-base text-fg-2 sm:text-lead">{SCENES[i].body(blocked)}</p>
    </div>
  );
}

export type Props = { activity: Activity; names: Record<string, string>; blocked: number; mood: Mood };

/** 🐱 패널에 걸터앉은 작업 고양이 — 넓은 화면은 패널 오른쪽 옆 · 휴대폰은 패널 오른쪽 위 모서리 */
function Buddy({ mood }: { mood: Mood }) {
  return (
    <WorkerCatLazy
      mood={mood}
      label={MOOD_TEXT[mood]}
      className="pointer-events-none absolute -top-24 -right-2 z-10 size-28 sm:-top-32 sm:size-36 xl:top-auto xl:-right-56 xl:bottom-0 xl:size-56"
    />
  );
}

export function PinnedScenes({ activity, names, blocked, mood }: Props) {
  const { ref, scale, opacity, scene } = usePinnedScene();

  // 장면 셋을 넘기는 스크롤 길이 — 휴대폰은 짧게 (330vh 면 같은 패널을 두 화면 넘게 밀어야 했음 · 작업 0111)
  return (
    <div ref={ref} data-surface="dark" className="relative h-[230vh] bg-surface text-fg sm:h-[330vh]">
      <div className="sticky top-20 flex h-[calc(100svh-5rem)] sm:top-13 sm:h-[calc(100svh-3.25rem)] flex-col justify-center gap-8 px-4 sm:px-8">
        <div className="relative mx-auto h-36 w-full max-w-3xl sm:h-32">
          {/* initial={false}: 첫 장면은 숨겼다 보여 주지 않음 (JS 전에도 보임 · LCP) */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={scene} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.4 }}>
              <Caption i={scene} blocked={blocked} />
            </motion.div>
          </AnimatePresence>
        </div>
        {/* 고양이가 앉을 자리만큼 위를 비움 — 넓은 화면(xl)은 패널 옆이라 필요 없음 · 전엔 1,100px 안팎에서 설명 글을 가렸음 (작업 0062) */}
        <motion.div style={{ scale, opacity }} className="relative mx-auto mt-12 w-full max-w-3xl sm:mt-20 xl:mt-0">
          <Buddy mood={mood} />
          <LivePanel activity={activity} names={names} mode={SCENES[scene].mode} />
        </motion.div>
        <SceneDots scene={scene} />
      </div>
    </div>
  );
}

function SceneDots({ scene }: { scene: number }) {
  return (
    <div className="flex justify-center gap-2" aria-hidden>
      {SCENES.map((s, i) => (
        <span key={s.mode} className={`h-1.5 rounded-full transition-all duration-500 ${i === scene ? "w-6 bg-accent" : "w-1.5 bg-line"}`} />
      ))}
    </div>
  );
}

export function StackedScenes({ activity, names, blocked, mood }: Props) {
  return (
    <div data-surface="dark" className="space-y-24 bg-surface px-4 py-24 text-fg sm:px-8">
      {SCENES.map((s, i) => (
        <div key={s.mode} className="mx-auto max-w-3xl space-y-8">
          <Caption i={i} blocked={blocked} />
          <div className={`relative ${i === 0 ? "mt-12 sm:mt-20 xl:mt-0" : ""}`}>
            {i === 0 && <Buddy mood={mood} />}
            <LivePanel activity={activity} names={names} mode={s.mode} />
          </div>
        </div>
      ))}
    </div>
  );
}
