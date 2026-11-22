"use client";

// 새 홈 탑승권 카드 — 파랑 면과 하늘 면 경계에 걸침 · 위: 제목 + 글자판(0216 FlapBoard) · 절취선 · 아래: 판정 한 줄 + 막대 + 여행지 고르기 (작업 0217 · 시안 B)
//   화면 높이(작업 0217 · 미리보기 뒤 고칠 것 2): 폭 lg 이상에서 높이 구간(880 이하 · 881~1000 · 1001~1180)마다 카드 폭 · 안쪽 여백 · 글자판 칸 높이만 줄여 노트북 높이에서도 판 · 97% 줄 · 칩 · 검색 칸이 첫 화면 안 (hero-section 과 같은 구간)
//   걸침: 카드가 둘로 나뉜 줄(grid 두 줄)이고 파랑 띠가 첫 줄 높이만큼만 깔림 — 카드 높이가 변해도 경계가 카드 안 절취선에 그대로 맞음 (그라데이션 · 음수 여백 없음)
//   여행지 바꾸기는 카드 안 칩 · 검색(TripSwitcher · 버튼 · 시트 없음 · 작업 0217 사용자 지적)
//   안내판 규칙은 지금 그대로 — 서버가 그린 지금 안내판(initial) · 인트로나 시트로 고른 나라가 있으면 같은 판이 그 나라로(고르면 바로 바뀜) · 처음 한 번만 넘어감
import { FlapBoard } from "@hav/ui/data/flap-board";
import { TripSwitcher } from "@hav/ui/form/trip-switcher";
import type { ReactNode } from "react";
import { usePickedDestination } from "./use-picked-destination";
import type { RateRow, SignalRow } from "../common/destinations";
import { pickedBoard, pickedChip } from "./picked";
import type { BoardRow } from "./today-view";

type Board = { title: string; rows: [BoardRow, BoardRow]; label: string; evidence: string; percentile: number | null };

const BOARD_COLS = 12;

