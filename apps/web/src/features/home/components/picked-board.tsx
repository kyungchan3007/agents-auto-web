"use client";

// 홈 안내판 — 인트로에서 고른 나라가 있으면 같은 FlapBoard 로 "내가 고른 여행지 · 오늘 환율"을 그림 (고른 값이 바뀌면 key 로 다시 넘어감) (작업 0185)
// 고르지 않았으면 서버가 그린 지금 안내판(children) 그대로 · 왼쪽 아래 "탑승권 보기" 버튼을 누르면 탑승권 요약 · 숫자는 빌드 때 받은 값 — 없으면 "환율 없음"
import { FlapBoard } from "@hav/ui/data/flap-board";
import type { ReactNode } from "react";
import { usePickedDestination } from "../hooks/use-picked-destination";
import type { RateRow, SignalRow } from "../lib/destinations";
import { pickedBoard, pickedChip } from "../lib/picked";

const BOARD_COLS = 12;

export function PickedBoard({ rates, signals, windowDays, children }: { rates: RateRow[]; signals: SignalRow[]; windowDays: number; children: ReactNode }) {
  const { picked, passOpen, togglePass } = usePickedDestination();
  const board = pickedBoard({ picked, rates, signals, windowDays });
  if (!picked || !board) return <>{children}</>;
  return (
    <>
      <h2 id="today-title" className="text-base font-normal text-accent">
        {board.title}
      </h2>
      <FlapBoard key={`${picked.country}-${picked.city}`} rows={board.rows} cols={BOARD_COLS} label={board.label} className="mt-3" />
      <p className="mt-5 text-body text-accent">{board.evidence}</p>
      <button
        type="button"
        data-testid="picked-pass"
        aria-expanded={passOpen}
        onClick={togglePass}
        className="fixed bottom-6 left-6 z-40 rounded-xl bg-pin-ink px-4 py-2.5 text-sm font-extrabold text-sun shadow-[0_14px_30px_-16px_rgba(22,36,110,0.7)]"
      >
        {pickedChip(picked)}
      </button>
      {passOpen && (
        <aside aria-label="탑승권" className="fixed bottom-20 left-6 z-40 w-[340px] rounded-2xl bg-pin-ink px-4 py-4 text-sm text-foam shadow-[0_18px_40px_-16px_rgba(22,36,110,0.6)]">
          <p className="m-0 text-xs font-bold tracking-wider text-foam/70">BOARDING PASS · 탑승권</p>
          <dl className="m-0 mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
            {picked.budget > 0 && (
              <>
                <dt className="text-foam/70">예산</dt>
                <dd className="m-0 font-semibold">{picked.budget.toLocaleString("ko-KR")}원</dd>
              </>
            )}
            <dt className="text-foam/70">환율</dt>
            <dd className="m-0 font-semibold">{board.rows[1].text}</dd>
            <dt className="text-foam/70">판정</dt>
            <dd className="m-0 font-semibold">{board.evidence}</dd>
          </dl>
        </aside>
      )}
    </>
  );
}
