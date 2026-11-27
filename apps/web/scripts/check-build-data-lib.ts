// 빌드가 받은 자료 검사 판정 (작업 0388) — 순수 함수 · 읽고 부르는 일은 check-build-data.ts
//   깨진 자료("아직 받지 못했습니다" 화면)가 운영에 나가지 않게: 환율 받기 실패 · 통화 0개 · 받은 기준일이 지금 API 기준일보다 오래됨 → 실패 · 신호 · 항공료는 경고만
//   실패를 빌드 실패 코드로 바꾸는 건 운영 빌드(Workers Builds 의 main)에서만 — 미리보기 · 로컬 · CI gate 빌드는 경고만
export type FxSeen = { date: string | null; count: number };

export type BuildSeen = {
  /** 빌드가 받은 오늘 환율 — 받은 기록이 없으면 null */
  fx: FxSeen | null;
  /** 빌드가 받은 신호 · 항공료 지수가 비어 있지 않은가 — 받은 기록이 없거나 비면 false */
  signals: boolean;
  airFare: boolean;
  /** 검사 시점 API /fx/latest 의 기준일 — 못 읽으면 null(비교 못 함) */
  liveDate: string | null;
  /** 받은 기록을 읽을 수 있었나(캐시 폴더에 기록이 하나라도 있음) — 없으면 환율 없음을 실패로 보지 않음(검사 자체를 못 하는 것) */
  inspectable: boolean;
};

export type Verdict = { failures: string[]; warnings: string[]; exitCode: 0 | 1 };

/** 운영 빌드인가 — Workers Builds(WORKERS_CI=1 · WORKERS_CI_BRANCH=main) 또는 Pages(CF_PAGES=1 · CF_PAGES_BRANCH=main) · @hav/shared/api 의 mustHave 와 같은 기준 */
export const isProductionBuild = (env: Record<string, string | undefined>): boolean => (env.CF_PAGES === "1" && env.CF_PAGES_BRANCH === "main") || (env.WORKERS_CI === "1" && env.WORKERS_CI_BRANCH === "main");

export function judgeBuildData(seen: BuildSeen, production: boolean): Verdict {
  const failures: string[] = [];
  const warnings: string[] = [];
  if (!seen.inspectable) {
    warnings.push("빌드가 받은 자료 기록을 찾지 못해 검사하지 못했습니다");
  } else if (seen.fx === null) {
    failures.push("오늘 환율을 받지 못했습니다");
  } else if (seen.fx.count === 0) {
    failures.push("받은 환율의 통화가 0개입니다");
  } else if (seen.fx.date === null) {
    failures.push("받은 환율의 기준일이 없습니다");
  } else if (seen.liveDate !== null && seen.fx.date < seen.liveDate) {
    failures.push(`빌드가 받은 환율 기준일(${seen.fx.date})이 지금 API 기준일(${seen.liveDate})보다 오래됐습니다`);
  } else if (seen.liveDate === null) {
    warnings.push("지금 API 기준일을 읽지 못해 기준일 비교를 하지 못했습니다");
  }
  if (seen.inspectable && !seen.signals) warnings.push("신호를 받지 못했거나 비어 있습니다 (경고만)");
  if (seen.inspectable && !seen.airFare) warnings.push("국제항공료 지수를 받지 못했거나 비어 있습니다 (경고만)");
  return { failures, warnings, exitCode: production && failures.length > 0 ? 1 : 0 };
}

export type CacheEntry = { url: string; body: unknown; mtimeMs: number };

/** 받은 기록 중 경로가 같은 가장 최근 것의 본문 — 쿼리는 무시 */
export function pickCached(entries: CacheEntry[], pathname: string): unknown {
  const hits = entries.filter((e) => {
    try {
      return new URL(e.url).pathname === pathname;
    } catch {
      return false;
    }
  });
  return hits.sort((a, b) => b.mtimeMs - a.mtimeMs)[0]?.body ?? null;
}

const rec = (v: unknown): Record<string, unknown> | null => (v && typeof v === "object" ? (v as Record<string, unknown>) : null);

/** 받은 환율 모양에서 기준일 · 통화 수 — 모양이 다르면 null(받지 못한 것으로 봄) */
export function fxSeen(body: unknown): FxSeen | null {
  const o = rec(body);
  if (!o || !Array.isArray(o.rates)) return null;
  return { date: typeof o.date === "string" ? o.date : null, count: o.rates.length };
}

/** 신호 목록 · 항공료 시계열이 비어 있지 않은가 */
export const hasSignals = (body: unknown): boolean => Array.isArray(rec(body)?.signals) && (rec(body)!.signals as unknown[]).length > 0;
export const hasPoints = (body: unknown): boolean => Array.isArray(rec(body)?.points) && (rec(body)!.points as unknown[]).length > 0;

/** 지금 API 의 /fx/latest 응답에서 기준일 — 모양이 다르면 null */
export const liveDateOf = (body: unknown): string | null => {
  const d = rec(body)?.date;
  return typeof d === "string" ? d : null;
};

/** Next 가 빌드 때 받은 응답을 저장한 파일 하나 → 주소 · 본문 (모양이 다르면 null) */
export function parseCacheFile(text: string, mtimeMs: number): CacheEntry | null {
  try {
    const data = rec(rec(JSON.parse(text))?.data);
    if (!data || typeof data.url !== "string" || typeof data.body !== "string") return null;
    return { url: data.url, body: JSON.parse(Buffer.from(data.body, "base64").toString("utf8")), mtimeMs };
  } catch {
    return null;
  }
}
