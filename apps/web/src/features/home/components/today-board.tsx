// 2 오늘 환율 — 출발 안내판 (작업 0177 · 스플릿 플랩): 하늘 종이 위에 짙은 남색 판 하나를 벽에 걸린 물건처럼 놓음 (사진에 걸치지 않음 · 3D 지구는 없앰)
// 1줄 "ICN → 도시" · 2줄 금액(둘 다 햇빛 노랑) · 위 작은 제목 · 아래 판정 한 줄(최근 90일 백분위) · 자료는 todayBoard(cheapestDestination)가 만든 값 그대로 — 없으면 판에 "----" (지어내지 않음)
import type { FxRate } from "@hav/shared/fx";
import { FlapBoard } from "@hav/ui/data/flap-board";
import { DateText } from "@hav/ui/text/date-text";
import { type Destination, type SignalRow, cheapestDestination } from "../lib/destinations";
import { DESTINATIONS } from "../lib/places";
import { todayBoard } from "../lib/today-board";

type Props = { rates: FxRate[]; signals: SignalRow[]; windowDays: number; problem: string | null };

/** 판 한 줄의 칸 수 — "1,234.56원 / 100엔" 같은 긴 금액은 줄임표로 줄여 칸을 넘치지 않음 */
const BOARD_COLS = 12;

export function TodayBoard({ rates, signals, windowDays, problem }: Props) {
  const found = cheapestDestination(signals, rates, DESTINATIONS as Destination[]);
  const board = todayBoard({ found, hasRates: rates.length > 0, windowDays, problem });
  const source = found ? rates.find((r) => r.currency === found.rate.currency) : undefined;
  return (
    <section id="today" aria-labelledby="today-title" className="px-4 pt-6 pb-8 text-fg sm:px-8 sm:pt-8 sm:pb-10">
      <div className="mx-auto max-w-page">
        <h2 id="today-title" className="text-base font-semibold text-accent">
          {board.title}
        </h2>
        <FlapBoard rows={board.rows} cols={BOARD_COLS} label={board.label} className="mt-3" />
        <p className="mt-5 text-body text-accent">{board.evidence}</p>
        {source?.source === "frankfurter" && (
          <p className="mt-2 text-small text-fg-2">
            수출입은행 값을 받지 못해 예비 출처(Frankfurter) 값입니다 · 기준일 <DateText date={source.date} />
          </p>
        )}
      </div>
    </section>
  );
}
