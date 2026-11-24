// 작업 0234 — 항공권 달력 e2e 용 고정 자료 API (SerpApi 를 부르지 않음 · R11)
//   /airfare/calendar 만 e2e/fixtures/airfare-calendar.json 을 내고, 나머지 경로는 운영 API 를 그대로 전달(읽기만) — 다른 구역은 지금처럼 빌드됨
//   쓰는 법(빌드는 한 번만): node e2e/fixture-api.mjs &  →  TRIPFX_API_URL=http://127.0.0.1:4398 AIRFARE_FIXTURE=1 npm run build  →  AIRFARE_FIXTURE=1 npx playwright test -c e2e/airfare.config.ts
import { readFileSync } from "node:fs";
import { createServer } from "node:http";

const PORT = Number(process.env.FIXTURE_API_PORT ?? 4398);
const UPSTREAM = process.env.FIXTURE_UPSTREAM ?? "https://tripfx-api.developfff.workers.dev";
const CAL = readFileSync(new URL("./fixtures/airfare-calendar.json", import.meta.url));

createServer(async (req, res) => {
  const path = (req.url ?? "/").split("?")[0];
  if (req.method === "GET" && path === "/airfare/calendar") {
    res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    res.end(CAL);
    return;
  }
  // 작업 0346 — 환율을 못 받는 빌드: FIXTURE_NO_FX=1 이면 /fx/* · /signal* 을 503 으로 (빈 상태 e2e · empty-states.spec.ts)
  if (process.env.FIXTURE_NO_FX === "1" && (path.startsWith("/fx/") || path === "/fx" || path.startsWith("/signal"))) { res.writeHead(503, { "content-type": "application/json" }); res.end(JSON.stringify({ error: "fixture: 환율 없음" })); return; }
  if (req.method !== "GET") { res.writeHead(405).end(); return; }
  try {
    const r = await fetch(UPSTREAM + req.url, { signal: AbortSignal.timeout(20_000) });
    res.writeHead(r.status, { "content-type": r.headers.get("content-type") ?? "application/json" });
    res.end(Buffer.from(await r.arrayBuffer()));
  } catch {
    res.writeHead(502).end();
  }
}).listen(PORT, "127.0.0.1", () => console.log(`고정 자료 API http://127.0.0.1:${PORT}`));
