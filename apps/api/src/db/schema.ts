// D1 테이블 — 원본은 여기 하나 (마이그레이션은 drizzle-kit 이 이 파일에서 만든다)
// Drizzle 은 D1 · Postgres 둘 다 지원 → 나중에 옮길 때 이 파일의 sqlite-core 만 pg-core 로 바꾼다
import { index, integer, primaryKey, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

/** 일별 환율 (원화 기준). 받지 못한 날은 행을 만들지 않는다 (FX-02) */
export const fxRates = sqliteTable(
  "fx_rates",
  {
    date: text("date").notNull(), // 기준일 YYYY-MM-DD
    currency: text("currency").notNull(), // ISO 4217 (USD · JPY …)
    unit: integer("unit").notNull().default(1), // 고시 단위 — 엔 · 루피아는 100 (FX-04)
    baseRate: real("base_rate").notNull(), // 매매기준율 (unit 당 원)
    ttb: real("ttb"), // 송금 받을 때 — 출처에 없으면 null
    tts: real("tts"), // 송금 보낼 때 — 출처에 없으면 null
    source: text("source", { enum: ["koreaexim", "frankfurter"] }).notNull(), // FX-01
    fetchedAt: text("fetched_at").notNull(),
  },
  // (통화, 날짜) 색인 — 기본 키(날짜, 통화)로는 "한 통화의 1년" 을 찾을 때 1년치 모든 통화를 읽어서 D1 하루 읽기 한도를 넘겼음 (작업 0077)
  (t) => [primaryKey({ columns: [t.date, t.currency] }), index("fx_rates_currency_date").on(t.currency, t.date)],
);

/** 나라별 물가 수준 (미국 = 1, 연 단위). 출처 없는 나라는 넣지 않는다 (TRV-02) */
export const priceLevels = sqliteTable(
  "price_levels",
  {
    country: text("country").notNull(), // ISO 3166-1 alpha-3
    year: integer("year").notNull(),
    level: real("level").notNull(),
    source: text("source").notNull(),
    fetchedAt: text("fetched_at").notNull(),
  },
  (t) => [primaryKey({ columns: [t.country, t.year] })],
);

/** 수집 실행 기록 — 운영용 (공개 일지 아님) */
export const fetchRuns = sqliteTable("fetch_runs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  source: text("source").notNull(),
  startedAt: text("started_at").notNull(),
  finishedAt: text("finished_at"),
  status: text("status", { enum: ["running", "ok", "empty", "error"] }).notNull(),
  rows: integer("rows").notNull().default(0),
  message: text("message"),
});

/** 실시간 작업 기록 — 공개 (에이전트 훅이 보냄 · 최근 ACTIVITY_KEEP 개만 남김) · 명령 · 경로 · 내용은 저장하지 않음 */
export const activityEvents = sqliteTable("activity_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  at: text("at").notNull(),
  kind: text("kind").notNull(), // @hav/shared/activity ACTIVITY_KINDS
  label: text("label").notNull(), // 고정된 한국어 문장
  file: text("file"), // 파일 이름만
  ok: integer("ok", { mode: "boolean" }),
  task: text("task"), // NNNN
});

/** 작업별 막힘 수 — 실시간 기록은 최근 500줄만 남아서 따로 쌓음 (작업 0075) · 기록이 들어올 때 +1 */
export const taskSnags = sqliteTable("task_snags", {
  task: text("task").primaryKey(), // NNNN
  blocked: integer("blocked").notNull().default(0), // 하네스가 막음
  failed: integer("failed").notNull().default(0), // 게이트 실패
  since: text("since").notNull(), // 이 작업의 막힘을 처음 센 때
  updatedAt: text("updated_at").notNull(),
});

/** 읽기 응답 캐시 — 빌드가 같은 날 같은 응답을 여러 번 받아도 D1 은 한 줄만 읽게 (작업 0083 · src/db/cache.ts) · 환율 · 물가를 저장하면 비움 */
export const apiCache = sqliteTable("api_cache", {
  key: text("key").primaryKey(), // 배포 버전 | UTC 날짜 | 경로?쿼리
  body: text("body").notNull(), // 응답 JSON 그대로
  savedAt: text("saved_at").notNull(),
});

