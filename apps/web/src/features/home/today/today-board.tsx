// 새 홈 탑승권 카드(서버) — 지금 안내판의 글을 계산해 카드(Ticket)에 넘김 (작업 0177 → 0217)
// 1줄 "ICN → 도시" · 2줄 금액 · 자료는 todayBoard(cheapestDestination)가 만든 값 그대로 — 없으면 판에 "----" (지어내지 않음) · 서버 첫 그림이 이 값
import type { FxRate } from "@hav/shared/fx";
import { DateText } from "@hav/ui/text/date-text";
import { type Destination, type SignalRow, cheapestDestination } from "../common/destinations";
import { DESTINATIONS } from "../common/places";
import { todayBoard } from "./today-view";
import { Ticket } from "./ticket";

type Props = { rates: FxRate[]; signals: SignalRow[]; windowDays: number; problem: string | null };

export function TodayBoard({ rates, signals, windowDays, problem }: Props) {
  const found = cheapestDestination(signals, rates, DESTINATIONS as Destination[]);
  const board = todayBoard({ found, hasRates: rates.length > 0, windowDays, problem });
  const source = found ? rates.find((r) => r.currency === found.rate.currency) : undefined;
  return (
    <Ticket
      initial={board}
      rates={rates}
      signals={signals}
      windowDays={windowDays}
      notice={
        source?.source === "frankfurter" ? (
          <p className="mt-2 text-small text-fg-2">
            수출입은행 값을 받지 못해 예비 출처(Frankfurter) 값입니다 · 기준일 <DateText date={source.date} />
          </p>
        ) : null
      }
    />
  );
}
