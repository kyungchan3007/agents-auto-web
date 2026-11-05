// 신호 API — 저장된 환율로 그때그때 계산 (따로 저장하지 않음: 계산 규칙이 바뀌어도 원본만 있으면 됨)
import { CurrencyParam } from "@hav/shared/fx";
import type { CurrencySignal, SignalList } from "@hav/shared/signal";
import { Hono } from "hono";
import { cached } from "../../db/cache";
import type { Env } from "../../env";
import { validate } from "../../validate";
import { SIGNAL_RULE, computeSignal, perUnit, signalsByCurrency } from "./signal";
import { allSignalRates, currencySignalRates } from "./store";

export const signalRoutes = new Hono<{ Bindings: Env }>()
  .get("/", cached(), async (c) => {
    const body: SignalList = { rule: SIGNAL_RULE, signals: signalsByCurrency(await allSignalRates(c.env.DB)) };
    return c.json(body);
  })
  .get("/:currency", validate("param", CurrencyParam), cached(), async (c) => {
    const { currency } = c.req.valid("param");
    const rows = await currencySignalRates(c.env.DB, currency);
    const body: CurrencySignal = { currency, rule: SIGNAL_RULE, ...computeSignal(rows.map((r) => ({ date: r.date, value: perUnit(r) }))) };
    return c.json(body);
  });
