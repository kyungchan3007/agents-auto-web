// /calc(직구 계산) 결과 큰 문장 (작업 0170 · Figma 05) — 기존 IMP-01 ~ 06 규칙 그대로 · 금액을 지어내지 않음
import { currencySymbol } from "@hav/shared/currency";
import { numberText } from "@hav/shared/format";
import { type CalcInput, type CalcResult, parseAmount } from "./calc";

/** 기호가 있는 통화는 붙여서($180) · 없는 통화는 코드 + 공백(THB 5,000) */
function money(currency: string, price: string): string {
  const symbol = currencySymbol(currency);
  const n = parseAmount(price);
  const amount = typeof n === "number" && Number.isFinite(n) ? numberText(n, { maximumFractionDigits: 2 }) : price.trim();
  return symbol === currency ? `${currency} ${amount}` : `${symbol}${amount}`;
}

export function calcHeadline(result: CalcResult | null, input: Pick<CalcInput, "currency" | "price">): string {
  if (!result) return "물건 값을 넣어 보세요";
  if (!result.ok) return result.field === "rate" ? "환율을 받지 못했습니다" : result.reason;
  if (!result.over) return `${money(input.currency, input.price)} 물건, 세금 없이 받습니다`;
  const { duty, vat } = result.tax ?? { duty: null, vat: null };
  if (duty !== null && vat !== null) return `관세 · 부가세 약 ${numberText(duty + vat)}원이 붙습니다`;
  return "면세 한도를 넘었습니다 · 관세율을 넣으면 세금을 계산합니다";
}
