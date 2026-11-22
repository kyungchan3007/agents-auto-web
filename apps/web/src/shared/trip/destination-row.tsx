// 도착지 줄 — 위 2px 울트라마린 선 · 데스크톱은 한 줄 세 칸: ① 도시(IBM Plex 굵게 34) + 통화(작은 글) ② 오늘 환율(오른쪽 정렬 · 굵은 숫자) ③ 쌈~비쌈 눈금(가운데 세로 눈금 = 최근 90일 중간) 위 판정 핀 (작업 0168 · 0170 · Figma 1200×90)
// 눈금 끝 라벨(쌈 · 중간 · 비쌈)은 작게 눈금 바로 아래 · 모바일(sm 아래)은 한 줄 — 왼쪽 도시 + "통화 · 환율" · 오른쪽 핀 · 눈금 없음 · 값이 없으면 지어내지 않고 비움
import type { ReactNode } from "react";
import { type Signal, SignalPin } from "../signal/signal-pin";

export type DestinationRowProps = {
  city: ReactNode;
  /** 통화 이름 · 단위 (예 "엔 100") */
  currency?: ReactNode;
  /** 오늘 환율 글자 (예 "912원") — 없으면 비움 */
  rate?: ReactNode;
  signal: Signal | null;
  /** 판정 기준의 90일 백분위(0~1) — 핀에 "하위 12% · 쌈" 근거 숫자 (없으면 핀 글자만) */
  percentile?: number | null;
  /** 쌈~비쌈 눈금 위 핀 위치 0~1 — scalePosition 으로 · null 이면 눈금을 그리지 않음 */
  position?: number | null;
  className?: string;
};

export function DestinationRow({ city, currency, rate, signal, percentile, position = null, className = "" }: DestinationRowProps) {
  const showScale = signal !== null && position !== null;
  return (
    <div data-testid="dest-row" className={`border-t-2 border-cheap py-4 sm:flex sm:h-[90px] sm:items-center sm:gap-8 sm:py-0 ${className}`}>
      {/* ① 도시 · 통화 — 모바일은 여기에 "통화 · 환율"과 오른쪽 핀이 같이 */}
      <div className="flex items-center gap-4 sm:min-w-0 sm:flex-1">
        <div className="min-w-0 flex-1">
          <p data-testid="dest-city" className="text-city font-bold text-fg">
            {city}
          </p>
          {currency && <p className="mt-0.5 hidden text-small text-fg-2 sm:block">{currency}</p>}
          <p data-testid="dest-mobile-meta" className="mt-0.5 text-small text-fg-2 sm:hidden">
            {currency}
            {rate && <> · {rate}</>}
          </p>
        </div>
        {signal && (
          <span data-testid="dest-pin" className="shrink-0 sm:hidden">
            <SignalPin signal={signal} percentile={percentile ?? null} className="sm:hidden" />
          </span>
        )}
      </div>
      {/* ② 오늘 환율 */}
      {rate && (
        <p data-testid="dest-rate" className="hidden w-44 shrink-0 text-right text-number font-semibold text-fg tabular-nums sm:block">
          {rate}
        </p>
      )}
      {/* ③ 눈금 + 판정 핀 — 데스크톱만 · 핀이 눈금 밖으로 나가지 않게 가장자리에서 멈춤 */}
      {showScale && (
        <div data-testid="dest-scale" className="hidden w-[min(42%,26rem)] shrink-0 sm:flex sm:flex-col">
          <div className="relative h-8" aria-hidden>
            <div className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-line" />
            <div className="absolute top-1/2 left-1/2 h-4 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-fg-2" />
            <span data-testid="dest-pin" className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: `clamp(4rem, ${(position as number) * 100}%, calc(100% - 4rem))` }}>
              <SignalPin signal={signal as Signal} percentile={percentile ?? null} />
            </span>
          </div>
          <div className="mt-1 flex justify-between text-xs text-fg-2" aria-hidden>
            <span>낮음</span>
            <span>중간</span>
            <span>높음</span>
          </div>
        </div>
      )}
    </div>
  );
}
