// /flights 그래프의 순수 계산 — 최저 · 최고 · 최근 라벨 글 · 선 끝 이름 · 범례 강조 · 가로 눈금 · 끝 라벨 밀어 띄우기 (작업 0181 · 테스트 flights-graph-view.test.ts)
// 값은 받은 자료 그대로 — 값이 없는 선은 null (그리지 않고 라벨도 만들지 않음) · 숫자를 지어내지 않음
import { numberText } from "@hav/shared/format";
import type { IndexPoint } from "./travel-index";

export type SeriesId = "air" | "tour" | "fx";

/** 지수 기준 — 통계청 KOSIS 지출목적별 소비자물가지수(품목포함, 2020=100) 에서 옴 (apps/api/src/features/indicators/kosis.ts · 수집 코드로 확인한 값) */
export const INDEX_BASE_NOTE = "지수 · 2020년 = 100 · 실제 요금이 아닙니다";
export const UNIT_NOTE = "선마다 단위가 달라 모양만 비교합니다";

export type SeriesStats = { min: IndexPoint; max: IndexPoint; last: IndexPoint };

/** 최저 · 최고 · 가장 최근 달 — 같은 값이면 앞선 달 · 값이 없으면 null */
export function seriesStats(points: IndexPoint[]): SeriesStats | null {
  if (points.length === 0) return null;
  const sorted = [...points].sort((a, b) => a.period.localeCompare(b.period));
  let min = sorted[0];
  let max = sorted[0];
  for (const p of sorted) {
    if (p.value < min.value) min = p;
    if (p.value > max.value) max = p;
  }
  return { min, max, last: sorted[sorted.length - 1] };
}

const idx1 = (v: number) => v.toFixed(1);

/** 국제항공료 선 위 라벨 — "2025-05 최저 · 지수 87.3" · "2025-11 최고 · 지수 95.1" */
export function extremeTexts(stats: SeriesStats): { min: string; max: string } {
  return { min: `${stats.min.period} 최저 · 지수 ${idx1(stats.min.value)}`, max: `${stats.max.period} 최고 · 지수 ${idx1(stats.max.value)}` };
}

const END_NAME: Record<SeriesId, string> = { air: "국제항공료", tour: "단체여행비", fx: "원/달러" };
const LEGEND_NAME: Record<SeriesId, string> = { air: "국제항공료", tour: "해외단체여행비", fx: "원/달러 월평균" };
const valueText = (id: SeriesId, v: number) => (id === "fx" ? `${numberText(Math.round(v))}원` : idx1(v));

/** 선 오른쪽 끝 이름 + 최근 값 — "국제항공료 103.2" · "단체여행비 112.4" · "원/달러 1,420원" */
export const endLabelText = (id: SeriesId, last: IndexPoint): string => `${END_NAME[id]} ${valueText(id, last.value)}`;

/** 범례 칩 글 — 이름 + 최근 값 (휴대폰은 끝 라벨 대신 이것이 최근 값을 보임) */
export const legendText = (id: SeriesId, last: IndexPoint): string => `${LEGEND_NAME[id]} ${valueText(id, last.value)}`;

/** 범례 칩을 누르면 그 선만 강조 · 같은 칩을 다시 누르면 원래대로 */
export const nextFocus = (current: SeriesId | null, clicked: SeriesId): SeriesId | null => (current === clicked ? null : clicked);

/** 선 굵기 · 불투명도 — 평소: 국제항공료 주인공(3 · 1) · 나머지 배경(2 · 0.55) · 강조 중: 고른 선 진하게(3 · 1) · 나머지 흐리게(2 · 0.25) */
export function lineStyle(focus: SeriesId | null, id: SeriesId): { width: number; opacity: number } {
  if (focus === null) return id === "air" ? { width: 3, opacity: 1 } : { width: 2, opacity: 0.55 };
  return focus === id ? { width: 3, opacity: 1 } : { width: 2, opacity: 0.25 };
}

/** 달 번호(연 × 12 + 월 − 1) → "2025-05" */
export const periodOf = (monthIdx: number): string => `${Math.floor(monthIdx / 12)}-${String((monthIdx % 12) + 1).padStart(2, "0")}`;

