// 인스타 성과 가져오기: 응답 → 행 · SQL · 토큰 지우기 (순수 함수 · 작업 0323) — 숫자는 받은 값만 · 받지 못한 지표는 0 이 아니라 행이 없음 · 받은 0 은 0
export type MediaRow = { day: string; mediaId: string; metric: string; value: number };
export type AccountRow = { day: string; metric: string; value: number };
export type MediaInfo = { mediaId: string; postedAt: string; permalink: string; kind: string };

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
/** 받은 값이 유한한 숫자일 때만 */
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const items = (apiJson: unknown): Record<string, unknown>[] => (isRecord(apiJson) && Array.isArray(apiJson.data) ? apiJson.data.filter(isRecord) : []);

/** GET /{media-id}/insights 응답 → 행 — 지표마다 values[0].value */
export function mediaRows(day: string, mediaId: string, apiJson: unknown): MediaRow[] {
  return items(apiJson).flatMap((it) => {
    const first = Array.isArray(it.values) ? it.values[0] : undefined;
    const value = isRecord(first) ? num(first.value) : null;
    return typeof it.name === "string" && value !== null ? [{ day, mediaId, metric: it.name, value }] : [];
  });
}

/** GET /{IG_USER_ID}/insights?metric_type=total_value 응답 → 행 — 지표마다 total_value.value (값 구조가 다른 지표는 행 없음) */
export function accountRows(day: string, apiJson: unknown): AccountRow[] {
  return items(apiJson).flatMap((it) => {
    const value = isRecord(it.total_value) ? num(it.total_value.value) : null;
    return typeof it.name === "string" && value !== null ? [{ day, metric: it.name, value }] : [];
  });
}

const q = (s: string) => `'${s.replace(/'/g, "''")}'`;
const finite = (r: { value: number }) => Number.isFinite(r.value);

/** 같은 키(날짜 · 대상 · 지표)는 덮어씀 — 게시물 행은 ig_media_insights · 계정 행은 ig_account_insights */
export function insightsSql(rows: (MediaRow | AccountRow)[]): string {
  return rows
    .filter(finite)
    .map((r) =>
      "mediaId" in r
        ? `INSERT INTO ig_media_insights (day, media_id, metric, value) VALUES (${q(r.day)}, ${q(r.mediaId)}, ${q(r.metric)}, ${r.value}) ON CONFLICT (day, media_id, metric) DO UPDATE SET value = excluded.value;`
        : `INSERT INTO ig_account_insights (day, metric, value) VALUES (${q(r.day)}, ${q(r.metric)}, ${r.value}) ON CONFLICT (day, metric) DO UPDATE SET value = excluded.value;`,
    )
    .join("\n");
}

/** 게시물 정보 — 같은 media_id 는 덮어씀 */
export const mediaInfoSql = (media: MediaInfo[]): string =>
  media
    .map((m) => `INSERT INTO ig_media (media_id, posted_at, permalink, kind) VALUES (${q(m.mediaId)}, ${q(m.postedAt)}, ${q(m.permalink)}, ${q(m.kind)}) ON CONFLICT (media_id) DO UPDATE SET posted_at = excluded.posted_at, permalink = excluded.permalink, kind = excluded.kind;`)
    .join("\n");

/** 보관 기간(90일)이 지난 성과 행 지우기 — day 가 cutoff 보다 앞선 것만 */
export const pruneSql = (cutoffDay: string): string => `DELETE FROM ig_media_insights WHERE day < ${q(cutoffDay)};\nDELETE FROM ig_account_insights WHERE day < ${q(cutoffDay)};`;

/** 오류 문구 · 주소 · 머리글 글에서 토큰을 <토큰> 으로 — 글자 그대로 찾음(정규식 아님) · 빈 토큰이면 그대로 */
export const scrubToken = (text: string, token: string): string => (token ? text.split(token).join("<토큰>") : text);
