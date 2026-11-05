// 신호 계산에 쓸 환율 읽기 — D1 (기본 키 · fx_rates_currency_date 인덱스로 그 기간만)
import { and, desc, eq, gte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { fxRates } from "../../db/schema";
import { SIGNAL_RULE } from "./signal";

const since = () => new Date(Date.now() - (SIGNAL_RULE.windowDays + 30) * 86400_000).toISOString().slice(0, 10);

export async function allSignalRates(d1: D1Database) {
  return drizzle(d1).select().from(fxRates).where(gte(fxRates.date, since())).orderBy(fxRates.currency, fxRates.date);
}

export async function currencySignalRates(d1: D1Database, currency: string) {
  return drizzle(d1)
    .select({ date: fxRates.date, baseRate: fxRates.baseRate, unit: fxRates.unit })
    .from(fxRates)
    .where(and(eq(fxRates.currency, currency), gte(fxRates.date, since())))
    .orderBy(desc(fxRates.date));
}
