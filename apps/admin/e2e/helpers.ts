// e2e 공용 도움 — 작업 0168 · 0312 에 어드민 앱이 쓰는 것만 (운영 apps/web/e2e/helpers.ts 와 같은 함수)
import { type Locator, type Page, expect } from "@playwright/test";

/** React 가 이 요소를 이어받을 때까지 기다림(하이드레이션 끝) — 마지막에 두 프레임을 더 기다려 이어받은 직후의 첫 갱신까지 지나가게 함 (작업 0242) */
export async function hydrated(loc: Locator): Promise<void> {
  await expect.poll(() => loc.first().evaluate((el) => Object.keys(el).some((k) => k.startsWith("__reactFiber$"))), { message: "하이드레이션이 끝나기를 기다림" }).toBe(true);
  await loc.first().evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))));
}

// ── 작업 0352 — 정적 빌드가 401 로 만든 /geo 를 브라우저가 다시 받는 경로(/bff/geo)를 가짜 응답으로 채움 ──
//   작업 0326 이 API 읽기(/geo · /status · /ga4 …)에 어드민 열쇠(x-admin-key)를 요구해, 열쇠가 없는 빌드(로컬 · CI)는 /geo 를 'HTTP 401'로 빌드함 — 열쇠는 어드민 Worker 만 가짐(운영은 영향 없음)
//   그래서 /geo 의 요약 칸 · 막대 · 질문 표 · 판 목록(⌘K)은 브라우저가 /bff/geo 를 받은 뒤에야 그려짐 → 테스트가 그 응답을 정함 (geo-bot-pages · rename-compare 와 같은 방식)
const FIXTURE_DAYS = ["2026-11-20", "2026-11-21", "2026-11-22", "2026-11-23", "2026-11-24"];
/** ⌘K 시험이 찾는 질문(초성 ㄱㅅ → '관세청 과세환율') — 질문 표 · 찾기 창이 이 질문을 보여 줌 */
export const GEO_QUESTION = "관세청 과세환율";
/** 질문 걸러 보기 시험(낱자 '환율' · 초성 ㅎㅇ)이 '맞는 것 · 안 맞는 것'을 가르도록 일반 질문 하나를 더 둠 */
export const GEO_QUESTION_2 = "해외직구 관세 계산기";
export const GEO_FIXTURE = {
  since: "2026-10-19",
  firstDay: "2026-11-05",
  bots: [
    { name: "GPTBot", kind: "training", hits: 14, lastDay: "2026-11-24" },
    { name: "Googlebot", kind: "engine", hits: 9, lastDay: "2026-11-24" },
  ],
  referrals: [{ name: "ChatGPT", hits: 3, lastDay: "2026-11-24" }],
  pages: [{ path: "/", hits: 5 }],
  verifiedDay: null,
  search: {
    syncedAt: "2026-11-24T20:00:00.000Z",
    firstDay: "2026-11-01",
    lastDay: "2026-11-23",
    clicks: 3,
    impressions: 120,
    position: 14.2,
    queries: [{ key: "환율 계산", clicks: 1, impressions: 40, position: 9 }],
    pages: [{ key: "https://flapfx.com/", clicks: 2, impressions: 80, position: 11 }],
  },
  answers: {
    engines: [
      {
        engine: "claude",
        day: "2026-11-24",
        total: 3,
        ok: 3,
        cited: 1,
        found: 3,
        citedQuestions: [GEO_QUESTION],
        results: [
          { question: GEO_QUESTION, group: "general", status: "ok", cited: true, found: true },
          { question: GEO_QUESTION_2, group: "general", status: "ok", cited: false, found: true },
          { question: "Flapfx", group: "brand", status: "ok", cited: false, found: true },
        ],
      },
    ],
    history: FIXTURE_DAYS.map((day) => ({ day, engine: "claude", total: 3, ok: 3, cited: 1 })),
  },
  daily: FIXTURE_DAYS.flatMap((day, i) => [
    { day, kind: "training", name: "GPTBot", hits: 2 + i },
    { day, kind: "engine", name: "Googlebot", hits: 1 + i },
  ]),
  botPages: [
    { name: "GPTBot", kind: "training", hits: 14, paths: [{ path: "/", hits: 10 }, { path: "/calc", hits: 4 }] },
    { name: "Googlebot", kind: "engine", hits: 9, paths: [{ path: "/", hits: 6 }, { path: "/prices", hits: 3 }] },
  ],
  answerDays: FIXTURE_DAYS.flatMap((day, i) => [
    { day, edition: 1, engine: "claude", question: GEO_QUESTION, group: "general", status: "ok", found: true, cited: i % 2 === 0 },
    { day, edition: 1, engine: "claude", question: GEO_QUESTION_2, group: "general", status: "ok", found: true, cited: false },
    { day, edition: 1, engine: "claude", question: "Flapfx", group: "brand", status: "ok", found: true, cited: true },
  ]),
};

/** 브라우저가 받는 /bff/geo 를 고정 자료로 */
export async function mockGeo(page: Page, body: object = GEO_FIXTURE): Promise<void> {
  await page.route("**/bff/geo*", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) }));
}

/** 안내 창 확인용 /session — 정적 서버에는 Worker 가 없어 404 가 되고 콘솔에 'Failed to load resource' 오류가 남음(작업 0326 뒤). 알 수 없는 모양의 200 이면 안내 창 없이 조용함(admin-gate.spec 의 'shape') */
export async function quietSession(page: Page): Promise<void> {
  await page.route("**/session", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ unexpected: true }) }));
}
