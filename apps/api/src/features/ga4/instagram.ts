// GA4 유입에서 인스타를 따로 셈 (작업 0374) — 링크(리퍼러 instagram.com · 그 하위 호스트)와 utm(utm_source=instagram · ig)을 나눔 · 순수 함수
//   모든 행(날짜 · 출처 · 매체 · 캠페인 줄)을 날짜를 가로질러 합 · 출처 글만 봄(캠페인 이름이 instagram 인 줄 · 비슷한 이름은 안 셈) · 행이 없으면 null(받지 못함)
import type { Ga4SourceRow } from "./report";

export type Visits = { sessions: number; users: number };

const isLink = (source: string) => source === "instagram.com" || source.endsWith(".instagram.com");
const isUtm = (source: string) => source === "instagram" || source === "ig";

export function instagramVisits(rows: Ga4SourceRow[]): { link: Visits; utm: Visits } | null {
  if (rows.length === 0) return null;
  const link = { sessions: 0, users: 0 };
  const utm = { sessions: 0, users: 0 };
  for (const r of rows) {
    const s = r.source.trim().toLowerCase();
    const to = isLink(s) ? link : isUtm(s) ? utm : null;
    if (!to) continue;
    to.sessions += r.sessions;
    to.users += r.users;
  }
  return { link, utm };
}
