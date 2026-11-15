// 도착지 줄 — 위 2px 울트라마린 선 · 도시(Gasoek One 34) · 통화(작은 글) · 오늘 환율(강조 숫자 · 오른쪽 정렬) · 쌈~비쌈 눈금(가운데 세로 눈금 = 최근 90일 중간) 위 판정 핀 (작업 0168 · Figma)
// 표 대신 큰 글자 · 눈금 · 핀 — 모바일은 도시 · 통화와 핀만 · 값이 없으면 지어내지 않고 비움
import type { ReactNode } from "react";
import { type Signal, SignalPin } from "./signal-pin";

/** 값이 최저 ~ 최고 사이 어디쯤인지 0(쌈) ~ 1(비쌈) · 범위가 없거나 숫자가 유한하지 않으면 null (눈금을 그리지 않음) */
export function scalePosition(value: number, min: number, max: number): number | null {
  if (![value, min, max].every(Number.isFinite) || !(max > min)) return null;
  return Math.min(1, Math.max(0, (value - min) / (max - min)));
}

export type DestinationRowProps = {
  city: ReactNode;
  /** 통화 이름 · 단위 (예 "엔 100") */
  currency?: ReactNode;
  /** 오늘 환율 글자 (예 "912원") — 없으면 비움 */
  rate?: ReactNode;
  signal: Signal | null;
  /** 판정 핀 안 퍼센트 (없으면 글자만) */
  pct?: number | null;
  /** 쌈~비쌈 눈금 위 핀 위치 0~1 — scalePosition 으로 · null 이면 눈금을 그리지 않음 */
  position?: number | null;
  className?: string;
};

export function DestinationRow({ city, currency, rate, signal, pct, position = null, className = "" }: DestinationRowProps) {
  const showScale = signal !== null && position !== null;
  return (
    <div className={`border-t-2 border-cheap py-5 ${className}`}>
      <div className="flex items-baseline gap-x-6">
        <div className="min-w-0 flex-1">
          <p className="font-display text-city font-normal text-fg">{city}</p>
          {currency && <p className="mt-1 text-small text-fg-2">{currency}</p>}
        </div>
        {rate && <p className="hidden w-52 shrink-0 text-right text-number font-semibold text-fg tabular-nums sm:block">{rate}</p>}
        {/* 모바일: 핀만 */}
        {signal && <SignalPin signal={signal} pct={pct} className="sm:hidden" />}
      </div>
      {showScale && (
        <div className="mt-4 hidden sm:block">
          <div className="relative h-8" aria-hidden>
            <div className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-line" />
            <div className="absolute top-1/2 left-1/2 h-4 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-fg-2" />
            <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: `${(position as number) * 100}%` }}>
              <SignalPin signal={signal as Signal} pct={pct} />
            </div>
          </div>
          <div className="flex justify-between text-small text-fg-2">
            <span>쌈</span>
            <span>중간</span>
            <span>비쌈</span>
          </div>
        </div>
      )}
    </div>
  );
}
