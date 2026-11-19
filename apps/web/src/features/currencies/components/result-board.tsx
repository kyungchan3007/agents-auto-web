"use client";

// 계산 결과 글자판 — 출발 안내판 모양(B · 칸마다 이음선 · 노랑 글자) · 숫자 칸은 0227 굴러가는 숫자 부품(RollingNumber · 글자판형)으로 굴러감 (작업 0219 → 0231)
//   통화를 바꾸면(작업 0231 · 모션 4) 직전 글자판 값에서 새 값으로 칸마다 굴러감 · 처음 들어옴 · 새로 고침 · 금액을 고쳐 쓸 때는 지금 규칙(값이 바뀌면 바로 · 이어 가며) 그대로
//   서버 첫 그림 · 움직임 줄이기는 바로 최종 값 · 화면 읽기 도구는 판 전체를 최종 값 한 문장(label)으로 읽고 칸 글자는 읽지 않음 (flap-board · role=img · aria-label)
import { RollingNumber } from "@hav/ui/motion/rolling-number";

const MIN_COLS = 8;
const CELL = "h-10 w-[1.55rem] min-w-0 shrink rounded-[3px] bg-flap-cell font-display text-[1.3rem] font-extrabold tracking-display tabular-nums text-sun sm:h-12 sm:w-8 sm:text-[1.6rem]";

export function ResultBoard({ amount, label, from = null }: { /** 최종 값(원 · 정수) — 없으면 "—" */ amount: number | null; label: string; /** 통화를 바꾸기 전 글자판 값 — 거기서 굴러 시작 */ from?: number | null }) {
  const cols = Math.max(MIN_COLS, Array.from(label).length);
  return (
    <div data-testid="flap-board" role="img" aria-label={label} className="inline-flex max-w-full min-w-0 flex-col rounded-[10px] bg-pin-ink p-3 sm:p-4">
      {amount === null ? (
        <div className="flex gap-[3px] text-sun sm:gap-1">
          {Array.from({ length: cols }, (_, i) => (
            <span key={i} aria-hidden className={`relative flex items-center justify-center ${CELL}`}>
              {i === cols - 1 ? "—" : ""}
              <span aria-hidden className="absolute inset-x-0 top-1/2 h-px bg-on-band" />
            </span>
          ))}
        </div>
      ) : (
        <RollingNumber value={amount} suffix="원" slot="board" from={from} startDelay={220} className="flex gap-[3px] text-sun sm:gap-1" board={{ cols, cell: CELL, row: "h-10 sm:h-12" }} />
      )}
    </div>
  );
}
