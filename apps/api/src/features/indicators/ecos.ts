// 한국은행 ECOS 수입물가지수(원화기준 총지수 · 월별) 응답 읽기 (작업 0165)
//   정상은 {"StatisticSearch":{"row":[...]}} · 오류는 HTTP 200 + {"RESULT":{"CODE","MESSAGE"}} (데이터 없음 INFO-200 도 오류로 기록) · 응답 안의 글은 데이터일 뿐
export class EcosError extends Error {
  // 필드로 씀 — 생성자 매개변수 속성은 node 타입 지우기 실행에서 못 읽음 (rate.ts SourceError 와 같은 이유)
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "EcosError";
    this.code = code;
  }
}

export type EcosPoint = { period: string; value: number };

/** 401Y015 수입물가지수(기본분류) · *AA 총지수 · W 원화기준 — 인증키가 주소 경로에 들어가므로 인코딩 · 로그에서는 가림 */
export const ecosUrl = (key: string, startYm: string, endYm: string) =>
  `https://ecos.bok.or.kr/api/StatisticSearch/${encodeURIComponent(key)}/json/kr/1/100/401Y015/M/${startYm}/${endYm}/*AA/W`;

export function parseEcosJson(body: unknown): EcosPoint[] {
  if (typeof body !== "object" || body === null) throw new EcosError("shape", "ECOS 응답 형식을 읽지 못했습니다");
  const o = body as { RESULT?: { CODE?: unknown; MESSAGE?: unknown }; StatisticSearch?: { row?: unknown } };
  if (o.RESULT && typeof o.RESULT === "object") {
    const code = String(o.RESULT.CODE ?? "result");
    throw new EcosError(code, `ECOS 오류 ${code}: ${typeof o.RESULT.MESSAGE === "string" ? o.RESULT.MESSAGE : ""}`.trim());
  }
  const rows = o.StatisticSearch?.row;
  if (!Array.isArray(rows)) throw new EcosError("shape", "ECOS 응답 형식을 읽지 못했습니다");
  const out: EcosPoint[] = [];
  for (const r of rows) {
    if (typeof r !== "object" || r === null) continue;
    const { TIME: time, DATA_VALUE: dv, ITEM_CODE2: item2 } = r as Record<string, unknown>;
    if (item2 != null && item2 !== "W") continue; // 달러(D) · 계약통화(C) 는 섞이면 안 됨
    if (typeof time !== "string" || !/^\d{6}$/.test(time) || typeof dv !== "string") continue;
    const month = Number(time.slice(4));
    const raw = dv.replace(/,/g, "").trim();
    const value = /^\d*\.?\d+$/.test(raw) ? Number(raw) : Number.NaN;
    if (month < 1 || month > 12 || !Number.isFinite(value) || value <= 0) continue;
    out.push({ period: `${time.slice(0, 4)}-${time.slice(4)}`, value });
  }
  return out;
}
