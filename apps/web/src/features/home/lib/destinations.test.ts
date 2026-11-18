// 작업 0169 — 홈 "이번 주 가장 싸게 갈 수 있는 곳" · 도착지별 환전 타이밍 줄 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
// 판정 · 눈금은 사이트 신호 규칙 그대로 (lead 결정 2026-11-15) — 최근 90일 백분위 (docs/domain/signal.md SIG-01~05) · Figma 예시의 "1년 평균 대비 %" 가 아님
//
// builder 가 만들 것 — apps/web/src/features/home/lib/destinations.ts
//   export type Destination = { id: string; name: string /* 도시 */; currency?: string; country?: string }   // places.ts 의 DESTINATIONS 와 호환
//   export type SignalRow = { currency: string; signal: "cheap" | "normal" | "expensive" | null; reason: string; percentile: number | null }   // SignalList["signals"] 원소 (latest 는 있어도 됨)
//   export type RateRow = { currency: string; unit: number; baseRate: number }                                                           // FxRate 의 일부
//   cheapestDestination(signals: SignalRow[], rates: RateRow[], destinations: Destination[]): { destination: Destination; rate: RateRow; percentile: number } | null
//     - 신호 · 백분위 · 환율이 모두 있는 도착지 중 백분위가 가장 낮은 곳 · 같으면 destinations 순서가 앞선 곳 · 없으면 null
//   destinationRows(signals, rates, destinations): DestinationRowData[]   // destinations 와 같은 순서 · 개수
//     DestinationRowData = { id; city: string; currency: string | null; flag: string | null; flagLabel: string; currencyLabel: string; rateText: string | null; signal: Signal | null; position: number | null; percentile: number | null; pinText: string | null; note: string | null; href: string | null }
//       city = name · currencyLabel = 통화 짧은 이름(currencyName 에서 끝의 "화" 뗌: 엔화 → 엔) + (환율이 있고 unit > 1 이면 " " + unit) → "엔 100" · "바트" · "유로" · "달러" · 환율이 없으면 이름만(단위를 지어내지 않음)
//       rateText = baseRate 가 100 이상이면 반올림 정수(쉼표) · 100 미만이면 소수 첫째 자리 + "원" → "912원" · "39.8원" · "1,486원" · 환율이 없으면 null
//       signal = 신호 · position = percentile (0 쌈 ~ 1 비쌈 · 눈금 위치) · 신호나 백분위가 없으면 둘 다 null
//       percentile = position 과 같은 값(90일 백분위 0~1) · 없으면 null — 핀 글의 근거 숫자 (작업 0170 추가 요청: 핀에 "하위 12% · 쌈" 처럼 근거 숫자를 보임 · 옛 pct 필드는 없어짐)
//       pinText = signal 이 있으면 pinBasis(signal, percentile) (@hav/ui/data/signal-pin · "하위 12% · 쌈" · "상위 10% · 비쌈" · 규칙은 signal-pin.test.ts) · 신호가 없으면 null
//       note = 신호가 없으면 "신호 없음" · 있으면 null
//       href = 통화가 있으면 `/currencies/${currency}` (줄 전체 링크) · 없으면 null
//   export type CheapestCopy = { headline: string; value: string; per: string; evidence: string }
//   cheapestCopy(c: NonNullable<ReturnType<typeof cheapestDestination>>, windowDays: number): CheapestCopy
//     headline `이번 주 가장 싸게 갈 수 있는 곳은 ${도시}입니다` · value = rateText 와 같은 "912원" · per = `${unit}${짧은 통화 이름}` → "100엔" · "1달러"
//     evidence `최근 ${windowDays}일 중 ${Math.round((1 - percentile) * 100)}%의 날보다 낮습니다` 한 줄뿐 (백분위 0 이면 "최근 N일 중 가장 낮습니다") — 작업 0174: "· 예측이 아닙니다 · 수출입은행 환율을 평일 12시에 받습니다" 는 홈에서 뺌 (예측 아님 안내는 도착지 설명 줄 · 통화 화면에, 출처는 홈 바닥 띠에 있음)
//   export const NO_RATE_COPY = "오늘 환율을 아직 받지 못했습니다"
import { describe, expect, it } from "vitest";
import { NO_RATE_COPY, cheapestCopy, cheapestDestination, destinationRows } from "./destinations";

