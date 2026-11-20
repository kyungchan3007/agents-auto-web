// D1 저장 · 읽기 — 항공권 출발일 달력 (airfare_calendar · 작업 0234)
//   받은 묶음은 지우지 않고 쌓음(나중 누적 신호용) · 읽을 때는 도시별 가장 최근 묶음 하나만
import type { AirfareCalendar } from "@hav/shared/airfare";
import { drizzle } from "drizzle-orm/d1";
import { clearApiCache } from "../../db/cache";
import { runLog } from "../../db/runs";
import type { AirfareRow, AirfareStore } from "./collect";
import { AIRFARE_CITIES } from "./serpapi";

// D1 바인딩 100개 제한 → 6칸 × 16줄 = 96
const CHUNK = 16;

export function d1AirfareStore(d1: D1Database): AirfareStore {
  const db = drizzle(d1);
  return {
    ...runLog(db),
    async saveDays(rows: AirfareRow[]) {
      for (let i = 0; i < rows.length; i += CHUNK) {
        const part = rows.slice(i, i + CHUNK);
        const sql =
          `insert into airfare_calendar (airport, fetched_on, depart, return_date, price, fetched_at) values ${part.map(() => "(?, ?, ?, ?, ?, ?)").join(", ")} ` +
          "on conflict (airport, fetched_on, depart) do update set return_date = excluded.return_date, price = excluded.price, fetched_at = excluded.fetched_at";
        await d1.prepare(sql).bind(...part.flatMap((r) => [r.airport, r.fetchedOn, r.depart, r.returnDate, r.price, r.fetchedAt])).run();
      }
      if (rows.length > 0) await clearApiCache(d1); // 새 자료 → 저장해 둔 응답은 낡음
      return rows.length;
    },
    async fetchedToday(fetchedOn: string) {
      const { results } = await d1.prepare("select distinct airport from airfare_calendar where fetched_on = ?").bind(fetchedOn).all<{ airport: string }>();
      return results.map((r) => r.airport);
    },
  };
}

type Row = { airport: string; fetched_on: string; depart: string; return_date: string; price: number };

/** 도시별 가장 최근 묶음 — 받은 적 없는 도시는 목록에 없음 · 자료가 없으면 { fetchedOn: null, cities: [] } */
export async function readAirfareCalendar(d1: D1Database): Promise<AirfareCalendar> {
  const { results } = await d1
    .prepare(
      "select airport, fetched_on, depart, return_date, price from airfare_calendar " +
        "where (airport, fetched_on) in (select airport, max(fetched_on) from airfare_calendar group by airport) order by airport, depart",
    )
    .all<Row>();
  const cities: AirfareCalendar["cities"] = [];
  for (const meta of AIRFARE_CITIES) {
    const mine = results.filter((r) => r.airport === meta.airport);
    if (mine.length === 0) continue;
    cities.push({
      id: meta.id,
      city: meta.city,
      airport: meta.airport,
      fetchedOn: mine[0].fetched_on,
      days: mine.map((r) => ({ depart: r.depart, return: r.return_date, price: r.price })).sort((a, b) => a.depart.localeCompare(b.depart)),
    });
  }
  const fetchedOn = cities.reduce<string | null>((m, c) => (m === null || c.fetchedOn > m ? c.fetchedOn : m), null);
  return { fetchedOn, cities };
}