/** GitHub 이슈 · 머지된 PR — GitHub Actions(sync-tasks.yml)가 통째로 바꿔 넣음 · 만드는 중 페이지의 지난 작업 · 작업 이름 */
export const githubItems = sqliteTable("github_items", {
  number: integer("number").primaryKey(), // 이슈 · PR 번호 (GitHub 에서 서로 겹치지 않음)
  kind: text("kind", { enum: ["issue", "pr"] }).notNull(),
  task: text("task"), // 제목의 [NNNN]
  name: text("name").notNull(),
  url: text("url").notNull(),
  mergedAt: text("merged_at"), // PR 만
  syncedAt: text("synced_at").notNull(),
});

/** GEO 방문 집계 — 하루 · 종류 · 이름 · 페이지별 횟수만 (IP · 전체 User-Agent · 쿼리는 저장하지 않음 · 작업 0129) */
export const geoHits = sqliteTable(
  "geo_hits",
  {
    day: text("day").notNull(), // 한국 날짜
    kind: text("kind", { enum: ["training", "search", "user", "engine", "referral", "test"] }).notNull(),
    name: text("name").notNull(), // 봇 이름 또는 AI 서비스 이름
    path: text("path").notNull(), // 고정 목록 (@hav/shared/geo-visit)
    hits: integer("hits").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.day, t.kind, t.name, t.path] })],
);

/** Search Console 날짜별 — GitHub Actions(gsc-sync.yml)가 통째로 바꿔 넣음 · 작업 0130 */
export const gscDaily = sqliteTable("gsc_daily", {
  day: text("day").primaryKey(),
  clicks: integer("clicks").notNull(),
  impressions: integer("impressions").notNull(),
  position: real("position").notNull(),
});

/** Search Console 상위 검색어 · 페이지 — 검색어는 노출 2회 이상만 */
export const gscTop = sqliteTable(
  "gsc_top",
  {
    kind: text("kind", { enum: ["query", "page"] }).notNull(),
    key: text("key").notNull(),
    clicks: integer("clicks").notNull(),
    impressions: integer("impressions").notNull(),
    position: real("position").notNull(),
  },
  (t) => [primaryKey({ columns: [t.kind, t.key] })],
);

/** Search Console 마지막으로 가져온 때 */
export const gscSync = sqliteTable("gsc_sync", {
  id: integer("id").primaryKey(),
  syncedAt: text("synced_at").notNull(),
});

/** AI 답변 인용 측정 — 질문마다 출처에 tripfx 가 나왔는지만 (답변 본문은 저장하지 않음) · GitHub Actions(geo-ask.yml)가 넣음 · 작업 0139 */
export const geoAnswers = sqliteTable(
  "geo_answers",
  {
    day: text("day").notNull(), // 한국 날짜
    engine: text("engine", { enum: ["claude", "openai", "perplexity"] }).notNull(),
    question: text("question").notNull(), // 고정 질문 번호 (apps/api/src/features/geo/questions.ts)
    status: text("status", { enum: ["ok", "error"] }).notNull(),
    cited: integer("cited").notNull().default(0), // 답의 인용 표시에 tripfx 주소가 있음 (1/0)
    found: integer("found").notNull().default(0), // 검색 결과 목록에 tripfx 주소가 있음 (1/0)
  },
  (t) => [primaryKey({ columns: [t.day, t.engine, t.question] })],
);

/** 공용 시계열 — 관세청 과세환율(주간) · KOSIS · ECOS(월간)가 함께 씀 · 같은 (series, period) 는 덮어씀 · 받지 못한 기간은 행을 만들지 않음 (FX-02) · 작업 0163 */
export const indicatorPoints = sqliteTable(
  "indicator_points",
  {
    series: text("series").notNull(), // 예: kcs-import:USD · kosis-cpi:air-fare · ecos-import-price:krw
    period: text("period").notNull(), // 주간은 적용 시작일 YYYY-MM-DD · 월간은 YYYY-MM
    value: real("value").notNull(),
    source: text("source", { enum: ["kcs", "kosis", "ecos"] }).notNull(),
    fetchedAt: text("fetched_at").notNull(),
  },
  (t) => [primaryKey({ columns: [t.series, t.period] })],
);

