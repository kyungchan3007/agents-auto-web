// 2 오늘 환율 — 출발 안내판 (작업 0177 · 스플릿 플랩): 울트라마린은 판에만 · 판 위쪽 절반이 위 사진 구간에 걸쳐 올라옴(-mt) · 오른쪽에 3D 지구(배경 없이 하늘 종이 위)
// 1줄 "ICN → 도시"(흰) · 2줄 금액(햇빛 노랑) · 아래 판정 한 줄(최근 90일 백분위) · 자료는 todayBoard(cheapestDestination)가 만든 값 그대로 — 없으면 판에 "----" (지어내지 않음)
// 모바일은 판 아래에 지구를 작게 · 데스크톱은 두 칸(판이 먼저)
import type { FxRate } from "@hav/shared/fx";
import { FlapBoard } from "@hav/ui/data/flap-board";
import { DateText } from "@hav/ui/text/date-text";
import { GlobeLazy } from "@hav/ui/three/scene/lazy";
import { type Destination, type SignalRow, cheapestDestination } from "../lib/destinations";
import { DESTINATIONS, EARTH_TEXTURE, SEOUL } from "../lib/places";
import { todayBoard } from "../lib/today-board";

type Props = { rates: FxRate[]; signals: SignalRow[]; windowDays: number; problem: string | null };

/** 판 한 줄의 칸 수 — "1,234.56원 / 100엔" 같은 긴 금액은 줄임표로 줄여 칸을 넘치지 않음 */
const BOARD_COLS = 12;

export function TodayBoard({ rates, signals, windowDays, problem }: Props) {
  const found = cheapestDestination(signals, rates, DESTINATIONS as Destination[]);
  const board = todayBoard({ found, hasRates: rates.length > 0, windowDays, problem });
  const source = found ? rates.find((r) => r.currency === found.rate.currency) : undefined;
  return (
    <section id="today" aria-labelledby="today-title" className="relative px-4 pb-14 text-fg sm:px-8 sm:pb-20">
      <div className="mx-auto grid max-w-page items-center gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-12">
        <div className="-mt-24 min-w-0 sm:-mt-32">
          <h2 id="today-title" className="text-base font-semibold text-accent">
            {board.title}
          </h2>
          <FlapBoard rows={board.rows} cols={BOARD_COLS} label={board.label} className="mt-3" />
          <p className="mt-5 text-body text-fg-2">{board.evidence}</p>
          {source?.source === "frankfurter" && (
            <p className="mt-2 text-small text-fg-2">
              수출입은행 값을 받지 못해 예비 출처(Frankfurter) 값입니다 · 기준일 <DateText date={source.date} />
            </p>
          )}
        </div>
        {/* 지구 — 호 색 = 그 나라 통화 신호 · 생김새 그대로 · 3D 가 안 되면 이 칸만 빔 */}
        <GlobeLazy
          className="mx-auto size-[240px] sm:size-[280px] lg:size-[400px]"
          origin={SEOUL}
          texture={EARTH_TEXTURE}
          arcs={DESTINATIONS.map((d) => ({ to: d, tone: signals.find((s) => s.currency === d.currency)?.signal ?? null }))}
        />
      </div>
    </section>
  );
}
