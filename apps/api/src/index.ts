// Hono 앱 + 예약 실행을 한 Worker 에 (docs/architecture.md Hono 규칙)
import { kstDate } from "@hav/shared/date";
import type { ApiError } from "@hav/shared/errors";
import { Hono } from "hono";
import { dbAlive } from "./db/health";
import type { Env } from "./env";
import { activityRoutes } from "./features/activity/routes";
import { type DailyResult, dailyFx } from "./features/fx/collect/daily";
import { fxRoutes } from "./features/fx/routes";
import { d1RateStore, hasOfficialRates, hasRates } from "./features/fx/store";
import { collectCustomsRates } from "./features/indicators/collect";
import { indicatorRoutes } from "./features/indicators/routes";
import { d1IndicatorStore } from "./features/indicators/store";
import { collectPriceLevels } from "./features/prices/collect";
import { priceRoutes } from "./features/prices/routes";
import { d1PriceStore } from "./features/prices/store";
import { geoRoutes } from "./features/geo/routes";
import { signalRoutes } from "./features/signal/routes";
import { statusRoutes } from "./features/status/routes";
import { taskRoutes } from "./features/tasks/routes";
import { logError, logEvent } from "./log";

export const app = new Hono<{ Bindings: Env }>()
  .get("/health", async (c) => {
    const db = await dbAlive(c.env.DB);
    return c.json({ ok: db, service: "tripfx-api", db }, db ? 200 : 503);
  })
  .route("/fx", fxRoutes)
  .route("/signal", signalRoutes)
  .route("/prices", priceRoutes)
  .route("/indicators", indicatorRoutes)
  .route("/activity", activityRoutes)
  .route("/tasks", taskRoutes)
  .route("/geo", geoRoutes)
  // 사이트 상태 — 오늘 환율 예약 회차 (작업 0105) · 회차는 아래 CRON 에서
  .route("/status", statusRoutes([
    { cron: "0 3 * * MON-FRI", kind: "collect" },
    { cron: "30 4 * * MON-FRI", kind: "retry" },
    { cron: "0 6 * * MON-FRI", kind: "retry" },
  ]))
  // 처리하지 못한 예외 — 한 가지 모양으로 · 자세한 내용은 로그에만
  .onError((e, c) => {
    logError("request_failed", e, { method: c.req.method, path: c.req.path });
    const body: ApiError = { error: "서버 오류가 발생했습니다" };
    return c.json(body, 500);
  });

/** apps/web 은 hc<AppType>() 로 부른다 (Hono RPC) */
export type AppType = typeof app;

/** wrangler.jsonc triggers.crons 와 같은 문자열 (index.test.ts 가 검사) */
// fxRetry: 13:30 · 15:00 KST — 첫 예약을 놓친 날만 다시 (오늘 값이 있으면 그냥 끝 · 작업 0094)
export const CRON = { fxDaily: "0 3 * * MON-FRI", fxRetry1: "30 4 * * MON-FRI", fxRetry2: "0 6 * * MON-FRI", pricesMonthly: "0 4 1 * *" } as const;

/** 예약 수집 결과 로그 — 2026-11 수출입은행 525 조사 때 실패 시각의 기록이 부족했음 (이슈 #128) */
const fxLog = (r: DailyResult) => (r.skipped ? { skipped: true } : { date: r.date, status: r.status, source: r.source, rows: r.rows, rebuild: r.rebuild, message: r.message });

export default {
  fetch: app.fetch,
  async scheduled(controller, env, ctx) {
    if (controller.cron === CRON.pricesMonthly) {
      // 매달 1일 13:00 KST — 세계은행 물가 (연 단위 자료)
      ctx.waitUntil(
        collectPriceLevels(d1PriceStore(env.DB))
          .then(() => logEvent("info", "prices_collected", { cron: controller.cron }))
          .catch((e) => logError("prices_collect_failed", e, { cron: controller.cron })),
      );
      return;
    }
    // 평일 12:00 KST — 오늘(한국 날짜) 환율 · 결과는 fetch_runs 에 · 새 값이면 사이트 다시 빌드 · 다시 하는 예약은 놓친 날만
    const retry = controller.cron !== CRON.fxDaily;
    // 첫 예약은 수출입은행 5xx 면 30초 · 90초 뒤 다시 시도 (작업 0156) — 기다리는 동안 끝나지 않게 결과를 기다림
    await dailyFx(kstDate(), retry, {
        store: d1RateStore(env.DB),
        hasRates: (date) => hasRates(env.DB, date),
        hasOfficialRates: (date) => hasOfficialRates(env.DB, date),
        koreaeximKey: env.KOREAEXIM_KEY,
        deployHook: env.PAGES_DEPLOY_HOOK,
        retryDelays: [30_000, 90_000],
      })
      .then((r) => logEvent(!r.skipped && r.status === "error" ? "warn" : "info", "fx_scheduled", { cron: controller.cron, ...fxLog(r) }))
      .catch((e) => logError("fx_scheduled_failed", e, { cron: controller.cron }));
    // 과세환율(주간) — 환율 수집과 따로 (서로 던져도 영향 없음) · 평일 12:00 첫 회차에서만 · 이미 받은 주는 건너뜀 (작업 0163)
    if (retry) return;
    await Promise.resolve()
      .then(() => collectCustomsRates(d1IndicatorStore(env.DB), { key: env.KCS_KEY, today: kstDate() }))
      .then(async (r) => {
        // 새 과세환율을 저장했으면 사이트를 다시 빌드 — 위 환율 수집의 빌드 요청은 이 값을 받기 전에 갔을 수 있음
        const rebuild = r.status === "ok" && r.rows > 0 && env.PAGES_DEPLOY_HOOK ? await fetch(env.PAGES_DEPLOY_HOOK, { method: "POST" }).then((x) => (x.ok ? "requested" : "failed"), () => "failed") : "not-needed";
        logEvent(r.status === "error" ? "warn" : "info", "kcs_scheduled", { cron: controller.cron, status: r.status, rows: r.rows, message: r.message, rebuild });
      })
      .catch((e) => logError("kcs_scheduled_failed", e, { cron: controller.cron }));
  },
} satisfies ExportedHandler<Env>;
