"use client";

// 계산 결과 글자판 — 출발 안내판 모양(B · 칸마다 이음선 · 노랑 글자)이되 칸 글자는 카운트업 값을 그대로 보임 (작업 0219 사용자 지적)
//   글자판의 무작위 넘김(flip)은 쓰지 않음 — 값이 올라가며 맞춰지는 움직임 하나만 (이중으로 움직이지 않게) · 서버 첫 그림 · 움직임 줄이기는 바로 최종 값
//   화면 읽기 도구는 판 전체를 최종 값 한 문장(label)으로 읽고 칸 글자는 읽지 않음
import { formatCount, useCountTween } from "@hav/ui/hooks/use-count-tween";

const MIN_COLS = 8;

export function ResultBoard({ amount, label }: { /** 최종 값(원 · 정수) — 없으면 "—" */ amount: number | null; label: string }) {
  const { ref, value } = useCountTween<HTMLDivElement>(amount ?? 0, 0);
  const text = amount === null ? "—" : `${formatCount(value, 0)}원`;
  const cols = Math.max(MIN_COLS, Array.from(label).length);
  const cells = [...Array.from({ length: Math.max(0, cols - Array.from(text).length) }, () => ""), ...Array.from(text)]; // 오른쪽 정렬
  return (
    <div ref={ref} data-testid="flap-board" role="img" aria-label={label} className="inline-flex max-w-full min-w-0 flex-col rounded-[10px] bg-pin-ink p-3 sm:p-4">
      <div className="flex gap-[3px] text-sun sm:gap-1">
        {cells.map((c, i) => (
          <span key={i} aria-hidden className="relative flex h-10 w-[1.55rem] min-w-0 shrink items-center justify-center rounded-[3px] bg-flap-cell font-display text-[1.3rem] font-extrabold tracking-display tabular-nums sm:h-12 sm:w-8 sm:text-[1.6rem]">
            {c}
            <span aria-hidden className="absolute inset-x-0 top-1/2 h-px bg-on-band" />
          </span>
        ))}
      </div>
    </div>
  );
}
