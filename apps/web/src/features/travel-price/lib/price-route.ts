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
export function routeCardText(stop: { value: number; band: RouteBand }, index: number, n: number): { meta: string; pct: string; budget: string; tiles: string[] } {
  const v = stop.value;
  return {
    meta: `정거장 ${index + 1} / ${n} · ${BAND_NAME[stop.band]}`,
    pct: v === 100 ? "기준" : v < 100 ? `${100 - v}% 쌉니다` : `${v - 100}% 비쌉니다`,
    budget: `약 ${(v * 1000).toLocaleString("ko-KR")}원`,
    tiles: String(v).padStart(3, " ").split(""),
  };
}
