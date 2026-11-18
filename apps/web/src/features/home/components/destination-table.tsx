"use client";

// 도착지별 환전 타이밍 목록 — 흰 판 하나 · 선으로 줄 나눔 · 줄마다 국기 · 도시 · 통화 · 막대(쌈 · 중간 · 비쌈)+동그라미 · 금액 · 상태 (작업 0217 · 시안 A 목록)
//   금액 카운트업과 동그라미가 같은 진행 비율(useCountUp 의 progress)로 제자리까지 · 움직임 줄이기 · 서버 첫 그림 = 최종 값(금액 · 위치) · 숫자 글은 한 번만
//   화면에 들어오면 줄이 위에서부터 차례로(약 100ms 간격) 투명 → 보임 + 살짝 위로 나타나고, 그 줄의 카운트업 · 동그라미가 같은 순간 시작 (한 번만 · 움직임 줄이기 · 서버 첫 그림 = 그대로 보임)
//   눈금 · 판정은 사이트 신호 규칙 그대로 (최근 90일 안의 위치 · SIG-01~05) · 신호가 없으면 "신호 없음" · 줄 전체가 그 통화 상세로
import { Flag } from "@hav/ui/data/flag";
import { formatCount, useCountUp } from "@hav/ui/hooks/use-count-up";
import Link from "next/link";
import { type RevealPhase, useStaggerReveal } from "../hooks/use-stagger-reveal";
import type { DestinationRowData } from "../lib/destinations";
import { dotPosition } from "../lib/dest-motion";

const DOT = { cheap: "bg-pin-cheap", normal: "bg-pin-line", expensive: "bg-pin-expensive" } as const;

// 나타나는 모양 — 숨김 준비가 된 뒤에만 붙음(서버 · 움직임 줄이기는 그대로 보임)
const REVEAL = {
  final: "",
  hidden: "translate-y-3 opacity-0 transition-[opacity,transform] duration-500 ease-out",
  shown: "translate-y-0 opacity-100 transition-[opacity,transform] duration-500 ease-out",
} as const;

function Row({ row, phase }: { row: DestinationRowData; phase: RevealPhase }) {
  const { ref, value, progress } = useCountUp<HTMLDivElement>(row.rateValue ?? 0, { digits: row.rateDigits, enabled: phase !== "hidden" });
  const shown = row.rateValue === null ? null : `${formatCount(value, row.rateDigits)}원`;
  const pos = row.position === null ? null : dotPosition(row.position, progress);
  const body = (
    <div ref={ref} data-testid="dest-row" data-reveal={phase} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-4 py-5 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1.7fr)_minmax(0,0.8fr)] sm:gap-x-8 sm:gap-y-0">
      <div className="flex min-w-0 items-center gap-4">
        <span data-testid="dest-flag" className="shrink-0">
          <Flag country={row.flag} label={row.flagLabel} className="h-7 w-[2.625rem] sm:h-8 sm:w-12" />
        </span>
        <div className="min-w-0">
          <p data-testid="dest-city" className="text-[1.375rem] leading-tight font-extrabold tracking-display text-fg sm:text-[1.75rem]">
            {row.city}
          </p>
          <p className="mt-0.5 text-small text-fg-2">{row.currencyLabel}</p>
        </div>
      </div>
      <div className="text-right sm:col-start-3 sm:row-start-1">
        {shown && (
          <p data-testid="dest-rate" data-final={row.rateText} className="text-[1.375rem] leading-tight font-extrabold tracking-display text-fg tabular-nums sm:text-[1.75rem]">
            {shown}
          </p>
        )}
        {row.signal && row.pinText ? (
          <p data-testid="dest-status" className="mt-1 inline-flex items-center gap-1.5 text-small font-semibold text-fg-2">
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
    <Link href={row.href} className={`block ${REVEAL[phase]} hover:bg-surface-2/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`}>
      {body}
    </Link>
  ) : (
    <div className={REVEAL[phase]}>{body}</div>
  );
}

export function DestinationTable({ rows }: { rows: DestinationRowData[] }) {
  const { ref, phase } = useStaggerReveal<HTMLDivElement>(rows.length);
  return (
    <div ref={ref} data-testid="dest-list" className="mt-8 divide-y divide-line rounded-[1.5rem] border-2 border-line bg-card px-5 py-2 sm:px-8">
      {rows.map((row, i) => (
        <Row key={row.id} row={row} phase={phase(i)} />
      ))}
    </div>
  );
}
