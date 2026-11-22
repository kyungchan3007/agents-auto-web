// 여행 타이밍 페이지 값 (작업 0170 · 0218 · 0312 에 flights-page.tsx 에서 옮김) · 순수 함수 — 자료가 없으면 "준비 중"(지어내지 않음)
import { cheapMonthsCard, flightsHeadline } from "./flights-copy";
import { flightsBoard, stripStats } from "./flights-view";
import { averageYears, cheapMonth, type IndexPoint } from "./travel-index";

export type TravelItem = { key: string; name: string; points: IndexPoint[] | null };

export function flightsPageView(travel: TravelItem[], fxMonthly: IndexPoint[]) {
  const air = travel.find((t) => t.key === "air-fare")?.points ?? null;
  const tour = travel.find((t) => t.key === "package-tour")?.points ?? null;
  const airCheap = air ? cheapMonth(air) : null;
  const tourCheap = tour ? cheapMonth(tour) : null;
  const ready = !!air && air.length > 1;
  /** 그래프 · 탑승권은 국제항공료가 두 달 이상일 때만 */
  const graphAir = ready ? air : null;
  return {
    air,
    graphAir,
    tour,
    ready,
    headline: flightsHeadline(airCheap, tourCheap),
    cheaps: cheapMonthsCard(airCheap, tourCheap, Math.max(averageYears(air ?? []), averageYears(tour ?? []))),
    board: ready ? flightsBoard({ airCheap, tourCheap, air, tour }) : null,
    strip: ready ? stripStats(air, fxMonthly) : null,
  };
}
