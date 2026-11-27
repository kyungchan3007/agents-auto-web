// 작업 0388 — 빌드 자료 검사 판정 (순수 함수 · check-build-data-lib.mjs)
//   규칙: 환율 null · 통화 0개 · 기준일 없음 · 받은 기준일 < 지금 API 기준일 → 실패 / 지금 API 기준일 null · 신호 · 항공료 비어 있음 · 검사할 기록 없음 → 경고만
//   종료 코드 1 은 운영 빌드(production)이고 실패가 있을 때만 · 미리보기 · 로컬 · CI gate 는 실패가 있어도 0(경고만)
import { describe, expect, it } from "vitest";
import { fxSeen, hasPoints, hasSignals, isProductionBuild, judgeBuildData, liveDateOf, parseCacheFile, pickCached } from "./check-build-data-lib.mjs";

const OK = { fx: { date: "2026-11-27", count: 31 }, signals: true, airFare: true, liveDate: "2026-11-27", inspectable: true };
const seen = (patch: Partial<typeof OK> | Record<string, unknown>) => ({ ...OK, ...patch }) as Parameters<typeof judgeBuildData>[0];

describe("judgeBuildData — 정상", () => {
  it("모두 받았고 기준일이 같으면 실패 · 경고 없음 · 코드 0 (운영 · 비운영 모두)", () => {
    for (const production of [true, false]) expect(judgeBuildData(OK, production), String(production)).toEqual({ failures: [], warnings: [], exitCode: 0 });
  });
  it("빌드가 받은 기준일이 지금 API 보다 새로우면 통과(검사 사이에 날짜가 바뀐 경우)", () => {
    expect(judgeBuildData(seen({ fx: { date: "2026-11-28", count: 31 } }), true).failures).toEqual([]);
  });
});

describe("judgeBuildData — 환율 받기 실패", () => {
  it("fx 가 null 이면 실패 한 줄 · 운영이면 코드 1", () => {
    const v = judgeBuildData(seen({ fx: null }), true);
    expect(v.failures).toHaveLength(1);
    expect(v.failures[0]).toContain("환율");
    expect(v.exitCode).toBe(1);
  });
  it("같은 상황이 미리보기 · 로컬이면 실패 목록은 남지만 코드는 0(경고만)", () => {
    const v = judgeBuildData(seen({ fx: null }), false);
    expect(v.failures).toHaveLength(1);
    expect(v.exitCode).toBe(0);
  });
});

describe("judgeBuildData — 통화 0개 · 기준일 없음", () => {
  it("count 0 → 실패 · 운영 코드 1", () => {
    const v = judgeBuildData(seen({ fx: { date: "2026-11-27", count: 0 } }), true);
    expect(v.failures[0]).toContain("0개");
    expect(v.exitCode).toBe(1);
  });
  it("date null → 실패 · 운영 코드 1", () => {
    const v = judgeBuildData(seen({ fx: { date: null, count: 31 } }), true);
    expect(v.failures[0]).toContain("기준일");
    expect(v.exitCode).toBe(1);
  });
  it("비운영은 둘 다 코드 0", () => {
    expect(judgeBuildData(seen({ fx: { date: "2026-11-27", count: 0 } }), false).exitCode).toBe(0);
    expect(judgeBuildData(seen({ fx: { date: null, count: 31 } }), false).exitCode).toBe(0);
  });
});

describe("judgeBuildData — 기준일 오래됨 · 주말", () => {
  it("받은 기준일(11-26)이 지금 API 기준일(11-27)보다 오래되면 실패 · 두 날짜가 글에 들어감 · 운영 코드 1", () => {
    const v = judgeBuildData(seen({ fx: { date: "2026-11-26", count: 31 } }), true);
    expect(v.failures).toHaveLength(1);
    expect(v.failures[0]).toContain("2026-11-26");
    expect(v.failures[0]).toContain("2026-11-27");
    expect(v.exitCode).toBe(1);
  });
  it("주말 — API 가 직전 영업일(금 11-27)을 주면 빌드가 받은 날짜와 같아 통과 (날짜를 지어내지 않음)", () => {
    // 토요일(11-28) · 일요일(11-29)에도 API /fx/latest 기준일은 금요일(11-27) · 빌드도 같은 값을 받음 → 날짜가 같아 통과
    const v = judgeBuildData(seen({ fx: { date: "2026-11-27", count: 31 }, liveDate: "2026-11-27" }), true);
    expect(v.failures).toEqual([]);
    expect(v.exitCode).toBe(0);
  });
  it("월요일 아침 — 빌드는 금요일 값 · API 는 아직 금요일이면 통과 · API 가 월요일 값을 주면 오래됨", () => {
    expect(judgeBuildData(seen({ fx: { date: "2026-11-27", count: 31 }, liveDate: "2026-11-27" }), true).failures).toEqual([]);
    expect(judgeBuildData(seen({ fx: { date: "2026-11-27", count: 31 }, liveDate: "2026-11-30" }), true).failures).toHaveLength(1);
  });
  it("지금 API 기준일을 못 읽으면(null) 비교하지 못하고 경고만 · 코드 0(운영도)", () => {
    const v = judgeBuildData(seen({ liveDate: null }), true);
    expect(v.failures).toEqual([]);
    expect(v.warnings.some((w) => w.includes("기준일"))).toBe(true);
    expect(v.exitCode).toBe(0);
  });
});

