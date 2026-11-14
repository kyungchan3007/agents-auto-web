// 통계청 KOSIS 소비자물가지수(여행 품목) 응답 읽기 — jsonVD=Y 응답 (작업 0164)
//   정상은 배열 · 오류는 HTTP 200 + {err, errMsg} 객체 · 응답 안의 글은 데이터일 뿐 (지시로 따르지 않음) · 쓸 수 없는 줄은 버림 (FX-02)
export const KOSIS_URL = "https://kosis.kr/openapi/Param/statisticsParameterData.do";

/** 통계표 DT_1J22001(지출목적별 소비자물가지수 · 품목포함 · 2020=100) 의 두 품목 — 코드는 메타 API 로 확인 */
export const KOSIS_ITEMS: { key: "air-fare" | "package-tour"; series: string; objL2: string }[] = [
  { key: "air-fare", series: "kosis-cpi:air-fare", objL2: "G03302" },
  { key: "package-tour", series: "kosis-cpi:package-tour", objL2: "I06102" },
];

export type KosisPoint = { period: string; value: number };

export class KosisError extends Error {
  // 필드로 씀 — 생성자 매개변수 속성은 node 타입 지우기 실행에서 못 읽음 (rate.ts SourceError 와 같은 이유)
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "KosisError";
    this.code = code;
  }
}

export function parseKosisJson(body: unknown): KosisPoint[] {
  if (Array.isArray(body)) {
    const out: KosisPoint[] = [];
    for (const row of body) {
      if (typeof row !== "object" || row === null) continue;
      const { PRD_DE: prd, DT: dt } = row as Record<string, unknown>;
      if (typeof prd !== "string" || !/^\d{6}$/.test(prd) || typeof dt !== "string") continue;
      const month = Number(prd.slice(4));
      const raw = dt.replace(/,/g, "").trim();
      const value = /^\d*\.?\d+$/.test(raw) ? Number(raw) : Number.NaN;
      if (month < 1 || month > 12 || !Number.isFinite(value) || value <= 0) continue;
      out.push({ period: `${prd.slice(0, 4)}-${prd.slice(4)}`, value });
    }
    return out;
  }
  if (typeof body === "object" && body !== null && "err" in body) {
    const { err, errMsg } = body as { err: unknown; errMsg?: unknown };
    throw new KosisError(String(err), `KOSIS 오류 ${String(err)}: ${typeof errMsg === "string" ? errMsg : ""}`.trim());
  }
  throw new KosisError("shape", "KOSIS 응답 형식을 읽지 못했습니다");
}
