// 블랙프라이데이 hero 계산기 · 영수증 줄 (작업 0381) — 달러 금액 → 원화 · 면세 한도 안 · 밖 · 한도 막대 · 순수 함수
//   한도는 직구 계산기 rules.ts 한 곳(IMP-03) · 금액 읽기 · 안내 글은 calc.ts 와 같음 · 새 세금 규칙 없음 · 입력값은 보내지 않고 저장하지 않음(IMP-01) · 결과는 예상(IMP-04) · 틀린 입력은 결과 대신 이유(IMP-05)
//   환율은 pickRate 의 결과를 그대로 받음(이번 주 과세환율이 있으면 그것 · 없으면 수출입은행 + 예상 금액 · IMP-06) · 받지 못한 환율은 지어내지 않음
import { parseAmount } from "../../import-calc/calculator/calc";
import { DUTY_FREE_USD, type Route } from "../../import-calc/calculator/rules";

export type BfPicked = { rate: { baseRate: number; unit: number }; source: { kind: "customs"; weekStart: string; label: string } | { kind: "bank"; label: string } };

export const BF_IDLE_HINT = "원화로 얼마인지 바로 봅니다";

export type BfResult =
  | { kind: "idle"; hint: string }
  | { kind: "error"; reason: string }
  | { kind: "ok"; krw: number; krwText: string; over: boolean; leftUsd: number; overUsd: number; ratio: number; judge: string; estimated: boolean; sourceLabel: string };

const round2 = (n: number) => Math.round(n * 100) / 100;
/** $ 금액 — 소수 둘째 자리까지 · 끝자리 0 생략 · 천 단위 쉼표 */
const usd = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

export function bfCalc(input: { amount: string; route: Route }, picked: BfPicked | null): BfResult {
  const amount = parseAmount(input.amount);
  if (amount === "empty") return { kind: "idle", hint: BF_IDLE_HINT };
  if (Number.isNaN(amount)) return { kind: "error", reason: "물건 값은 0 이상의 숫자만 됩니다" };
  if (amount <= 0) return { kind: "error", reason: "물건 값은 0보다 커야 합니다" };
  if (!picked) return { kind: "error", reason: "달러 환율을 받지 못해 계산할 수 없습니다" };
  const limit = DUTY_FREE_USD[input.route];
  const krw = Math.round((amount * picked.rate.baseRate) / picked.rate.unit);
  const over = amount > limit;
  const leftUsd = over ? 0 : round2(limit - amount);
  const overUsd = over ? round2(amount - limit) : 0;
  return {
    kind: "ok",
    krw,
    krwText: `약 ${krw.toLocaleString("ko-KR")}원`,
    over,
    leftUsd,
    overUsd,
    ratio: amount / limit,
    judge: over ? `한도 초과 ${usd(overUsd)} · 관부가세 대상` : `면세 · 한도까지 ${usd(leftUsd)} 남음`,
    estimated: picked.source.kind === "bank",
    sourceLabel: picked.source.label,
  };
}

/** 영수증 예시 장바구니 */
export const BF_ITEMS = [
  { name: "에스프레소 머신", usd: 149 },
  { name: "원두", usd: 38 },
  { name: "머그", usd: 24 },
];

/** 줄마다 누적 소계 · 한도 이하면 면세 아니면 과세 · 원화는 소계 × 환율(환율이 없으면 null) */
export function receiptSteps(items: { name: string; usd: number }[], limitUsd: number, perUsdKrw: number | null): { name: string; usd: number; subtotalUsd: number; krw: number | null; stamp: "면세" | "과세" }[] {
  let sum = 0;
  return items.map((it) => {
    sum = round2(sum + it.usd);
    return { name: it.name, usd: it.usd, subtotalUsd: sum, krw: perUsdKrw === null ? null : Math.round(sum * perUsdKrw), stamp: sum <= limitUsd ? "면세" : "과세" };
  });
}

/** 환율 기준 줄 — "$1 = 1,392원 · 출처" · 환율이 없으면 빈 글(지어내지 않음) */
export const rateLine = (perUsd: number | null, sourceLabel: string): string => (perUsd === null ? "" : `$1 = ${perUsd.toLocaleString("ko-KR", { maximumFractionDigits: 2 })}원 · ${sourceLabel}`);
