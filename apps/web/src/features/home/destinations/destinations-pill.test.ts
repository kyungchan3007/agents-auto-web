// 작업 0228 — 홈 '도착지별 환전 타이밍' 요약 알약 계산 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//
// builder 가 만들 것 — apps/web/src/features/home/common/destinations.ts
//   cheapDestinationCount(rows: { signal: Signal | null }[]): number
//     // 알약 글의 M — 사이트 신호 규칙(하위 30% 이하 = signal "cheap", docs/domain/signal.md SIG-05)으로 센 도착지 수 · 신호 없음은 안 셈 · 숫자를 지어내지 않음
//   pillText(total: number, cheap: number, windowDays?: number): string
//     // `도착지 ${total}곳 중 ${cheap}곳이 최근 ${windowDays}일 중 싼 편` (windowDays 기본 90)
//   SignalRow 에 median?: number | null 추가 — api /signal 목록 줄의 median(최근 windowDays 중간값 · latest.value 와 같은 1 외화당 원 단위, 결정 3fa156a) · DestinationRowData 에 rateStart: number | null
//     // 금액 카운트업 시작 값 = median × 환율 unit (화면 단위로 — 엔은 100엔당) · median 이 없거나(없음 · null · 숫자 아님 · 0 이하) 환율이 없으면 null(= 오늘 값에서 시작 · 카운트업 없음)
import { describe, expect, it } from "vitest";
import { cheapDestinationCount, destinationRows, pillText } from "../common/destinations";

const DEST = [
  { id: "tokyo", name: "도쿄", currency: "JPY", country: "JPN" },
  { id: "newyork", name: "뉴욕", currency: "USD", country: "USA" },
  { id: "paris", name: "파리", currency: "EUR", country: "FRA" },
  { id: "bangkok", name: "방콕", currency: "THB", country: "THA" },
];
const RATES = [
  { currency: "JPY", unit: 100, baseRate: 835.23 },
  { currency: "USD", unit: 1, baseRate: 1331.1 },
  { currency: "EUR", unit: 1, baseRate: 1460.68 },
  { currency: "THB", unit: 1, baseRate: 39.18 },
];
type Sig = "cheap" | "normal" | "expensive" | null;
const sig = (currency: string, signal: Sig, percentile: number | null, median?: number | null) => ({ currency, signal, reason: signal ? "ok" : "data-short", percentile, latest: null, ...(median === undefined ? {} : { median }) });
const rows = (signals: ReturnType<typeof sig>[]) => destinationRows(signals as never, RATES, DEST);

describe("pillText — 알약 한 줄", () => {
  it("'도착지 N곳 중 M곳이 최근 90일 중 싼 편'", () => {
    expect(pillText(4, 2)).toBe("도착지 4곳 중 2곳이 최근 90일 중 싼 편");
    expect(pillText(4, 0)).toBe("도착지 4곳 중 0곳이 최근 90일 중 싼 편");
    expect(pillText(4, 4)).toBe("도착지 4곳 중 4곳이 최근 90일 중 싼 편");
  });
  it("비교 기간은 신호 규칙의 기간(windowDays)", () => {
    expect(pillText(4, 1, 60)).toBe("도착지 4곳 중 1곳이 최근 60일 중 싼 편");
    expect(pillText(3, 1, 90)).toBe("도착지 3곳 중 1곳이 최근 90일 중 싼 편");
  });
});

describe("cheapDestinationCount — M 은 사이트 신호 규칙(하위 30% 이하)", () => {
  it("cheap 만 셈", () => {
    expect(cheapDestinationCount(rows([sig("JPY", "cheap", 0.03), sig("USD", "cheap", 0.1), sig("EUR", "normal", 0.5), sig("THB", "expensive", 0.9)]))).toBe(2);
  });
  it("경계 — 백분위 0.3 은 싼 편(30% 이하) · 0.31 은 보통", () => {
    // 신호 값은 api 가 규칙(cheapAt 0.3)으로 정해 주므로 같은 규칙의 입력으로 확인
    expect(cheapDestinationCount(rows([sig("JPY", "cheap", 0.3), sig("USD", "normal", 0.31), sig("EUR", "normal", 0.5), sig("THB", "normal", 0.7)]))).toBe(1);
  });
  it("신호 없음(null) · 환율 없는 도착지는 안 셈 · 모두 없으면 0", () => {
    expect(cheapDestinationCount(rows([sig("JPY", null, null), sig("USD", null, null), sig("EUR", null, null), sig("THB", null, null)]))).toBe(0);
    expect(cheapDestinationCount([])).toBe(0);
    expect(cheapDestinationCount(rows([sig("JPY", "cheap", 0.1)]))).toBe(1);
  });
  it("전부 싼 편이면 도착지 수와 같음", () => {
    expect(cheapDestinationCount(rows([sig("JPY", "cheap", 0.1), sig("USD", "cheap", 0.2), sig("EUR", "cheap", 0.0), sig("THB", "cheap", 0.3)]))).toBe(4);
  });
});

describe("rateStart — 카운트업 시작 값 = 90일 중간값 (없으면 null)", () => {
  it("중간값(1 외화당 원)을 화면 단위로 — 엔은 ×100 · 나머지는 unit 1 이라 그대로", () => {
    const r = rows([sig("JPY", "cheap", 0.1, 8.405), sig("USD", "normal", 0.5, 1330), sig("EUR", "normal", 0.5, 1460.7), sig("THB", "normal", 0.5, 39.2)]);
    const start = r.map((x) => (x as { rateStart: number | null }).rateStart);
    expect(start[0]).toBeCloseTo(840.5, 6);
    expect(start.slice(1)).toEqual([1330, 1460.7, 39.2]);
  });
  it("없음 · null · 숫자 아님 · 0 이하 · 환율 없음 → null (숫자를 지어내지 않음)", () => {
    const r = destinationRows([sig("JPY", "cheap", 0.1), sig("USD", "normal", 0.5, null), sig("EUR", "normal", 0.5, Number.NaN), sig("THB", "normal", 0.5, 0)] as never, RATES, DEST);
    expect(r.map((x) => (x as { rateStart: number | null }).rateStart)).toEqual([null, null, null, null]);
    const noRate = destinationRows([sig("JPY", "cheap", 0.1, 8.4)] as never, RATES.filter((x) => x.currency !== "JPY"), DEST.slice(0, 1));
    expect((noRate[0] as { rateStart: number | null }).rateStart).toBeNull();
  });
  it("기존 줄 값은 그대로 — rateValue · rateText · position · pinText", () => {
    const r = rows([sig("JPY", "cheap", 0.03, 8.4), sig("USD", "cheap", 0.1), sig("EUR", "normal", 0.5), sig("THB", "expensive", 0.9)]);
    expect(r[0]).toMatchObject({ city: "도쿄", rateText: "835원", rateValue: 835.23, position: 0.03, signal: "cheap" });
    expect(r[3]).toMatchObject({ city: "방콕", rateText: "39.2원", rateDigits: 1 });
  });
});
