// 작업 0177 — 홈 첫 화면 출발 안내판의 글 (순수 함수 · 테스트 먼저 · 구현 전에는 FAIL 이 정상)
// 자료는 지금 today-band 가 쓰던 값 그대로(cheapestDestination · cheapestCopy) — 1줄 "ICN → 도시" · 2줄 "{금액} / {단위}" · 없으면 "----" · 지어내지 않음 (B3 · B4 · B7)
//
// builder 가 만들 것 — apps/web/src/features/home/lib/today-board.ts
//   export const BOARD_TITLE = "이번 주 가장 싸게 갈 수 있는 곳"      // 판 위 작은 제목
//   export const ORIGIN_CODE = "ICN"
//   export type BoardRow = { text: string | null; tone: "dest" | "money" }    // text null = 값 없음(판에 "----")
//   export function todayBoard(a: { found: ReturnType<typeof cheapestDestination>; hasRates: boolean; windowDays: number; problem?: string | null }): { title: string; rows: [BoardRow, BoardRow]; label: string; evidence: string }
//     - 값이 있을 때(found): rows[0] = { text: `ICN → ${도시}`, tone: "dest" } · rows[1] = { text: `${cheapestCopy.value} / ${cheapestCopy.per}`, tone: "money" }
//       label = 판 전체를 한 문장으로 읽는 글 = `${cheapestCopy.headline}. ${value} / ${per}` · evidence = cheapestCopy.evidence (아래 판정 한 줄 — 지금 문구 그대로)
//     - 환율이 아직 없으면(hasRates false): rows 둘 다 text null · label = NO_RATE_COPY · evidence = problem ?? "환율이 아직 수집되지 않았습니다"
//     - 환율은 있는데 도착지 신호가 없으면(found null): rows 둘 다 text null · label "이번 주 가장 싼 곳을 판단할 신호가 아직 없습니다" · evidence `최근 ${windowDays}일 자료가 모자라 도착지 신호를 내지 못했습니다`
//     - title 은 항상 BOARD_TITLE · rows 는 항상 두 줄(1줄 dest · 2줄 money)
import { describe, expect, it } from "vitest";
import { NO_RATE_COPY, cheapestDestination } from "./destinations";
import { BOARD_TITLE, ORIGIN_CODE, todayBoard } from "./today-board";

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

describe("todayBoard — 값이 있을 때", () => {
  const b = todayBoard({ found: cheapestDestination(SIGNALS, RATES, DEST), hasRates: true, windowDays: 90 });

  it("제목 · 두 줄 — 'ICN → 도쿄' 흰 글자(dest) · '912원 / 100엔' 햇빛 노랑(money)", () => {
    expect(BOARD_TITLE).toBe("이번 주 가장 싸게 갈 수 있는 곳");
    expect(ORIGIN_CODE).toBe("ICN");
    expect(b.title).toBe(BOARD_TITLE);
    expect(b.rows).toEqual([{ text: "ICN → 도쿄", tone: "dest" }, { text: "912원 / 100엔", tone: "money" }]);
  });

  it("판 전체를 한 문장으로 — 도착지 문장 + 금액", () => {
    expect(b.label).toBe("이번 주 가장 싸게 갈 수 있는 곳은 도쿄입니다. 912원 / 100엔");
  });

  it("아래 판정 한 줄은 지금 문구 그대로 ('최근 90일 중 …')", () => {
    expect(b.evidence).toBe("최근 90일 중 88%의 날보다 낮습니다");
  });

  it("단위 1 통화(뉴욕)도 같은 형식 — '1달러'", () => {
    const usd = todayBoard({ found: cheapestDestination([sig("USD", "cheap", 0.05)], RATES, DEST), hasRates: true, windowDays: 90 });
    expect(usd.rows[0].text).toBe("ICN → 뉴욕");
    expect(usd.rows[1].text).toBe("1,383원 / 1달러");
  });
});

describe("todayBoard — 값이 없을 때 (지어내지 않음 · 빈 칸 '----')", () => {
  it("환율이 아직 없으면 두 줄 모두 값 없음 · 문구는 '오늘 환율을 아직 받지 못했습니다' · 이유(problem)를 아래 줄에", () => {
    const b = todayBoard({ found: null, hasRates: false, windowDays: 90, problem: "연결 실패" });
    expect(b.rows).toEqual([{ text: null, tone: "dest" }, { text: null, tone: "money" }]);
    expect(b.label).toBe(NO_RATE_COPY);
    expect(b.evidence).toBe("연결 실패");
    expect(b.title).toBe(BOARD_TITLE);
  });

  it("이유를 모르면 '환율이 아직 수집되지 않았습니다'", () => {
    expect(todayBoard({ found: null, hasRates: false, windowDays: 90 }).evidence).toBe("환율이 아직 수집되지 않았습니다");
  });

  it("환율은 있는데 신호가 없으면 — 값 없음 · '판단할 신호가 아직 없습니다' · 자료가 모자라 신호를 내지 못했습니다", () => {
    const b = todayBoard({ found: cheapestDestination([], RATES, DEST), hasRates: true, windowDays: 90 });
    expect(b.rows).toEqual([{ text: null, tone: "dest" }, { text: null, tone: "money" }]);
    expect(b.label).toBe("이번 주 가장 싼 곳을 판단할 신호가 아직 없습니다");
    expect(b.evidence).toBe("최근 90일 자료가 모자라 도착지 신호를 내지 못했습니다");
  });
});

// 작업 0209 — 안 고른 상태의 머리 사진은 안내판 기본 도착지 나라 (서버 HTML 에서 바로)
import { boardCountry } from "./today-board";

describe("boardCountry — 안내판 도착지의 나라 (작업 0209)", () => {
  it("안내판에 도착지가 있으면 그 나라 코드 · 없으면 null (지금 사진)", () => {
    const found = cheapestDestination([{ currency: "EUR", signal: "cheap", percentile: 0.1 } as never], RATES, DEST);
    expect(boardCountry(found)).toBe(found?.destination.country ?? null);
    expect(boardCountry(null)).toBeNull();
    expect(boardCountry({ destination: { id: "x", name: "어딘가" }, rate: RATES[0], percentile: 0.1 } as never)).toBeNull();
  });
});
