// 금액 글 읽기 (직구 계산기 · 블프 hero 가 함께 씀) — "1,234.5" · " 20 " → 숫자 · 빈 칸은 empty · 숫자가 아니면 NaN
import { isNumberText, stripNumberText } from "@hav/shared/format";

export function parseAmount(s: string): number | "empty" {
  const t = stripNumberText(s);
  if (t === "") return "empty";
  return isNumberText(t) ? Number(t) : Number.NaN;
}
