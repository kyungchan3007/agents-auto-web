"use client";

// 출발 안내판 — 짙은 남색 판 위에 글자 칸(고정폭 · 칸 가운데 이음선) · 두 줄 모두 햇빛 노랑 (작업 0177 · 스플릿 플랩)
//   칸은 HTML/CSS (3D 아님) · 글자 하나 = 한 칸(한글 · 숫자 · 기호) · 처음 한 번만 넘어가며 맞춰짐(1~2초) · 움직임 줄이기면 바로 최종 글자 · 다시 돌지 않음
//   첫 그림(서버)은 최종 글자 — 움직임이 못 돌아도 글자는 보임 · 화면 읽기 도구는 판 전체를 한 문장(label)으로 읽고 칸 글자는 읽지 않음
//   모양은 시안 B(작업 0216) — 칸 #1f3190 · 칸 가운데 이음선 · 노랑 글자(줄마다 white 로 흰 글자 선택)
//   벽에 걸린 물건처럼 — 짙은 남색 판 + 부드러운 그림자 · 모서리 10px (작업 0177) · 그라데이션 없음
import { useReducedMotion } from "motion/react";
import { useFlapOnce } from "../../hooks/use-flap-once";
import { type FlipStep, flipDurationMs, flipPlan, toCells } from "../../lib/flap";

type Row = { text: string | null; tone: "dest" | "money" | "white" };

// 줄 종류별 글자 색 — 기본은 햇빛 노랑 (작업 0177: 도착지 줄도 노랑) · white = 흰 글자 줄 (작업 0216 · 시안 B 의 .w)
const TONE = { dest: "text-sun", money: "text-sun", white: "text-foam" } as const;

/** 넘어가는 중이면 그 시각의 글자 · 아니면 최종 글자 */
function glyphAt(step: FlipStep | undefined, cell: string, elapsed: number | null): string {
  if (elapsed === null || !step) return cell;
  const local = elapsed - step.delayMs;
  if (local < 0) return step.frames[0];
  const i = Math.floor(local / step.stepMs);
  return i >= step.frames.length ? cell : step.frames[i];
}

export function FlapBoard({ rows, cols, label, className = "" }: { rows: Row[]; cols: number; label: string; className?: string }) {
  const cellRows = rows.map((r) => toCells(r.text, cols, { align: r.tone === "money" ? "right" : "left" }));
  const plans = cellRows.map((cells) => flipPlan(cells));
  const reduce = useReducedMotion();
  const { elapsed, played } = useFlapOnce(Math.max(0, ...plans.map((p) => flipDurationMs(p))), !!reduce);
  return (
    <div data-testid="flap-board" role="img" aria-label={label} data-played={played ? "true" : "false"} className={`inline-flex max-w-full min-w-0 flex-col gap-2 rounded-[10px] bg-pin-ink shadow-board p-3 sm:gap-3 sm:p-5 ${className}`}>
      {cellRows.map((cells, r) => (
        <div key={r} data-testid="flap-row" data-tone={rows[r].tone} className={`flex gap-[3px] sm:gap-1 ${TONE[rows[r].tone]}`}>
          {cells.map((cell, c) => (
            <span key={c} data-testid="flap-cell" aria-hidden className="relative flex h-9 w-[1.55rem] min-w-0 shrink items-center justify-center rounded-[3px] bg-flap-cell font-display text-[1.2rem] font-extrabold tracking-display tabular-nums sm:h-14 sm:w-10 sm:text-[1.9rem] lg:h-16 lg:w-12 lg:text-[2.2rem]">
              {glyphAt(plans[r][c], cell, elapsed)}
              <span data-testid="flap-seam" aria-hidden className="absolute inset-x-0 top-1/2 h-px bg-on-band" />
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
