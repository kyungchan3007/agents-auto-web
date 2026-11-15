// 홈 첫 화면 출발 안내판의 글 — 자료는 예전 바다 띠(today-band)가 쓰던 값 그대로 (cheapestDestination · cheapestCopy) · 없으면 판에 "----" (지어내지 않음 · 작업 0177)
import { NO_RATE_COPY, cheapestCopy, type cheapestDestination } from "./destinations";

export const BOARD_TITLE = "이번 주 가장 싸게 갈 수 있는 곳";
export const ORIGIN_CODE = "ICN";

/** text null = 값 없음 (판에 "----") */
export type BoardRow = { text: string | null; tone: "dest" | "money" };
type Found = ReturnType<typeof cheapestDestination>;

export function todayBoard(a: { found: Found; hasRates: boolean; windowDays: number; problem?: string | null }): { title: string; rows: [BoardRow, BoardRow]; label: string; evidence: string } {
  const empty: [BoardRow, BoardRow] = [{ text: null, tone: "dest" }, { text: null, tone: "money" }];
  if (a.found) {
    const copy = cheapestCopy(a.found, a.windowDays);
    const money = `${copy.value} / ${copy.per}`;
    return {
      title: BOARD_TITLE,
      rows: [{ text: `${ORIGIN_CODE} → ${a.found.destination.name}`, tone: "dest" }, { text: money, tone: "money" }],
      label: `${copy.headline}. ${money}`,
      evidence: copy.evidence,
    };
  }
  if (!a.hasRates) return { title: BOARD_TITLE, rows: empty, label: NO_RATE_COPY, evidence: a.problem ?? "환율이 아직 수집되지 않았습니다" };
  return { title: BOARD_TITLE, rows: empty, label: "이번 주 가장 싼 곳을 판단할 신호가 아직 없습니다", evidence: `최근 ${a.windowDays}일 자료가 모자라 도착지 신호를 내지 못했습니다` };
}
