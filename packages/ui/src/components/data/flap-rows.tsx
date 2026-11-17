"use client";

// 줄 글이 바뀌면 바뀐 칸만 넘어가는 출발 안내판 (작업 0194 · 인트로 로딩) — 홈 FlapBoard 와 같은 판 · 칸 · 이음선 · 노랑 글자
// 글자 하나 = 한 칸 · 정해진 글자판을 거침(난수 없음) · still(움직임 줄이기)이면 바로 최종 글자 · 화면 읽기 도구는 판 전체를 label 한 문장으로
import { useFlapRows } from "../../hooks/use-flap-rows";

type Props = { rows: string[]; cols: number; label: string; still?: boolean; testId?: string; rowTestId?: string; className?: string };

export function FlapRows({ rows, cols, label, still = false, testId, rowTestId, className = "" }: Props) {
  const cells = useFlapRows(rows, { cols, skip: still });
  return (
    <div data-testid={testId} role="img" aria-label={label} className={`inline-flex max-w-full flex-col gap-2 rounded-[10px] bg-pin-ink p-3 sm:gap-3 sm:p-5 ${className}`}>
      {cells.map((row, r) => (
        <div key={r} data-testid={rowTestId} data-text={rows[r]} className="flex gap-[3px] text-sun sm:gap-1">
          {row.map((ch, c) => (
            <span key={c} aria-hidden className="relative flex h-9 w-[1.55rem] items-center justify-center rounded-[3px] bg-flap-cell text-[1.2rem] font-extrabold tracking-display tabular-nums sm:h-14 sm:w-9 sm:text-[1.9rem] lg:h-16 lg:w-11 lg:text-[2.2rem]">
              {ch === " " ? "" : ch}
              <span aria-hidden className="absolute inset-x-0 top-1/2 h-px bg-on-band" />
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
