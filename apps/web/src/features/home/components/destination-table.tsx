"use client";

// 도착지별 환전 타이밍 목록 — 흰 판 하나 · 선으로 줄 나눔 · 줄마다 국기 · 도시 · 통화 · 막대(쌈 · 중간 · 비쌈)+동그라미 · 금액 · 상태 (작업 0217 · 시안 A 목록)
//   금액 카운트업과 동그라미가 같은 진행 비율(useCountUp 의 progress)로 제자리까지 · 움직임 줄이기 · 서버 첫 그림 = 최종 값(금액 · 위치) · 숫자 글은 한 번만
//   화면에 들어오면 줄이 위에서부터 차례로(약 100ms 간격) 투명 → 보임 + 살짝 위로 나타나고, 그 줄의 카운트업 · 동그라미가 같은 순간 시작 (한 번만 · 움직임 줄이기 · 서버 첫 그림 = 그대로 보임)
//   요약 알약 펼치기(작업 0228 · 모션 13번): 카드가 화면 아래면 알약(국기들 + 요약 글)으로 접어 두었다가 윗부분이 들어오면 약 1초 동안 펼침 — 높이 · 모서리 → 줄 0.07초 간격 → 점은 가운데에서 오늘 자리로 · 금액은 90일 중간값에서 오늘 값으로(같은 시간) → 신호 글은 마지막 · 끝 상태 = 지금 운영 카드(인라인 값 · 알약 없음)
//   서버 첫 그림 · 움직임 줄이기 · 자바스크립트 꺼짐 = 처음부터 끝 상태 · 중간값이 없으면 금액은 오늘 값 그대로(카운트업 없음 · 숫자를 지어내지 않음)
//   눈금 · 판정은 사이트 신호 규칙 그대로 (최근 90일 안의 위치 · SIG-01~05) · 신호가 없으면 "신호 없음" · 줄 전체가 그 통화 상세로
import { Flag } from "@hav/ui/data/flag";
import { formatCount } from "@hav/ui/hooks/use-count-up";
import Link from "next/link";
import { useDestinationsPill } from "../hooks/use-destinations-pill";
import type { DestinationRowData } from "../lib/destinations";
import { type PillFrame, pillFrame, rateAt } from "../lib/dest-motion";
import { DestinationsPill } from "./destinations-pill";

const DOT = { cheap: "bg-pin-cheap", normal: "bg-pin-line", expensive: "bg-pin-expensive" } as const;

// 끝 상태의 진행 — 모두 1 (운영 카드 그대로)
const DONE: PillFrame = { grow: 1, pill: 0, row: 1, move: 1, status: 1 };

// f = 이 줄의 펼침 진행 · motion=false 면(끝 상태) 인라인 값 없이 그대로 그림
function Row({ row, f, motion }: { row: DestinationRowData; f: PillFrame; motion: boolean }) {
  const shown = row.rateValue === null ? null : `${formatCount(rateAt(row.rateStart, row.rateValue, f.move, row.rateDigits), row.rateDigits)}원`;
  const pos = row.position === null ? null : 0.5 + (row.position - 0.5) * f.move; // 가운데 선 → 오늘 자리
  const rowStyle = motion ? { opacity: f.row, transform: `translateY(${(1 - f.row) * 10}px)` } : undefined;
  const statusStyle = motion ? { opacity: f.status, transform: `translateY(${(1 - f.status) * 4}px)` } : undefined;
  const body = (
    <div data-testid="dest-row" className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-4 py-5 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1.7fr)_minmax(0,0.8fr)] sm:gap-x-8 sm:gap-y-0">
      <div className="flex min-w-0 items-center gap-4">
        <span data-testid="dest-flag" className="shrink-0">
          <Flag country={row.flag} label={row.flagLabel} className="h-7 w-[2.625rem] sm:h-8 sm:w-12" />
        </span>
        <div className="min-w-0">
          <p data-testid="dest-city" className="text-[1.375rem] leading-tight font-bold tracking-display text-fg sm:text-[1.75rem]">
            {row.city}
          </p>
          <p className="mt-0.5 text-small text-fg-2">{row.currencyLabel}</p>
        </div>
      </div>
      <div className="text-right sm:col-start-3 sm:row-start-1">
        {shown && (
          <p data-testid="dest-rate" data-final={row.rateText} data-start={row.rateStart ?? undefined} className="text-[1.375rem] leading-tight font-bold tracking-display text-fg tabular-nums sm:text-[1.75rem]">
            {shown}
          </p>
        )}
        {row.signal && row.pinText ? (
          <p data-testid="dest-status" style={statusStyle} className="mt-1 inline-flex items-center gap-1.5 text-small font-semibold text-fg-2">
            <span aria-hidden className={`size-2 rounded-full ${DOT[row.signal]}`} />
            {row.pinText}
          </p>
        ) : (
          <p className="mt-1 text-small text-fg-2">{row.note}</p>
        )}
      </div>
      {row.signal && pos !== null && (
        <div data-testid="dest-scale" className="col-span-2 sm:col-span-1 sm:col-start-2 sm:row-start-1">
          <div className="relative h-5" aria-hidden>
            <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-line" />
            <div className="absolute top-1/2 left-1/2 h-4 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-fg" />
            <span
              data-testid="dest-dot"
              data-position={row.position}
              className={`absolute top-1/2 size-[1.125rem] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-card ring-[1.5px] ${DOT[row.signal]} ${row.signal === "cheap" ? "ring-pin-cheap" : row.signal === "expensive" ? "ring-pin-expensive" : "ring-pin-line"}`}
              style={{ left: `${pos * 100}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[0.6875rem] text-fg-2" aria-hidden>
            <span>쌈</span>
            <span>중간</span>
            <span>비쌈</span>
          </div>
        </div>
      )}
    </div>
  );
  return row.href ? (
    <Link href={row.href} style={rowStyle} className="block hover:bg-surface-2/60">
      {body}
    </Link>
  ) : (
    <div style={rowStyle}>{body}</div>
  );
}

export function DestinationTable({ rows, windowDays = 90 }: { rows: DestinationRowData[]; windowDays?: number }) {
  const { ref, state, t, full, boot } = useDestinationsPill<HTMLDivElement>(rows.length);
  const motion = state !== "final";
  // 접힘 · 펼침 중 카드 틀 — 높이 · 모서리가 알약(--pill-h · 반지름 = 높이의 절반)에서 끝(full · 24px)으로 (끝에는 인라인 값 없음)
  const g = state === "pill" ? 0 : pillFrame(t, 0).grow;
  const style = motion
    ? { height: `calc(var(--pill-h) + (${full}px - var(--pill-h)) * ${g})`, borderRadius: `calc(var(--pill-h) / 2 + (24px - var(--pill-h) / 2) * ${g})`, overflow: "hidden" as const }
    : undefined;
  return (
    <div
      ref={ref}
      data-testid="dest-list"
      data-state={state}
      data-boot={boot ? "" : undefined}
      style={style}
      className="relative mt-8 divide-y divide-line rounded-[1.5rem] border-2 border-line bg-card px-5 py-2 [--pill-h:4.75rem] sm:px-8 sm:[--pill-h:4.5rem]"
    >
      {(state !== "final" || boot) && <DestinationsPill rows={rows} windowDays={windowDays} fade={state === "expanding" ? pillFrame(t, 0).pill : 1} />}
      {rows.map((row, i) => (
        <Row key={row.id} row={row} f={state === "pill" ? pillFrame(0, i) : state === "expanding" ? pillFrame(t, i) : DONE} motion={motion} />
      ))}
    </div>
  );
}
