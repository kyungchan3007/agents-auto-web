"use client";

// 새 홈 탑승권 카드 — 파랑 면과 하늘 면 경계에 걸침 · 위: 제목 + 글자판(0216 FlapBoard) · 절취선 · 아래: 판정 한 줄 + 막대 + 여행지 고르기 (작업 0217 · 시안 B)
//   걸침: 카드가 둘로 나뉜 줄(grid 두 줄)이고 파랑 띠가 첫 줄 높이만큼만 깔림 — 카드 높이가 변해도 경계가 카드 안 절취선에 그대로 맞음 (그라데이션 · 음수 여백 없음)
//   안내판 규칙은 지금 그대로 — 서버가 그린 지금 안내판(initial) · 인트로나 시트로 고른 나라가 있으면 같은 판이 그 나라로(고르면 바로 바뀜) · 처음 한 번만 넘어감
import { FlapBoard } from "@hav/ui/data/flap-board";
import { PickTrip } from "@hav/ui/form/pick-trip";
import type { ReactNode } from "react";
import { usePickedDestination } from "../hooks/use-picked-destination";
import type { RateRow, SignalRow } from "../lib/destinations";
import { pickedBoard, pickedChip } from "../lib/picked";
import type { BoardRow } from "../lib/today-board";

type Board = { title: string; rows: [BoardRow, BoardRow]; label: string; evidence: string; percentile: number | null };

const BOARD_COLS = 12;

/** "97%" 같은 숫자를 굵고 파랑으로 — 글은 그대로 */
function Evidence({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\d+%)/).map((part, i) =>
        /^\d+%$/.test(part) ? (
          <em key={i} className="text-[1.375rem] font-extrabold text-cheap not-italic">
            {part}
          </em>
        ) : (
          part
        ),
      )}
    </>
  );
}

export function Ticket({ initial, rates, signals, windowDays, notice }: { initial: Board; rates: RateRow[]; signals: SignalRow[]; windowDays: number; notice?: ReactNode }) {
  const { picked, passOpen, togglePass } = usePickedDestination();
  const chosen = pickedBoard({ picked, rates, signals, windowDays });
  const board: Board = picked && chosen ? chosen : initial;
  const pct = board.percentile;
  return (
    <section id="today" aria-labelledby="today-title" className="text-fg">
      <div className="grid grid-cols-[minmax(1rem,1fr)_minmax(0,45rem)_minmax(1rem,1fr)] sm:grid-cols-[minmax(2rem,1fr)_minmax(0,45rem)_minmax(2rem,1fr)]">
        <div data-testid="ticket-band" aria-hidden className="col-span-3 row-start-1 bg-pin-cheap" />
        <div data-testid="ticket" className="relative z-10 col-start-2 row-span-2 row-start-1 grid grid-rows-subgrid rounded-[1.75rem] bg-card shadow-ticket">
          <div className="px-4 pt-6 pb-5 sm:px-8 sm:pt-7 sm:pb-6">
            <h2 id="today-title" className="text-[0.9375rem] font-bold text-fg">
              {board.title}
            </h2>
            <div className="mt-4 flex justify-center">
              <FlapBoard key={picked && chosen ? `${picked.country}-${picked.city}` : "today"} rows={board.rows} cols={BOARD_COLS} label={board.label} />
            </div>
          </div>
          <div className="relative flex flex-col gap-4 px-4 pt-5 pb-6 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-8 sm:pb-7">
            <div aria-hidden className="absolute top-0 right-[22px] left-[22px] border-t-2 border-dashed border-line before:absolute before:-top-[15px] before:-left-[38px] before:size-7 before:rounded-full before:bg-pin-cheap before:content-[''] after:absolute after:-top-[15px] after:-right-[38px] after:size-7 after:rounded-full after:bg-pin-cheap after:content-['']" />
            <div className="min-w-0 flex-1">
              <p data-testid="ticket-evidence" className="text-[1.0625rem] font-bold text-fg">
                <Evidence text={board.evidence} />
              </p>
              {pct !== null && (
                <div data-testid="ticket-bar" aria-hidden className="relative mt-3 h-2 rounded-full bg-surface">
                  <div className="absolute inset-y-0 left-0 rounded-full bg-pin-cheap" style={{ width: `${Math.max(2, Math.round(pct * 100))}%` }} />
                  <div className="absolute -inset-y-1 left-1/2 w-0.5 bg-fg-2" />
                </div>
              )}
              {notice}
            </div>
            <PickTrip variant="solid" label="내 여행지 고르기" changeLabel="여행지 바꾸기" className="w-full sm:w-auto sm:shrink-0" />
          </div>
        </div>
      </div>
      {picked && chosen && (
        <>
          <button
            type="button"
            data-testid="picked-pass"
            aria-expanded={passOpen}
            onClick={togglePass}
            className="fixed bottom-6 left-6 z-40 rounded-xl bg-pin-ink px-4 py-2.5 text-sm font-extrabold text-sun shadow-chip"
          >
            {pickedChip(picked)}
          </button>
          {passOpen && (
            <aside aria-label="탑승권" className="fixed bottom-20 left-6 z-40 w-[340px] rounded-2xl bg-pin-ink px-4 py-4 text-sm text-foam shadow-pass">
              <p className="m-0 text-xs font-bold tracking-wider text-foam/70">BOARDING PASS · 탑승권</p>
              <dl className="m-0 mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                {picked.budget > 0 && (
                  <>
                    <dt className="text-foam/70">예산</dt>
                    <dd className="m-0 font-semibold">{picked.budget.toLocaleString("ko-KR")}원</dd>
                  </>
                )}
                <dt className="text-foam/70">환율</dt>
                <dd className="m-0 font-semibold">{chosen.rows[1].text}</dd>
                <dt className="text-foam/70">판정</dt>
                <dd className="m-0 font-semibold">{chosen.evidence}</dd>
              </dl>
            </aside>
          )}
        </>
      )}
    </section>
  );
}
