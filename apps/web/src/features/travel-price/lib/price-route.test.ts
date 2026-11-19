// 작업 0230 — 여행 물가 '스크롤 물가 노선' 계산 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   기준: .tmp/lead-motion-1119/06-prices-3.png · 참고 구현 .tmp/motion-pages/m-prices.js (정거장 S · 스크롤 → 위치 frame() · 카드 문구)
//
// builder 가 만들 것 — apps/web/src/features/travel-price/lib/price-route.ts
//   export type RouteBand = "cheap" | "mid" | "exp" | "base"
//   export type RouteStop = { country: string; name: string; value: number; band: RouteBand; side: "up" | "down" | "kr"; index: number }
//   export function routeStops(bands: { rows: { country: string; name: string; relative: number }[] }[], perBand = 2): RouteStop[]
//     // 정거장 = 지금 자의 핀(lib/ruler.ts rulerPins: 구간마다 맨 위 perBand 나라 · value = round(relative × 100) · 값 오름차순 · 핀 옆은 위(up) · 아래(down) 번갈아) + 한국(country "KR" · name "한국" · value 100 · band "base" · side "kr")
//     // 한국은 값이 100 보다 작은 정거장들 뒤 · 100 이상인 정거장들 앞 · 나머지 순서는 핀 순서 그대로(값이 같으면 위 → 아래) · index = 순서(0부터)
//     // band: 한국 "base" · 그 밖은 한국 대비(value/100) 가 BAND_EDGE 안: 0.9 미만 "cheap" · 1.1 초과 "exp" · 사이(0.9 · 1.1 포함) "mid" · 나라가 하나도 없으면 [] (한국만 있는 노선을 만들지 않음 · 지어내지 않음)
//   export const ROUTE_STEP_VH = { wide: 36, phone: 30 }      // 정거장 사이 스크롤 길이(화면 높이의 %) · 넓은 화면 36 · 휴대폰 30
//   export function routeFrame(p: number, n: number): { i: number; f: number; m: number }
//     // p = 스크롤 진행 0~1(범위 밖은 자름) · n = 정거장 수(2 이상) · tt = p × (n−1) · i = min(n−2, floor(tt)) · f = tt − i
//     // m = ease(clamp((f − 0.22) / 0.56, 0, 1)) · 앞뒤 22% 는 정거장에 멈춤 · ease(x) = x < 0.5 ? 4x³ : 1 − (−2x + 2)³ / 2
//   export function routeValue(stops: { value: number }[], fr: { i: number; m: number }): number   // 두 정거장 값 사이를 m 만큼
//   export function routeHop(stops: { value: number }[], fr: { i: number; m: number }): number     // 같은 값(111 → 111)은 제자리 뛰기 −sin(π m) × 34 (px) · 값이 다르면 0
//   export function routeActive(prev: number, fr: { i: number; m: number }): number
//     // m ≤ 0.06 → i · m ≥ 0.94 → i+1 · 그 사이는 prev 가 i 나 i+1 이면 prev 유지 · 아니면(처음 · 크게 건너뜀) m < 0.5 ? i : i+1
//   export const isMoving = (m: number) => m > 0.06 && m < 0.94
//   export function routeCardText(stop: { value: number; band: RouteBand }, index: number, n: number): { meta: string; pct: string; budget: string; tiles: string[] }
//     // meta `정거장 ${index+1} / ${n} · ${띠 이름}` 띠 이름: cheap "한국보다 싼 곳" · mid "비슷한 곳" · base "기준" · exp "한국보다 비싼 곳"
//     // pct: 100 → "기준" · 100 보다 작으면 `${100−v}% 쌉니다` · 크면 `${v−100}% 비쌉니다`
//     // budget: 한국에서 하루 100,000원 쓰는 만큼 · 물가 비율로 계산 = `약 ${(v × 1000).toLocaleString("ko-KR")}원` (천 원 단위로 반올림)
//     // tiles: 세 칸 글자판 — 값 글자를 3자리에 맞춰 앞을 비움: 37 → [" ", "3", "7"] · 100 → ["1", "0", "0"]
import { describe, expect, it } from "vitest";
import { ROUTE_STEP_VH, isMoving, routeActive, routeCardText, routeFrame, routeHop, routeStops, routeValue } from "./price-route";

