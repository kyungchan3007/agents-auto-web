// 작업 0185 — 홈 안내판이 인트로에서 고른 나라를 보여 주는 글 (순수 함수 · 테스트 먼저 · 구현 전에는 FAIL 이 정상)
// 사용자 "인트로에서 유저가 입력한 나라가 실제 홈에 이번주 가장싸게 갈수있는곳 판넬에 들어가면 좋을거 같아" · prd: 제목 "내가 고른 여행지 · 오늘 환율" · 아래 줄 "{통화} · 최근 90일 중 …" · 인트로를 안 했으면 지금 그대로
//
// builder 가 만들 것 — apps/web/src/features/home/lib/picked.ts  (React 없음 · 인트로 폴더를 가져오지 않음 — 고른 값 모양은 @hav/shared/travel 의 PickedTrip)
//   export const PICKED_TITLE = "내가 고른 여행지 · 오늘 환율"
//   export function pickedBoard(a: { picked: PickedTrip | null; rates: RateRow[]; signals: SignalRow[]; windowDays: number }): { title: string; rows: [BoardRow, BoardRow]; label: string; evidence: string } | null
//     - picked 가 null · 모르는 나라면 null (홈은 지금 안내판 그대로 · 지어내지 않음)
//     - rows[0] = { text: `ICN → ${도시}`, tone: "dest" } · rows[1] = { text: `${wonText} / ${단위}${통화 짧은 이름}`, tone: "money" } (홈 안내판 형식 그대로: "1,486원 / 1유로")
//     - label = `내가 고른 여행지는 ${도시}입니다. ${rows[1].text}` (판 전체를 한 문장으로)
//     - evidence = `${통화 이름} · 최근 ${windowDays}일 중 ${낮은 편|보통|높은 편}` · 신호가 없으면 `${통화 이름} · 최근 ${windowDays}일 판정을 아직 내지 못했습니다`
//     - 환율이 없는 나라(통화 없음 · 오늘 환율에 없음): rows[1].text "환율 없음" · evidence `${나라} 돈은 한국수출입은행 고시 환율에 없어 계산하지 못했습니다`
//   export function pickedChip(p: PickedTrip): string   // `✈ ICN → ${도시} · 탑승권 보기`
import { currencyName } from "@hav/shared/currency";
import type { PickedTrip } from "@hav/shared/travel";
import { describe, expect, it } from "vitest";
import type { SignalRow } from "./destinations";
import { PICKED_TITLE, pickedBoard, pickedChip } from "./picked";

const RATES = [
  { currency: "JPY", unit: 100, baseRate: 834.37 },
  { currency: "THB", unit: 1, baseRate: 39.84 },
  { currency: "EUR", unit: 1, baseRate: 1486.2 },
];
const sig = (currency: string, signal: SignalRow["signal"], percentile: number | null): SignalRow => ({ currency, signal, reason: signal ? "ok" : "data-short", percentile });
const SIGNALS = [sig("JPY", "cheap", 0.1), sig("THB", "expensive", 0.9), sig("EUR", "normal", 0.5)];
const trip = (country: string, city: string): PickedTrip => ({ v: 1, country, city, budget: 1_000_000 });
const board = (p: PickedTrip | null, signals = SIGNALS) => pickedBoard({ picked: p, rates: RATES, signals, windowDays: 90 });
const short = (code: string) => currencyName(code).replace(/화$/, "");

describe("pickedBoard — 홈 안내판 (내가 고른 여행지)", () => {
  it("제목 상수", () => {
    expect(PICKED_TITLE).toBe("내가 고른 여행지 · 오늘 환율");
  });

  it("파리 — 'ICN → 파리' 흰 글자 · '1,486원 / 1유로' 노랑 · 제목 · 판 전체 한 문장 · 아래 줄", () => {
    const b = board(trip("FRA", "파리"))!;
    expect(b.title).toBe(PICKED_TITLE);
    expect(b.rows).toEqual([{ text: "ICN → 파리", tone: "dest" }, { text: `1,486원 / 1${short("EUR")}`, tone: "money" }]);
    expect(b.label).toBe(`내가 고른 여행지는 파리입니다. 1,486원 / 1${short("EUR")}`);
    expect(b.evidence).toBe(`${currencyName("EUR")} · 최근 90일 중 보통`);
  });

  it("단위 100(엔) · 소수(바트) 표시는 홈 안내판과 같은 규칙", () => {
    expect(board(trip("JPN", "도쿄"))!.rows[1].text).toBe(`834원 / 100${short("JPY")}`);
    expect(board(trip("THA", "방콕"))!.rows[1].text).toBe(`39.8원 / 1${short("THB")}`);
  });

  it("신호 말 — 낮은 편 · 보통 · 높은 편 (최근 N일 은 windowDays)", () => {
    expect(board(trip("JPN", "도쿄"))!.evidence).toBe(`${currencyName("JPY")} · 최근 90일 중 낮은 편`);
    expect(board(trip("THA", "방콕"))!.evidence).toBe(`${currencyName("THB")} · 최근 90일 중 높은 편`);
    expect(pickedBoard({ picked: trip("JPN", "도쿄"), rates: RATES, signals: SIGNALS, windowDays: 30 })!.evidence).toContain("최근 30일 중");
  });

  it("신호가 없으면 '판정을 아직 내지 못했습니다' (판단을 지어내지 않음)", () => {
    expect(board(trip("JPN", "도쿄"), [])!.evidence).toBe(`${currencyName("JPY")} · 최근 90일 판정을 아직 내지 못했습니다`);
    expect(board(trip("JPN", "도쿄"), [sig("JPY", null, null)])!.evidence).toBe(`${currencyName("JPY")} · 최근 90일 판정을 아직 내지 못했습니다`);
  });

  it("환율이 없는 나라(대만 · 마카오)는 '환율 없음' · 계산하지 못했다는 줄", () => {
    const tw = board(trip("TWN", "타이베이"))!;
    expect(tw.rows).toEqual([{ text: "ICN → 타이베이", tone: "dest" }, { text: "환율 없음", tone: "money" }]);
    expect(tw.evidence).toBe("대만 돈은 한국수출입은행 고시 환율에 없어 계산하지 못했습니다");
    expect(board(trip("MAC", "마카오"))!.evidence).toBe("마카오 돈은 한국수출입은행 고시 환율에 없어 계산하지 못했습니다");
  });

  it("인트로를 안 했으면(null) · 모르는 나라면 null — 홈은 지금 안내판 그대로", () => {
    expect(board(null)).toBeNull();
    expect(board({ v: 1, country: "ZZZ", city: "어딘가", budget: 0 })).toBeNull();
  });
});

describe("pickedChip — 홈 왼쪽 아래 '탑승권 보기'", () => {
  it("✈ ICN → 파리 · 탑승권 보기", () => {
    expect(pickedChip(trip("FRA", "파리"))).toBe("✈ ICN → 파리 · 탑승권 보기");
  });
});