/** 가로축 눈금 — 마지막 달에서 step 달씩 거슬러 올라가 처음(from) 이상인 것 · 오래된 것부터 · 기본 6개월 간격 */
export function monthTicks(from: number, to: number, step = 6): { idx: number; period: string }[] {
  const out: { idx: number; period: string }[] = [];
  for (let i = to; i >= from; i -= step) out.unshift({ idx: i, period: periodOf(i) });
  return out;
}

export type AxisTick = { idx: number; period: string; anchor: "start" | "middle" | "end" };

/** 눈금 글자 칸(px) — 정렬 방향을 반영: 처음은 x 에서 오른쪽으로 · 끝은 x 에서 왼쪽으로 · 사이는 x 가운데 */
const tickBox = (anchor: AxisTick["anchor"], x: number, w: number): [number, number] => (anchor === "start" ? [x, x + w] : anchor === "end" ? [x - w, x] : [x - w / 2, x + w / 2]);

/** 가로축 눈금 — 처음 · 끝 달은 늘 보임(처음은 왼쪽 · 끝은 오른쪽으로 붙여 칸 밖으로 안 나감) · 사이 눈금(기본 6개월 간격)은 글자 칸끼리 gapPx 이상 떨어지지 않으면 생략 (작업 0181)
 *  x 는 그래프 칸 안 위치(px) — 선 좌표와 같은 식(양쪽 padX 안쪽 · 전체 폭 W 기준 비율) · labelPx = 눈금 글자("2025-05") 한 개의 실제 폭 · 겹침은 정렬 방향을 반영한 글자 칸으로 셈 */
export function axisTicks(from: number, to: number, widthPx: number, opts: { step?: number; labelPx?: number; gapPx?: number; viewW?: number; padX?: number } = {}): AxisTick[] {
  const { step = 6, labelPx = 60, gapPx = 12, viewW = 1000, padX = 32 } = opts;
  const x = (i: number) => (((to === from ? 0.5 : (i - from) / (to - from)) * (viewW - padX * 2) + padX) / viewW) * widthPx;
  const anchorOf = (i: number): AxisTick["anchor"] => (to === from ? "middle" : i === to ? "end" : i === from ? "start" : "middle");
  const boxOf = (i: number) => tickBox(anchorOf(i), x(i), labelPx);
  const kept: number[] = to === from ? [to] : [to, from];
  // 사이 눈금은 끝에 가까운 것부터 — 이미 고른 눈금의 글자 칸과 gapPx 안에 들면 건너뜀
  for (const t of monthTicks(from, to, step).reverse()) {
    if (t.idx === to || t.idx === from) continue;
    const [l, r] = boxOf(t.idx);
    if (kept.every((k) => {
      const [kl, kr] = boxOf(k);
      return l >= kr + gapPx || r <= kl - gapPx;
    })) kept.push(t.idx);
  }
  return kept.sort((a, b) => a - b).map((i) => ({ idx: i, period: periodOf(i), anchor: anchorOf(i) }));
}

/** 끝 라벨 세로 위치를 서로 minGap 이상 띄움 — 입력 순서대로 돌려줌 · lo ~ hi 안 · 겹치면 위에서부터 밀어 내림(넘치면 위로 올림) */
export function spreadLabels(ys: number[], minGap: number, lo: number, hi: number): number[] {
  const order = ys.map((y, i) => ({ y, i })).sort((a, b) => a.y - b.y);
  const out = order.map((o) => Math.min(Math.max(o.y, lo), hi));
  for (let k = 1; k < out.length; k++) if (out[k] < out[k - 1] + minGap) out[k] = out[k - 1] + minGap;
  // 아래로 밀려 hi 를 넘으면 아래에서부터 위로 올림
  for (let k = out.length - 1; k >= 0; k--) {
    const cap = k === out.length - 1 ? hi : out[k + 1] - minGap;
    if (out[k] > cap) out[k] = cap;
  }
  const res = new Array<number>(ys.length);
  order.forEach((o, k) => {
    res[o.i] = out[k];
  });
  return res;
}
