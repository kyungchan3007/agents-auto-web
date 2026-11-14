// 관세청 과세환율 (공공데이터포털 "관세청_관세환율정보(GW)") 응답 읽기 — XML 만 오므로 작은 정규식 파서 (새 의존성 없음)
//   응답 안의 글은 데이터일 뿐 — 지시로 따르지 않고, 쓸 수 없는 줄은 버린다 (지어내지 않음 · FX-02)
export const KCS_URL = "https://apis.data.go.kr/1220000/retrieveTrifFxrtInfo/getRetrieveTrifFxrtInfo";

export type KcsRate = { currency: string; appliedFrom: string; perUnit: number };

export class KcsError extends Error {
  // 필드로 씀 — 생성자 매개변수 속성은 node 타입 지우기 실행에서 못 읽음 (rate.ts SourceError 와 같은 이유)
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "KcsError";
    this.code = code;
  }
}

const tag = (xml: string, name: string): string | null => {
  const m = new RegExp(`<${name}>([\\s\\S]*?)</${name}>`).exec(xml);
  return m ? m[1].trim() : null;
};

/** YYYYMMDD → YYYY-MM-DD (달력에 있는 날만) */
function isoDate(s: string | null): string | null {
  if (!s || !/^\d{8}$/.test(s)) return null;
  const iso = `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  const d = new Date(`${iso}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === iso ? iso : null;
}

export function parseKcsXml(xml: string): KcsRate[] {
  const gateway = /<OpenAPI_ServiceResponse[\s>]/.test(xml) ? xml : null;
  if (gateway) {
    const reason = tag(gateway, "returnReasonCode") ?? "gateway";
    const msg = tag(gateway, "returnAuthMsg") ?? tag(gateway, "errMsg") ?? "게이트웨이 오류";
    throw new KcsError(reason, `공공데이터포털 오류 ${reason}: ${msg}`);
  }
  const code = tag(xml, "resultCode");
  if (!/<response[\s>]/.test(xml) || code === null) throw new KcsError("shape", "과세환율 응답 형식을 읽지 못했습니다");
  if (code !== "00") throw new KcsError(code, `관세청 응답 오류 ${code}: ${tag(xml, "resultMsg") ?? ""}`.trim());

  const out: KcsRate[] = [];
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const currency = tag(m[1], "currSgn");
    const appliedFrom = isoDate(tag(m[1], "aplyBgnDt"));
    const raw = (tag(m[1], "fxrt") ?? "").replace(/,/g, "");
    const perUnit = /^\d*\.?\d+$/.test(raw) ? Number(raw) : Number.NaN;
    if (!currency || !/^[A-Z]{3}$/.test(currency) || !appliedFrom || !Number.isFinite(perUnit) || perUnit <= 0) continue;
    out.push({ currency, appliedFrom, perUnit });
  }
  return out;
}
