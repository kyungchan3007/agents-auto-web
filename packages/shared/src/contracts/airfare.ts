// 항공권 출발일 달력 계약 (작업 0234) — GET /airfare/calendar
// 받지 못한 도시는 목록에 없음(빈 값 · 숫자를 만들지 않음 — AGENTS.md 7) · 구글 "싼 날"(low)은 쓰지 않아 계약에 없음
import { z } from "zod";
import { IsoDate } from "../utils/date";

export const AirfareDay = z.object({
  depart: IsoDate,
  return: IsoDate,
  price: z.number().int().positive(), // KRW 정수
});
export type AirfareDay = z.infer<typeof AirfareDay>;

export const AirfareCity = z.object({
  id: z.string().min(1),
  city: z.string().min(1),
  airport: z.string().min(1),
  fetchedOn: IsoDate, // 이 도시 묶음을 받은 날
  days: z.array(AirfareDay),
});
export type AirfareCity = z.infer<typeof AirfareCity>;

/** 자료가 없으면 fetchedOn null · cities [] */
export const AirfareCalendar = z.object({ fetchedOn: IsoDate.nullable(), cities: z.array(AirfareCity) });
export type AirfareCalendar = z.infer<typeof AirfareCalendar>;
