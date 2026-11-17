// 통화로 여행 물가 거르기 — 순수 함수 (작업 0193)
// 통화 상세의 "이 통화 쓰는 나라 물가 보기" 가 /prices?currency=CODE 로 오면 그 통화를 쓰는 나라만 보임
// 나라 판정은 공용 countriesOf · 물가 자료가 없는 나라는 noData 로 남김(지어내지 않음) · 모르는 코드는 거르지 않고 안내
import { currencyName } from "@hav/shared/currency";
import { countriesOf } from "@hav/shared/travel";
import type { PriceBand } from "./bands";

export type CurrencyFilter =
  | { kind: "all" }
  | { kind: "filtered"; code: string; bands: PriceBand[]; /** 쓰는 나라지만 물가 자료가 없는 나라(ISO) */ noData: string[]; notice: string }
  | { kind: "unknown"; notice: string };

/** 주소의 currency 값 — 영문 3글자만 대문자로 · 그 밖(빈 글자 · 이상한 글자)은 null */
export function parseCurrencyParam(raw: string | null): string | null {
  const s = (raw ?? "").trim();
  return /^[A-Za-z]{3}$/.test(s) ? s.toUpperCase() : null;
}

const objectJosa = (word: string): string => {
  const last = word.charCodeAt(word.length - 1);
  return last >= 0xac00 && last <= 0xd7a3 && (last - 0xac00) % 28 !== 0 ? "을" : "를";
};

export const UNKNOWN_NOTICE = "여행지 나라를 찾지 못한 통화라 전체를 보여 줍니다";

export function currencyFilter(bands: PriceBand[], missing: string[], raw: string | null): CurrencyFilter {
  if (raw === null || raw.trim() === "") return { kind: "all" };
  const code = parseCurrencyParam(raw);
  const isos = code ? countriesOf(code) : [];
  if (!code || isos.length === 0) return { kind: "unknown", notice: UNKNOWN_NOTICE };
  const name = currencyName(code);
  return {
    kind: "filtered",
    code,
    bands: bands.map((b) => ({ ...b, rows: b.rows.filter((r) => isos.includes(r.country)) })).filter((b) => b.rows.length > 0),
    noData: isos.filter((iso) => missing.includes(iso)),
    notice: `${name}${objectJosa(name)} 쓰는 나라 ${isos.length}곳`,
  };
}
