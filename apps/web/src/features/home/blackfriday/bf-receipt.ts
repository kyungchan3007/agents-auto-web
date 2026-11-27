// 블랙프라이데이 hero 영수증 시간표 (작업 0381) — 흐른 시간 → 보이는 줄 수 · 카운트업 중인 합계 · 도장 (순수 함수 · 시간은 use-bf-receipt 가 잼)
//   영수증 자리는 처음부터 다 찍힌 최종 크기로 잡고(줄은 모두 그려 두고 아직 안 찍힌 줄만 보이지 않게) 모션은 그 안에서만 — hero 높이가 변하지 않음 (작업 0389)
//   0.5초 뒤부터 0.85초 간격으로 한 줄씩 · 줄마다 합계가 0.7초 카운트업 · 카운트업이 끝날 때마다 그때 합계로 도장을 다시 찍음 · 한 번만(반복 없음)
import { DUTY_FREE_USD } from "@/shared/customs/rules";
import { BF_ITEMS, receiptSteps } from "./bf-calc";

export const FIRST_MS = 500;
export const STEP_MS = 850;
export const COUNT_MS = 700;
export const RECEIPT_LIMIT_USD = DUTY_FREE_USD["us-list"];
/** 영수증에 찍는 날짜(고정 글 · 서버와 브라우저가 같아 어긋나지 않음) */
export const RECEIPT_DATE = "2026.11.27";
/** 바코드 막대 폭 — 고정 모양 */
export const BARCODE: readonly number[] = [2, 1, 3, 1, 1, 2, 4, 1, 2, 1, 1, 3, 2, 1, 4, 2, 1, 1, 3, 1, 2, 2, 1, 3, 1, 1, 2, 4, 1, 2, 1, 3, 2, 1, 1];

export type ReceiptView = { lines: number; usd: number; stamp: "면세" | "과세" | null; stamped: number };

const steps = receiptSteps(BF_ITEMS, RECEIPT_LIMIT_USD, null);
const sub = (n: number) => (n <= 0 ? 0 : steps[n - 1].subtotalUsd);
/** 끝나는 시각 */
export const END_MS = FIRST_MS + (BF_ITEMS.length - 1) * STEP_MS + COUNT_MS;

/** from → to 를 t(0~1)에 맞춰 느리게 닿는 값(easeOutCubic) */
export const countAt = (from: number, to: number, t: number): number => from + (to - from) * (1 - (1 - Math.min(1, Math.max(0, t))) ** 3);

export const START_VIEW: ReceiptView = { lines: 0, usd: 0, stamp: null, stamped: 0 };
export const FINAL_VIEW: ReceiptView = { lines: BF_ITEMS.length, usd: sub(BF_ITEMS.length), stamp: steps[BF_ITEMS.length - 1].stamp, stamped: BF_ITEMS.length };

/** 시작부터 흐른 시간(ms) → 영수증 모습 */
export function receiptAt(elapsedMs: number): ReceiptView {
  if (elapsedMs < FIRST_MS) return START_VIEW;
  if (elapsedMs >= END_MS) return FINAL_VIEW;
  const i = Math.min(BF_ITEMS.length - 1, Math.floor((elapsedMs - FIRST_MS) / STEP_MS));
  const t = (elapsedMs - (FIRST_MS + i * STEP_MS)) / COUNT_MS;
  const done = t >= 1;
  const stamped = done ? i + 1 : i;
  return { lines: i + 1, usd: countAt(sub(i), sub(i + 1), t), stamp: stamped > 0 ? steps[stamped - 1].stamp : null, stamped };
}

export const usdText = (n: number): string => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
/** 원화 환산 글 · 환율이 없으면 빈 글 */
export const krwText = (usd: number, perUsd: number | null): string => (perUsd === null ? "" : `${Math.round(usd * perUsd).toLocaleString("ko-KR")}원`);

/** 영수증 그림에 쓸 글 · 값 — 그리기는 bf-receipt-view.tsx · 계산은 모두 여기 */
export type ReceiptDraw = {
  /** 줄은 처음부터 모두 자리를 차지함(레이아웃 높이 변화 0) — shown 이 아닌 줄은 보이지 않을 뿐 */
  items: { name: string; usdText: string; shown: boolean; fresh: boolean }[];
  subText: string;
  limitText: string;
  krw: string;
  barPct: number;
  over: boolean;
  statusLabel: string;
  statusText: string;
  bars: { width: string; gap: string }[];
  stampText: string;
  stampOn: boolean;
  stampKind: string;
  stampKey: number;
};

export function receiptDraw(view: ReceiptView, perUsd: number | null): ReceiptDraw {
  const over = view.usd > RECEIPT_LIMIT_USD;
  return {
    items: BF_ITEMS.map((it, i) => ({ name: it.name, usdText: usdText(it.usd), shown: i < view.lines, fresh: i === view.lines - 1 })),
    subText: usdText(view.usd),
    limitText: usdText(RECEIPT_LIMIT_USD),
    krw: krwText(view.usd, perUsd),
    barPct: Math.min(100, (view.usd / RECEIPT_LIMIT_USD) * 100),
    over,
    statusLabel: over ? "한도 초과" : "한도까지",
    statusText: usdText(Math.abs(RECEIPT_LIMIT_USD - view.usd)),
    bars: BARCODE.map((w, i) => ({ width: `${w * 0.13}em`, gap: `${(i % 3 === 0 ? 2 : 1) * 0.07}em` })),
    stampText: view.stamp ?? "",
    stampOn: view.stamp !== null,
    stampKind: view.stamp ?? "",
    stampKey: view.stamped,
  };
}