/** 항공권 출발일 달력 (작업 0234) — 인천 출발 1주 왕복의 출발일별 최저가 · 받은 묶음(fetched_on)을 지우지 않고 쌓음 · 같은 (airport, fetched_on, depart) 는 덮어씀 · 받지 못한 날은 행을 만들지 않음 (AGENTS.md 7) */
export const airfareCalendar = sqliteTable(
  "airfare_calendar",
  {
    airport: text("airport").notNull(), // 도착 공항 코드 (NRT · KIX …)
    fetchedOn: text("fetched_on").notNull(), // 받은 날 YYYY-MM-DD (한국 날짜)
    depart: text("depart").notNull(), // 출발일 YYYY-MM-DD
    returnDate: text("return_date").notNull(), // 돌아오는 날 YYYY-MM-DD
    price: integer("price").notNull(), // KRW 정수
    fetchedAt: text("fetched_at").notNull(),
  },
  (t) => [primaryKey({ columns: [t.airport, t.fetchedOn, t.depart] })],
);

/** 인스타 게시물 정보 (작업 0323) — 가져올 때마다 같은 media_id 는 덮어씀 · GitHub Actions(ig-insights.yml)가 넣음 */
export const igMedia = sqliteTable("ig_media", {
  mediaId: text("media_id").primaryKey(),
  postedAt: text("posted_at").notNull(), // 게시 시각 (API 가 준 글 그대로)
  permalink: text("permalink").notNull(),
  kind: text("kind").notNull(), // IMAGE · CAROUSEL_ALBUM · VIDEO …
});

/** 인스타 게시물 성과 — 날짜별로 쌓음(게시 뒤 시간이 지나며 늘어남) · 같은 (day, media_id, metric) 은 덮어씀 · 받지 못한 지표는 행을 만들지 않음 (AGENTS.md 7) */
export const igMediaInsights = sqliteTable(
  "ig_media_insights",
  {
    day: text("day").notNull(), // 받은 날 YYYY-MM-DD
    mediaId: text("media_id").notNull(),
    metric: text("metric").notNull(), // reach · likes · saved · shares · views
    value: integer("value").notNull(),
  },
  (t) => [primaryKey({ columns: [t.day, t.mediaId, t.metric] })],
);

/** 인스타 계정 성과 — 하루 한 행 · 같은 (day, metric) 은 덮어씀 · 받지 못한 지표는 행을 만들지 않음 */
export const igAccountInsights = sqliteTable(
  "ig_account_insights",
  {
    day: text("day").notNull(),
    metric: text("metric").notNull(), // reach · views · profile_views · website_clicks · accounts_engaged …
    value: integer("value").notNull(),
  },
  (t) => [primaryKey({ columns: [t.day, t.metric] })],
);

/** GA4 날짜별 (작업 0324) — GitHub Actions(ga4-sync.yml)가 최근 28일을 매일 다시 읽어 덮어씀 · 같은 day 는 덮어씀 · 받지 못한 날은 행을 만들지 않음 (AGENTS.md 7) */
export const ga4Daily = sqliteTable("ga4_daily", {
  day: text("day").primaryKey(), // YYYY-MM-DD
  users: integer("users").notNull(),
  sessions: integer("sessions").notNull(),
  pageViews: integer("page_views").notNull(),
});

/** GA4 유입 경로별 — source · medium · campaign 은 받은 그대로(utm 값 · (direct) · (not set) 포함) */
export const ga4Sources = sqliteTable(
  "ga4_sources",
  {
    day: text("day").notNull(),
    source: text("source").notNull(),
    medium: text("medium").notNull(),
    campaign: text("campaign").notNull(),
    sessions: integer("sessions").notNull(),
    users: integer("users").notNull(),
  },
  (t) => [primaryKey({ columns: [t.day, t.source, t.medium, t.campaign] })],
);

/** GA4 페이지별 페이지뷰 — 경로는 받은 그대로 */
export const ga4Pages = sqliteTable(
  "ga4_pages",
  {
    day: text("day").notNull(),
    path: text("path").notNull(),
    views: integer("views").notNull(),
  },
  (t) => [primaryKey({ columns: [t.day, t.path] })],
);

/** 어드민 접속 기록 (작업 0326) — 지원 토큰 이름별 처음 · 마지막 접속 시각만 · IP · 기기 · 경로는 저장하지 않음 */
export const adminVisits = sqliteTable("admin_visits", {
  name: text("name").primaryKey(),
  firstAt: text("first_at").notNull(),
  lastAt: text("last_at").notNull(),
});