const row = (country: string, name: string, relative: number) => ({ country, name, relative });
// 시안과 같은 값: 인도 37 · 베트남 46 · 헝가리 94 · 멕시코 95 · (한국 100) · 스페인 111 · 아랍에미리트 111
const BANDS = [
  { rows: [row("IN", "인도", 0.37), row("VN", "베트남", 0.46), row("ID", "인도네시아", 0.5)] },
  { rows: [row("HU", "헝가리", 0.94), row("MX", "멕시코", 0.95)] },
  { rows: [row("ES", "스페인", 1.11), row("AE", "아랍에미리트", 1.11), row("CH", "스위스", 1.6)] },
];

describe("routeStops — 핀 + 한국", () => {
  const s = routeStops(BANDS);
  it("구간마다 맨 위 두 나라 + 한국 = 7 · 값 순서 · 한국은 95 뒤 111 앞", () => {
    expect(s.map((x) => x.country)).toEqual(["IN", "VN", "HU", "MX", "KR", "ES", "AE"]);
    expect(s.map((x) => x.value)).toEqual([37, 46, 94, 95, 100, 111, 111]);
    expect(s.map((x) => x.index)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });
  it("한국 정거장", () => {
    expect(s[4]).toMatchObject({ country: "KR", name: "한국", value: 100, band: "base", side: "kr" });
  });
  it("띠 — 90 미만 싼 곳 · 90~110 비슷한 곳 · 110 초과 비싼 곳", () => {
    expect(s.map((x) => x.band)).toEqual(["cheap", "cheap", "mid", "mid", "base", "exp", "exp"]);
  });
  it("핀 옆은 위 · 아래 번갈아(한국 제외) — 시안과 같음", () => {
    expect(s.filter((x) => x.side !== "kr").map((x) => x.side)).toEqual(["up", "down", "up", "down", "up", "down"]);
  });
  it("값 90 · 110 은 비슷한 곳(경계 안) · 91 · 109 도", () => {
    const e = routeStops([{ rows: [row("A", "가", 0.9), row("B", "나", 1.1)] }]);
    expect(e.filter((x) => x.country !== "KR").map((x) => x.band)).toEqual(["mid", "mid"]);
  });
  it("값이 100 인 나라는 한국 뒤에 · 나라가 없으면 []", () => {
    const e = routeStops([{ rows: [row("A", "가", 0.6), row("B", "나", 1.0)] }]);
    expect(e.map((x) => x.country)).toEqual(["A", "KR", "B"]);
    expect(routeStops([])).toEqual([]);
    expect(routeStops([{ rows: [] }])).toEqual([]);
  });
  it("perBand 로 구간마다 뽑는 수를 바꿈", () => {
    expect(routeStops(BANDS, 1).map((x) => x.country)).toEqual(["IN", "HU", "KR", "ES"]);
    expect(routeStops(BANDS, 3).length).toBe(9 + 1 - 1 + 0); // 3+2+3 = 8 나라 + 한국
  });
});

describe("ROUTE_STEP_VH", () => {
  it("넓은 화면 36 · 휴대폰 30", () => expect(ROUTE_STEP_VH).toEqual({ wide: 36, phone: 30 }));
});

describe("routeFrame — 스크롤 진행 → 위치", () => {
  const N = 7;
  it("정거장 위(p = i/(n−1))에서는 멈춤 m = 0", () => {
    for (let i = 0; i < N - 1; i++) expect(routeFrame(i / (N - 1), N)).toMatchObject({ i, m: 0 });
    expect(routeFrame(1, N)).toMatchObject({ i: N - 2, f: 1, m: 1 }); // 끝 = 마지막 구간 끝
  });
  it("앞 22% · 뒤 22% 는 정거장에 멈춤 · 가운데 56% 에서 움직임", () => {
    expect(routeFrame((1 + 0.2) / (N - 1), N).m).toBe(0);
    expect(routeFrame((1 + 0.8) / (N - 1), N).m).toBe(1);
    const mid = routeFrame((1 + 0.5) / (N - 1), N);
    expect(mid.m).toBeCloseTo(0.5, 6);
    expect(mid.i).toBe(1);
    expect(routeFrame((1 + 0.3) / (N - 1), N).m).toBeGreaterThan(0);
    expect(routeFrame((1 + 0.3) / (N - 1), N).m).toBeLessThan(0.5);
  });
  it("범위 밖은 자름 · 단조 증가(되감기지 않음)", () => {
    expect(routeFrame(-1, N)).toMatchObject({ i: 0, m: 0 });
    expect(routeFrame(2, N)).toMatchObject({ i: N - 2, m: 1 });
    let prev = -1;
    for (let k = 0; k <= 200; k++) { const p = k / 200; const fr = routeFrame(p, N); const t = fr.i + fr.m; expect(t).toBeGreaterThanOrEqual(prev - 1e-9); prev = t; }
  });
});

describe("routeValue · routeHop", () => {
  const S = [{ value: 37 }, { value: 46 }, { value: 111 }, { value: 111 }];
  it("두 정거장 값 사이를 m 만큼", () => {
    expect(routeValue(S, { i: 0, m: 0 })).toBe(37);
    expect(routeValue(S, { i: 0, m: 1 })).toBe(46);
    expect(routeValue(S, { i: 0, m: 0.5 })).toBeCloseTo(41.5, 6);
  });
  it("같은 값 구간은 제자리 뛰기(위로 최대 34px) · 값이 다르면 0", () => {
    expect(routeHop(S, { i: 0, m: 0.5 })).toBe(0);
    expect(routeHop(S, { i: 2, m: 0.5 })).toBeCloseTo(-34, 6);
    expect(routeHop(S, { i: 2, m: 0 }) + 0).toBeCloseTo(0, 6);
    expect(routeHop(S, { i: 2, m: 1 })).toBeCloseTo(0, 6);
  });
});

describe("routeActive · isMoving", () => {
  it("멈춘 곳(m ≤ 0.06 · ≥ 0.94)은 그 정거장 · 움직이는 중에는 이전 정거장 유지", () => {
    expect(routeActive(0, { i: 2, m: 0 })).toBe(2);
    expect(routeActive(0, { i: 2, m: 0.06 })).toBe(2);
    expect(routeActive(0, { i: 2, m: 1 })).toBe(3);
    expect(routeActive(0, { i: 2, m: 0.94 })).toBe(3);
    expect(routeActive(2, { i: 2, m: 0.5 })).toBe(2);
    expect(routeActive(3, { i: 2, m: 0.5 })).toBe(3);
  });
  it("크게 건너뛴 경우 · 처음에는 가까운 쪽", () => {
    expect(routeActive(0, { i: 4, m: 0.3 })).toBe(4);
    expect(routeActive(0, { i: 4, m: 0.7 })).toBe(5);
  });
  it("움직이는 중 = 0.06 초과 0.94 미만", () => {
    expect(isMoving(0.06)).toBe(false);
    expect(isMoving(0.07)).toBe(true);
    expect(isMoving(0.93)).toBe(true);
    expect(isMoving(0.94)).toBe(false);
  });
});

describe("routeCardText — 카드 글", () => {
  it("싼 곳(인도 37 · 7개 중 1번째)", () => {
    expect(routeCardText({ value: 37, band: "cheap" }, 0, 7)).toEqual({ meta: "정거장 1 / 7 · 한국보다 싼 곳", pct: "63% 쌉니다", budget: "약 37,000원", tiles: [" ", "3", "7"] });
  });
  it("한국 100 = 기준", () => {
    expect(routeCardText({ value: 100, band: "base" }, 4, 7)).toEqual({ meta: "정거장 5 / 7 · 기준", pct: "기준", budget: "약 100,000원", tiles: ["1", "0", "0"] });
  });
  it("비싼 곳 · 비슷한 곳", () => {
    expect(routeCardText({ value: 111, band: "exp" }, 5, 7)).toEqual({ meta: "정거장 6 / 7 · 한국보다 비싼 곳", pct: "11% 비쌉니다", budget: "약 111,000원", tiles: ["1", "1", "1"] });
    expect(routeCardText({ value: 94, band: "mid" }, 2, 7)).toMatchObject({ meta: "정거장 3 / 7 · 비슷한 곳", pct: "6% 쌉니다", budget: "약 94,000원" });
  });
});