const DEST = [
  { id: "tokyo", name: "도쿄", currency: "JPY", country: "JPN" },
  { id: "bangkok", name: "방콕", currency: "THB", country: "THA" },
  { id: "paris", name: "파리", currency: "EUR", country: "FRA" },
  { id: "newyork", name: "뉴욕", currency: "USD", country: "USA" },
];
const RATES = [
  { currency: "JPY", unit: 100, baseRate: 912.34 },
  { currency: "THB", unit: 1, baseRate: 39.84 },
  { currency: "EUR", unit: 1, baseRate: 1486.2 },
  { currency: "USD", unit: 1, baseRate: 1382.6 },
];
const sig = (currency: string, signal: "cheap" | "normal" | "expensive" | null, percentile: number | null) => ({ currency, signal, reason: signal ? "ok" : "data-short", percentile });
const SIGNALS = [sig("JPY", "cheap", 0.12), sig("THB", "cheap", 0.25), sig("EUR", "normal", 0.5), sig("USD", "expensive", 0.9)];

describe("cheapestDestination", () => {
  it("백분위가 가장 낮은 도착지 — 도쿄(0.12)", () => {
    const c = cheapestDestination(SIGNALS, RATES, DEST);
    expect(c?.destination.id).toBe("tokyo");
    expect(c?.percentile).toBe(0.12);
    expect(c?.rate).toEqual(RATES[0]);
  });

  it("신호 없는 도착지는 뺌 — 도쿄 신호가 없으면 방콕", () => {
    expect(cheapestDestination([sig("JPY", null, null), ...SIGNALS.slice(1)], RATES, DEST)?.destination.id).toBe("bangkok");
  });

  it("백분위만 있고 신호가 없거나 · 신호만 있고 백분위가 없는 줄도 뺌", () => {
    expect(cheapestDestination([sig("JPY", null, 0.01), sig("THB", "cheap", null), ...SIGNALS.slice(2)], RATES, DEST)?.destination.id).toBe("paris");
  });

  it("환율이 없는 도착지는 뺌 (큰 숫자를 보일 수 없음)", () => {
    expect(cheapestDestination(SIGNALS, RATES.filter((r) => r.currency !== "JPY"), DEST)?.destination.id).toBe("bangkok");
  });

  it("백분위가 같으면 destinations 순서가 앞선 곳", () => {
    const tie = [sig("JPY", "cheap", 0.2), sig("THB", "cheap", 0.2), ...SIGNALS.slice(2)];
    expect(cheapestDestination(tie, RATES, DEST)?.destination.id).toBe("tokyo");
    expect(cheapestDestination(tie, RATES, [DEST[1], DEST[0], ...DEST.slice(2)])?.destination.id).toBe("bangkok");
  });

  it("모두 없으면 null (지어내지 않음)", () => {
    expect(cheapestDestination([], RATES, DEST)).toBeNull();
    expect(cheapestDestination(SIGNALS, [], DEST)).toBeNull();
    expect(cheapestDestination(SIGNALS.map((s) => sig(s.currency, null, null)), RATES, DEST)).toBeNull();
    expect(cheapestDestination(SIGNALS, RATES, [])).toBeNull();
  });
});