/** "97%" 같은 숫자를 굵고 파랑으로 — 글은 그대로 */
function Evidence({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\d+%)/).map((part, i) =>
        /^\d+%$/.test(part) ? (
          <em key={i} className="text-[1.375rem] font-bold text-cheap not-italic">
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
  const { picked, passOpen, passLeaving, togglePass, holdPass } = usePickedDestination();
  const chosen = pickedBoard({ picked, rates, signals, windowDays });
  const board: Board = picked && chosen ? chosen : initial;
  const pct = board.percentile;
  return (
    <section id="board" aria-labelledby="today-title" className="text-fg">
      <div className="grid grid-cols-[minmax(1rem,1fr)_minmax(0,45rem)_minmax(1rem,1fr)] sm:grid-cols-[minmax(2rem,1fr)_minmax(0,45rem)_minmax(2rem,1fr)] lg:[@media(max-height:880px)]:grid-cols-[minmax(2rem,1fr)_minmax(0,34rem)_minmax(2rem,1fr)] lg:[@media(min-height:881px)_and_(max-height:1000px)]:grid-cols-[minmax(2rem,1fr)_minmax(0,38rem)_minmax(2rem,1fr)]">
        <div data-testid="ticket-band" aria-hidden className="col-span-3 col-start-1 row-start-1 -mb-[13px] bg-pin-cheap" />
        <div data-testid="ticket" className="relative z-10 col-start-2 row-span-2 row-start-1 grid grid-cols-[minmax(0,1fr)] grid-rows-subgrid rounded-[1.5rem] border border-line bg-card shadow-ticket">
          <div className="px-4 pt-6 pb-5 sm:px-8 sm:pt-7 sm:pb-6 lg:[@media(max-height:880px)]:pt-4 lg:[@media(max-height:880px)]:pb-3 lg:[@media(min-height:881px)_and_(max-height:1000px)]:pt-5 lg:[@media(min-height:881px)_and_(max-height:1000px)]:pb-4">
            <h2 id="today-title" className="text-[0.9375rem] font-bold text-fg">
              {board.title}
            </h2>
            <div className="mt-4 flex justify-center lg:[@media(max-height:880px)]:mt-2 lg:[@media(min-height:881px)_and_(max-height:1000px)]:mt-3">
              <FlapBoard key={picked && chosen ? `${picked.country}-${picked.city}` : "today"} rows={board.rows} cols={BOARD_COLS} label={board.label} className="lg:[@media(max-height:880px)]:gap-2 lg:[@media(max-height:880px)]:p-3 lg:[@media(max-height:880px)]:**:data-[testid=flap-cell]:h-9 lg:[@media(max-height:880px)]:**:data-[testid=flap-cell]:text-[1.375rem] lg:[@media(min-height:881px)_and_(max-height:1000px)]:p-4 lg:[@media(min-height:881px)_and_(max-height:1000px)]:**:data-[testid=flap-cell]:h-11 lg:[@media(min-height:881px)_and_(max-height:1000px)]:**:data-[testid=flap-cell]:text-[1.75rem]" />
            </div>
          </div>
          <div className="relative flex flex-col gap-5 px-4 pt-5 pb-6 sm:px-8 sm:pb-7 lg:[@media(max-height:880px)]:gap-3 lg:[@media(max-height:880px)]:pt-3 lg:[@media(max-height:880px)]:pb-4 lg:[@media(min-height:881px)_and_(max-height:1000px)]:gap-4 lg:[@media(min-height:881px)_and_(max-height:1000px)]:pt-4 lg:[@media(min-height:881px)_and_(max-height:1000px)]:pb-5">
            {/* 절취선 + 가장자리 홈 (시안 B .perf) — 홈은 카드 안쪽으로 잘린 반원 · 색 = 뒤 바탕(파랑 면) · 파랑 띠가 홈 아래 끝(절취선 + 13px)까지 내려와 홈이 통째로 파랑 안에 있어 파인 것으로 보임 */}
            <div aria-hidden data-testid="ticket-hole-clip" className="pointer-events-none absolute inset-x-[-1px] -top-[15px] h-7 overflow-hidden">
              <span data-testid="ticket-hole" className="absolute top-0 -left-[14px] size-7 rounded-full bg-pin-cheap" />
              <span data-testid="ticket-hole" className="absolute top-0 -right-[14px] size-7 rounded-full bg-pin-cheap" />
            </div>
            <div aria-hidden data-testid="ticket-perf" className="absolute top-0 right-[22px] left-[22px] border-t-2 border-dashed border-line" />
            <div className="min-w-0">
              <p data-testid="ticket-evidence" className="text-[1.125rem] font-bold text-fg">
                <Evidence text={board.evidence} />
              </p>
              {pct !== null && (
                <div data-testid="ticket-bar" aria-hidden className="relative mt-3 h-2 rounded-full bg-surface-2">
                  <div className="absolute inset-y-0 left-0 rounded-full bg-pin-cheap" style={{ width: `${Math.max(2, Math.round(pct * 100))}%` }} />
                  <div className="absolute -inset-y-1 left-1/2 w-0.5 bg-fg-2" />
                </div>
              )}
              {notice}
            </div>
            {/* 여행지는 시트 · 버튼 없이 카드 안에서 바로 바꿈 — 칩을 누르면 판 · 판정 줄 · 막대가 바로 바뀜 (작업 0217 사용자 지적) */}
            <TripSwitcher />
            {/* 떠 있던 "탑승권 보기" 단추를 카드 안 검색 칸 아래 글 링크로 (작업 0249 · 16번) — 글은 pickedChip 에서 비행기 기호만 빼고 · 뒤에 ›  */}
            {picked && chosen && (
              <button
                type="button"
                data-testid="picked-pass"
                aria-expanded={passOpen}
                onClick={togglePass}
                className="self-start border-b-2 border-cheap pb-0.5 text-body font-semibold text-cheap hover:text-fg"
              >
                {`${pickedChip(picked).replace(/^✈\s*/, "").replace(" · ", " ")} ›`}
              </button>
            )}
          </div>
        </div>
      </div>
      {picked && chosen && (
        <>
          {passOpen && (
            <aside
              aria-label="탑승권"
              data-leaving={passLeaving}
              onPointerEnter={() => holdPass(true)}
              onPointerLeave={() => holdPass(false)}
              className="fixed bottom-20 left-6 z-40 w-[340px] rounded-[0.875rem] bg-pin-ink px-4 py-4 text-sm text-foam shadow-pass transition-[opacity,transform] duration-[220ms] ease-out starting:translate-y-2.5 starting:opacity-0 data-[leaving=true]:translate-y-2.5 data-[leaving=true]:opacity-0 data-[leaving=true]:duration-500 data-[leaving=true]:ease-in motion-reduce:starting:translate-y-0 motion-reduce:data-[leaving=true]:translate-y-0"
            >
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