describe("judgeBuildData — 신호 · 항공료 · 검사 불가는 경고만", () => {
  it("신호가 비면 경고 한 줄 · 실패 아님 · 운영도 코드 0", () => {
    const v = judgeBuildData(seen({ signals: false }), true);
    expect(v.failures).toEqual([]);
    expect(v.warnings).toHaveLength(1);
    expect(v.warnings[0]).toContain("신호");
    expect(v.exitCode).toBe(0);
  });
  it("항공료 지수가 비면 경고 한 줄 · 운영도 코드 0", () => {
    const v = judgeBuildData(seen({ airFare: false }), true);
    expect(v.failures).toEqual([]);
    expect(v.warnings[0]).toContain("항공료");
    expect(v.exitCode).toBe(0);
  });
  it("검사할 기록이 없으면(inspectable false) 환율이 null 이어도 실패가 아니라 경고 — 검사 자체를 못 한 것", () => {
    const v = judgeBuildData(seen({ inspectable: false, fx: null, signals: false, airFare: false }), true);
    expect(v.failures).toEqual([]);
    expect(v.exitCode).toBe(0);
    expect(v.warnings).toHaveLength(1);
  });
  it("검사 불가 경고는 운영일 때 비운영과 다른 글(눈에 띄게 · '운영' 이 들어감) · 실패는 아님", () => {
    const prod = judgeBuildData(seen({ inspectable: false }), true).warnings[0];
    const dev = judgeBuildData(seen({ inspectable: false }), false).warnings[0];
    expect(prod).toContain("운영");
    expect(prod).not.toBe(dev);
  });
  it("여러 문제가 겹치면 실패와 경고가 따로 모임", () => {
    const v = judgeBuildData(seen({ fx: { date: "2026-11-20", count: 31 }, signals: false, airFare: false }), true);
    expect(v.failures).toHaveLength(1);
    expect(v.warnings).toHaveLength(2);
    expect(v.exitCode).toBe(1);
  });
});

describe("isProductionBuild — 운영 판정 환경 변수", () => {
  it("Workers Builds: WORKERS_CI=1 + WORKERS_CI_BRANCH=main", () => {
    expect(isProductionBuild({ WORKERS_CI: "1", WORKERS_CI_BRANCH: "main" })).toBe(true);
  });
  it("Pages: CF_PAGES=1 + CF_PAGES_BRANCH=main", () => {
    expect(isProductionBuild({ CF_PAGES: "1", CF_PAGES_BRANCH: "main" })).toBe(true);
  });
  it("main 이 아닌 브랜치(develop · task/…)는 운영 아님", () => {
    expect(isProductionBuild({ WORKERS_CI: "1", WORKERS_CI_BRANCH: "develop" })).toBe(false);
    expect(isProductionBuild({ WORKERS_CI: "1", WORKERS_CI_BRANCH: "task/0388-build-guard" })).toBe(false);
    expect(isProductionBuild({ CF_PAGES: "1", CF_PAGES_BRANCH: "develop" })).toBe(false);
  });
  it("브랜치만 main 이고 CI 표시가 없으면(로컬에서 이름만 맞춘 경우) 운영 아님", () => {
    expect(isProductionBuild({ WORKERS_CI_BRANCH: "main" })).toBe(false);
    expect(isProductionBuild({ CF_PAGES_BRANCH: "main" })).toBe(false);
    expect(isProductionBuild({ WORKERS_CI: "0", WORKERS_CI_BRANCH: "main" })).toBe(false);
  });
  it("환경 변수가 없으면(로컬 · 일반 CI) 운영 아님 · 두 서비스 값을 섞어도 안 됨", () => {
    expect(isProductionBuild({})).toBe(false);
    expect(isProductionBuild({ WORKERS_CI: "1", CF_PAGES_BRANCH: "main" })).toBe(false);
    expect(isProductionBuild({ CF_PAGES: "1", WORKERS_CI_BRANCH: "main" })).toBe(false);
  });
});