describe("destinationRows", () => {
  it("국기는 도착지 나라 국기 (파리 → 프랑스 · 유로라도 EU 아님) · 나라가 없으면 통화 대표 국기 (작업 0199)", () => {
    expect(destinationRows(SIGNALS, RATES, DEST).map((r) => r.flag)).toEqual(["JP", "TH", "FR", "US"]);
    expect(destinationRows(SIGNALS, RATES, [{ id: "x", name: "어딘가", currency: "EUR" }])[0]).toMatchObject({ flag: "EU", flagLabel: "어딘가 국기" });
  });
  it("destinations 와 같은 순서 · 도시 · 통화 · 환율 · 신호 · 눈금 위치 · 링크", () => {
    const rows = destinationRows(SIGNALS, RATES, DEST);
    expect(rows.map((r) => r.id)).toEqual(["tokyo", "bangkok", "paris", "newyork"]);
    expect(rows[0]).toEqual({ id: "tokyo", city: "도쿄", currency: "JPY", flag: "JP", flagLabel: "일본 국기", currencyLabel: "엔 100", rateText: "912원", rateValue: 912.34, rateDigits: 0, signal: "cheap", position: 0.12, percentile: 0.12, pinText: "하위 12% · 쌈", note: null, href: "/currencies/JPY" });
    expect(rows.map((r) => r.currencyLabel)).toEqual(["엔 100", "바트", "유로", "달러"]);
    expect(rows.map((r) => r.rateText)).toEqual(["912원", "39.8원", "1,486원", "1,383원"]);
    expect(rows.map((r) => r.signal)).toEqual(["cheap", "cheap", "normal", "expensive"]);
    expect(rows.map((r) => r.href)).toEqual(["/currencies/JPY", "/currencies/THB", "/currencies/EUR", "/currencies/USD"]);
  });

  it("눈금 위치 = 90일 백분위 그대로 (0 쌈 ~ 1 비쌈) · 백분위도 같은 값으로 따로 (핀 글의 근거 숫자)", () => {
    const rows = destinationRows(SIGNALS, RATES, DEST);
    expect(rows.map((r) => r.position)).toEqual([0.12, 0.25, 0.5, 0.9]);
    expect(rows.map((r) => r.percentile)).toEqual([0.12, 0.25, 0.5, 0.9]);
  });

  it("핀 글에 근거 숫자 — 하위 12% · 쌈 / 하위 25% · 쌈 / 하위 50% · 보통 / 상위 10% · 비쌈 (옛 pct 필드는 없음)", () => {
    const rows = destinationRows(SIGNALS, RATES, DEST);
    expect(rows.map((r) => r.pinText)).toEqual(["하위 12% · 쌈", "하위 25% · 쌈", "하위 50% · 보통", "상위 10% · 비쌈"]);
    for (const r of rows) expect(r).not.toHaveProperty("pct");
  });

  it("신호가 없으면 핀 · 눈금 대신 '신호 없음' (SIG-03)", () => {
    const rows = destinationRows([sig("JPY", null, null), ...SIGNALS.slice(1)], RATES, DEST);
    expect(rows[0]).toMatchObject({ signal: null, position: null, percentile: null, pinText: null, note: "신호 없음", rateText: "912원" });
    expect(rows[1].note).toBeNull();
  });

  it("환율이 없으면 환율 칸 비움 · 통화 이름만(단위를 지어내지 않음) · 링크는 유지", () => {
    const rows = destinationRows(SIGNALS, RATES.filter((r) => r.currency !== "JPY"), DEST);
    expect(rows[0]).toMatchObject({ rateText: null, currencyLabel: "엔", href: "/currencies/JPY" });
  });

  it("통화가 없는 도착지는 링크 없음", () => {
    expect(destinationRows([], [], [{ id: "x", name: "어딘가" }])[0]).toMatchObject({ href: null, rateText: null, signal: null, pinText: null, note: "신호 없음" });
  });
});

describe("cheapestCopy — 이번 주 가장 싸게 갈 수 있는 곳", () => {
  it("도쿄 · 912원 / 100엔 · 근거는 판정 한 줄만 (최근 90일)", () => {
    const c = cheapestDestination(SIGNALS, RATES, DEST);
    if (!c) throw new Error("도쿄가 나와야 함");
    expect(cheapestCopy(c, 90)).toEqual({
      headline: "이번 주 가장 싸게 갈 수 있는 곳은 도쿄입니다",
      value: "912원",
      per: "100엔",
      evidence: "최근 90일 중 88%의 날보다 낮습니다",
    });
  });

  it("단위 1 통화는 '1달러' · 백분위 0 이면 '가장 낮습니다'", () => {
    const c = cheapestDestination([sig("USD", "cheap", 0)], RATES, DEST);
    if (!c) throw new Error("뉴욕이 나와야 함");
    const copy = cheapestCopy(c, 90);
    expect(copy.per).toBe("1달러");
    expect(copy.value).toBe("1,383원");
    expect(copy.evidence).toBe("최근 90일 중 가장 낮습니다");
  });

  it("근거 줄에 '예측이 아닙니다' · '평일 12시' 가 없음 (작업 0174) — 판정 한 줄('최근 90일 중 …')만", () => {
    for (const p of [0, 0.12, 0.5, 0.9]) {
      const c = cheapestDestination([sig("JPY", "cheap", p)], RATES, DEST);
      if (!c) throw new Error("도쿄가 나와야 함");
      const e = cheapestCopy(c, 90).evidence;
      expect(e, String(p)).toMatch(/^최근 90일 중 /);
      expect(e, String(p)).not.toMatch(/예측|평일 12시|수출입은행|·/);
    }
  });

  it("오늘 환율이 없을 때 문구", () => {
    expect(NO_RATE_COPY).toBe("오늘 환율을 아직 받지 못했습니다");
  });
});
