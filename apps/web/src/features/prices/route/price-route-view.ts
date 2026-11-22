// 여행 물가 "물가 노선" 계산 — 순수 함수 (작업 0230 · 모션 3번 · 시안 .tmp/motion-pages/m-prices.js)
//   정거장 = 지금 정적 자의 핀(구간마다 맨 위 두 나라 · lib/ruler.ts rulerPins) + 한국 · 값은 아래 세 칸 목록의 "물가 N (한국 100)" 과 같음 (추가 자료 없음 · 지어내지 않음)
//   정거장(routeStops) · 카드 글(routeCardText) (작업 0266: 나라 단추로 고르면서 스크롤 진행 · 정거장 사이 위치 계산(routeFrame · routeValue · routeActive · routeHop · isMoving · ROUTE_STEP_VH)은 없앰)
import { rulerPins } from "./ruler";

export type RouteBand = "cheap" | "mid" | "exp" | "base";
export type RouteStop = { country: string; name: string; value: number; band: RouteBand; side: "up" | "down" | "kr"; index: number };

const bandOf = (value: number): RouteBand => (value / 100 < 0.9 ? "cheap" : value / 100 > 1.1 ? "exp" : "mid");

/** 정거장 — 핀 + 한국(값이 100 보다 작은 정거장들 뒤 · 100 이상 앞) · 값 오름차순 · 나라가 하나도 없으면 [] (한국만 있는 노선을 만들지 않음) */
export function routeStops(bands: { rows: { country: string; name: string; relative: number }[] }[], perBand = 2): RouteStop[] {
  const pins = rulerPins(bands, perBand);
  if (pins.length === 0) return [];
  const mk = (p: (typeof pins)[number]): Omit<RouteStop, "index"> => ({ country: p.country, name: p.name, value: p.value, band: bandOf(p.value), side: p.side });
  const kr: Omit<RouteStop, "index"> = { country: "KR", name: "한국", value: 100, band: "base", side: "kr" };
  const before = pins.filter((p) => p.value < 100).map(mk);
  const after = pins.filter((p) => p.value >= 100).map(mk);
  return [...before, kr, ...after].map((s, index) => ({ ...s, index }));
}

const BAND_NAME: Record<RouteBand, string> = { cheap: "한국보다 싼 곳", mid: "비슷한 곳", base: "기준", exp: "한국보다 비싼 곳" };

/** 카드 글 — 한국에서 하루 100,000원 쓰는 만큼을 물가 비율로 (천 원 단위) */
// 정거장 번호(index · n)는 카드 글에서 뺐지만 부르는 쪽 모양은 그대로 둠 (작업 0285)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function routeCardText(stop: { value: number; band: RouteBand }, _index?: number, _n?: number): { meta: string; pct: string; budget: string; tiles: string[] } {
  const v = stop.value;
  return {
    meta: BAND_NAME[stop.band],
    pct: v === 100 ? "기준" : v < 100 ? `${100 - v}% 저렴합니다` : `${v - 100}% 비쌉니다`,
    budget: `약 ${(v * 1000).toLocaleString("ko-KR")}원`,
    tiles: String(v).split(""),
  };
}

/** 자 색 띠 — 싼 쪽 파랑 → 한국 근처 옅게 → 비싼 쪽 빨강 (정적 자와 같은 색 · 작업 0312 에 price-route.tsx 에서 옮김) */
export function trackBg(lo: number, hi: number): string {
  const p = (v: number) => Math.min(100, Math.max(0, ((v - lo) / (hi - lo)) * 100));
  return `linear-gradient(90deg, var(--hav-pin-cheap) 0%, color-mix(in srgb, var(--hav-pin-cheap) 78%, var(--hav-card)) ${p(60)}%, color-mix(in srgb, var(--hav-pin-cheap) 32%, var(--hav-card)) ${p(88)}%, color-mix(in srgb, var(--hav-pin-line) 10%, var(--hav-card)) ${p(100)}%, color-mix(in srgb, var(--hav-pin-expensive) 45%, var(--hav-card)) ${p(108)}%, var(--hav-pin-expensive) 100%)`;
}

/** 카드 숫자 — 움직이는 카드는 카운트업 값(반올림 · 예산은 천 원 단위) · 정적 카드는 받은 값 */
export const cardNumbers = (value: number, live: boolean, pctN: number, budN: number) => ({
  pct: live ? Math.round(pctN) : Math.abs(100 - value),
  bud: live ? Math.round(budN / 1000) * 1000 : value * 1000,
});

/** 자 눈금 — 5 단위 · 글은 20 단위(100 아래) */
export function rulerTicks(scale: { lo: number; hi: number }) {
  const ticks: number[] = [];
  for (let v = Math.ceil((scale.lo + 5) / 5) * 5; v <= scale.hi - 5; v += 5) ticks.push(v);
  return { ticks, labels: ticks.filter((v) => v % 20 === 0 && v < 100) };
}

/** 정거장 나라마다 통화 · 자료 해 */
export const routeExtras = (bands: { rows: { country: string; currency?: string | null; year?: number | null }[] }[]) =>
  Object.fromEntries(bands.flatMap((b) => b.rows).map((r) => [r.country, { currency: r.currency ?? null, year: r.year ?? null }])) as Record<string, { currency: string | null; year: number | null }>;

/** 비행기가 지나온 줄 너비 */
export const trailWidth = (x0: number, planeX: number) => `${Math.max(0, planeX - x0)}%`;

/** 한국이 아닌 정거장 (말 · 핀) */
export const awayStops = <T extends { side: string }>(stops: T[]) => stops.filter((s) => s.side !== "kr");