describe("받은 값 읽기 — fxSeen · hasSignals · hasPoints · liveDateOf", () => {
  it("fxSeen: 기준일 · 통화 수", () => {
    expect(fxSeen({ date: "2026-11-27", rates: [{}, {}, {}] })).toEqual({ date: "2026-11-27", count: 3 });
    expect(fxSeen({ date: "2026-11-27", rates: [] })).toEqual({ date: "2026-11-27", count: 0 });
  });
  it("fxSeen: 기준일이 글이 아니면 date null · 모양이 다르면 null(받지 못한 것)", () => {
    expect(fxSeen({ date: 20261127, rates: [{}] })).toEqual({ date: null, count: 1 });
    for (const bad of [null, undefined, "x", 1, [], {}, { rates: "x" }]) expect(fxSeen(bad), JSON.stringify(bad)).toBeNull();
  });
  it("hasSignals · hasPoints: 비지 않은 배열일 때만 true", () => {
    expect(hasSignals({ signals: [{ currency: "USD" }] })).toBe(true);
    expect(hasSignals({ signals: [] })).toBe(false);
    expect(hasSignals({})).toBe(false);
    expect(hasSignals(null)).toBe(false);
    expect(hasPoints({ points: [{ period: "2026-10", value: 1 }] })).toBe(true);
    expect(hasPoints({ points: [] })).toBe(false);
    expect(hasPoints("x")).toBe(false);
  });
  it("liveDateOf: date 글이 있으면 그 값 · 없거나 모양이 다르면 null", () => {
    expect(liveDateOf({ date: "2026-11-27", rates: [] })).toBe("2026-11-27");
    for (const bad of [null, {}, { date: 5 }, "x"]) expect(liveDateOf(bad), JSON.stringify(bad)).toBeNull();
  });
});

describe("pickCached — 주소 경로가 같은 가장 최근 기록", () => {
  const e = (url: string, body: unknown, mtimeMs: number) => ({ url, body, mtimeMs });
  const entries = [
    e("https://api.flapfx.com/fx/latest", { v: "old" }, 100),
    e("https://api.flapfx.com/fx/latest?x=1", { v: "new" }, 300),
    e("https://api.flapfx.com/signals", { v: "sig" }, 200),
    e("not a url", { v: "bad" }, 999),
  ];
  it("같은 경로가 여럿이면 가장 최근(mtime 큰 것) · 쿼리는 무시", () => {
    expect(pickCached(entries, "/fx/latest")).toEqual({ v: "new" });
  });
  it("다른 경로는 그 경로 기록 · 잘못된 주소는 건너뜀", () => {
    expect(pickCached(entries, "/signals")).toEqual({ v: "sig" });
  });
  it("없으면 null · 빈 목록도 null", () => {
    expect(pickCached(entries, "/nothing")).toBeNull();
    expect(pickCached([], "/fx/latest")).toBeNull();
  });
  it("넘긴 목록의 순서를 바꾸지 않음", () => {
    const copy = [...entries];
    pickCached(entries, "/fx/latest");
    expect(entries).toEqual(copy);
  });
});

describe("parseCacheFile — Next 빌드 응답 캐시 파일 한 개", () => {
  const file = (body: unknown, url = "https://api.flapfx.com/fx/latest") => JSON.stringify({ kind: "FETCH", data: { url, body: Buffer.from(JSON.stringify(body), "utf8").toString("base64") } });
  it("주소 · 본문(base64 → JSON)과 수정 시각을 돌려줌", () => {
    expect(parseCacheFile(file({ date: "2026-11-27", rates: [] }), 123)).toEqual({ url: "https://api.flapfx.com/fx/latest", body: { date: "2026-11-27", rates: [] }, mtimeMs: 123 });
  });
  it("한글 본문도 그대로", () => {
    expect(parseCacheFile(file({ name: "도쿄" }), 1)?.body).toEqual({ name: "도쿄" });
  });
  it("모양이 다르거나 깨졌으면 null — JSON 아님 · data 없음 · url · body 가 글이 아님 · body 가 JSON 아님", () => {
    expect(parseCacheFile("not json", 1)).toBeNull();
    expect(parseCacheFile("{}", 1)).toBeNull();
    expect(parseCacheFile(JSON.stringify({ data: { url: 1, body: "e30=" } }), 1)).toBeNull();
    expect(parseCacheFile(JSON.stringify({ data: { url: "https://a/b", body: 5 } }), 1)).toBeNull();
    expect(parseCacheFile(JSON.stringify({ data: { url: "https://a/b", body: Buffer.from("not json").toString("base64") } }), 1)).toBeNull();
    expect(parseCacheFile("null", 1)).toBeNull();
  });
});

describe("빌드 연결 — package.json 의 build 끝에 검사", () => {
  it("apps/web build = next build 다음 check-build-data.mjs (검사 실패 코드가 빌드 실패가 됨)", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const pkg = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf8")) as { scripts: Record<string, string> };
    expect(pkg.scripts.build).toMatch(/next build\s*&&\s*node scripts\/check-build-data\.mjs/);
  });
});
