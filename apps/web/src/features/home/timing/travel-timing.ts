// 홈 맨 위 "여행 타이밍" — 통계청 국제항공료 지수(kosis-cpi:air-fare)로 가장 싼 달 · 가장 비싼 달 (작업 0169)
// 달별 평균 = 최근 36개월 같은 달 평균 (@hav/shared/travel 의 monthTiming · /flights · 나라 페이지와 같은 계산) · 값이 없으면 숫자 · 달을 지어내지 않음
import { type MonthPoint, monthTiming } from "@hav/shared/travel";

export type IndexPoint = MonthPoint;

export type TravelTiming =
  | { kind: "preparing" }
  | { kind: "ready"; months: { month: number; avg: number }[]; cheapest: number; priciest: number; years: number; complete: boolean };

/** 값이 있는 달이 2개 미만이면 preparing · 계산은 @hav/shared/travel 의 monthTiming (나라 페이지와 같은 규칙) */
export function travelTiming(points: IndexPoint[] | null | undefined): TravelTiming {
  const t = monthTiming(points);
  return t ? { kind: "ready", ...t } : { kind: "preparing" };
}

/** 문구는 받은 값으로만 — 달이 모자라면 "1년 중" 대신 "받은 달 중" (없는 달을 비교한 척하지 않음) */
export function travelTimingCopy(t: TravelTiming): { title: string | null; message: string } {
  if (t.kind === "preparing") return { title: null, message: "국제항공료 지수를 아직 받지 못했습니다" };
  const span = t.complete ? "1년 중" : "받은 달 중";
  // 작업 0380: 제목 끝에 마침표 · 한 줄만(가장 높은 달 · 통계청 문장은 뺌 · 출처는 꼬리표 HERO_GUIDE.tag 로 따로)
  return { title: `${t.cheapest}월에 떠나세요.`, message: `항공료가 ${span} 가장 낮은 달입니다.` };
}

/** 큰 제목 "11월에 떠나세요." 를 월(노랑으로 칠함)과 나머지로 — travelTimingCopy 의 title 과 같은 글 · 자료가 없으면 null (작업 0217) */
export function heroParts(t: TravelTiming): { month: string; rest: string } | null {
  if (t.kind !== "ready") return null;
  return { month: `${t.cheapest}월`, rest: "에 떠나세요." };
}
