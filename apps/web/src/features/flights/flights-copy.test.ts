// 작업 0170 — /flights(여행 타이밍) 큰 문장 · 작년 대비 카드 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
// Figma 03 · SR-TRV-01 — 큰 문장은 지수로 계산 · 자료가 없으면 "준비 중" · 카드 숨김 (숫자를 지어내지 않음)
//
// builder 가 만들 것 — apps/web/src/features/flights/flights-copy.ts
//   import type { Signal } from "@hav/shared/signal"; IndexPoint 는 travel-index.ts 것
//   flightsHeadline(airCheap: number | null, tourCheap: number | null): string
//     - 둘 다 있으면 `항공료는 ${a}월, 단체여행은 ${t}월이 싼 편` · 하나만 있으면 `항공료는 ${a}월이 싼 편` / `단체여행은 ${t}월이 싼 편` · 둘 다 없으면 "준비 중"
//     - airCheap · tourCheap 은 travel-index.ts 의 cheapMonth(points) 결과(1~12 또는 null — 자료가 모자라면 null)
//   yoyCard(name: string, points: IndexPoint[] | null | undefined): { label: string; value: string; signal: Signal | null; pinText: string } | null
//     - 자료가 없거나 빈 배열이면 null (카드 숨김) · 있으면 가장 최근 달 기준:
//       label `${name} · ${최근 달 월}월` (Figma 의 "이번 달" 대신 실제 달 — 월 자료는 발표가 늦어 "이번 달" 로 쓰면 틀린 말이 될 수 있음)
//       value 최근 달 지수 소수 첫째 자리 (112.4) · 작년 같은 달 값이 있으면 yoy = (이번 / 작년 − 1) × 100
//       signal = yoy ≥ +1 → "expensive" · yoy ≤ −1 → "cheap" · 그 사이 → "normal" (1% 경계는 가정 — lead 판단)
//       pinText = `작년보다 ${부호 소수 첫째 자리}%` (예 "작년보다 +6.1%" · "작년보다 -2.3%") · 작년 값이 없으면 signal null · pinText "작년 값 없음"
//   cheapMonthsCard(airCheap: number | null, tourCheap: number | null): { label: "가장 저렴한 달 (3년 평균)"; value: string; note: "같은 달 평균 기준" } | null
//     - value = 있는 달만 " · " 로 (`4월 · 11월` · 하나면 `4월`) · 둘 다 없으면 null (카드 숨김)
import { describe, expect, it } from "vitest";
import { cheapMonthsCard, flightsHeadline, yoyCard } from "./flights-copy";

describe("flightsHeadline", () => {
  it("둘 다 → '항공료는 4월, 단체여행은 11월이 싼 편' (Figma 문장)", () => {
    expect(flightsHeadline(4, 11)).toBe("항공료는 4월, 단체여행은 11월이 싼 편");
  });
  it("하나만 있으면 그것만", () => {
    expect(flightsHeadline(4, null)).toBe("항공료는 4월이 싼 편");
    expect(flightsHeadline(null, 11)).toBe("단체여행은 11월이 싼 편");
  });
  it("자료가 없으면 '준비 중' (달을 지어내지 않음)", () => {
    expect(flightsHeadline(null, null)).toBe("준비 중");
  });
});

describe("yoyCard — 작년 대비 카드", () => {
  it("올랐으면 비쌈 — 106.1 vs 100 → +6.1%", () => {
    expect(yoyCard("국제항공료", [{ period: "2025-09", value: 100 }, { period: "2026-09", value: 106.1 }])).toEqual({ label: "국제항공료 · 9월", value: "106.1", signal: "expensive", pinText: "작년보다 +6.1%" });
  });

  it("내렸으면 쌈 — 97.7 vs 100 → -2.3%", () => {
    expect(yoyCard("해외단체여행비", [{ period: "2025-09", value: 100 }, { period: "2026-09", value: 97.7 }])).toEqual({ label: "해외단체여행비 · 9월", value: "97.7", signal: "cheap", pinText: "작년보다 -2.3%" });
  });

  it("±1% 안이면 보통", () => {
    expect(yoyCard("국제항공료", [{ period: "2025-09", value: 100 }, { period: "2026-09", value: 100.4 }])).toMatchObject({ signal: "normal", pinText: "작년보다 +0.4%" });
  });

  it("가장 최근 달을 씀 · 들어온 순서가 섞여도 같음", () => {
    const pts = [{ period: "2026-09", value: 106.1 }, { period: "2025-09", value: 100 }, { period: "2025-08", value: 90 }];
    expect(yoyCard("국제항공료", pts)?.label).toBe("국제항공료 · 9월");
  });

  it("작년 같은 달 값이 없으면 판정 없이 '작년 값 없음'", () => {
    expect(yoyCard("국제항공료", [{ period: "2026-09", value: 106.1 }])).toEqual({ label: "국제항공료 · 9월", value: "106.1", signal: null, pinText: "작년 값 없음" });
  });

  it("자료가 없으면 null (카드 숨김)", () => {
    for (const p of [null, undefined, []]) expect(yoyCard("국제항공료", p), String(p)).toBeNull();
  });
});

describe("cheapMonthsCard — 가장 저렴한 달 (평균에 쓴 해 수는 받은 자료대로)", () => {
  it("'4월 · 11월' + 같은 달 평균 기준", () => {
    expect(cheapMonthsCard(4, 11, 3)).toEqual({ label: "가장 저렴한 달 (최근 3년 평균)", value: "4월 · 11월", note: "같은 달 평균 기준" });
    expect(cheapMonthsCard(4, 11, 2)?.label).toBe("가장 저렴한 달 (최근 2년 평균)"); // 24개월 자료 — 3년이라고 쓰지 않음
    expect(cheapMonthsCard(4, 11)?.label).toBe("가장 저렴한 달 (같은 달 평균)"); // 몇 년인지 모르면 지어내지 않음
  });
  it("하나만 있으면 그 달만 · 둘 다 없으면 null", () => {
    expect(cheapMonthsCard(4, null)?.value).toBe("4월");
    expect(cheapMonthsCard(null, 11)?.value).toBe("11월");
    expect(cheapMonthsCard(null, null)).toBeNull();
  });
});

// 작업 0211 — 항공료 · 단체여행의 싼 달이 같으면 한 번만
describe("싼 달이 같을 때 한 번만 (작업 0211)", () => {
  it("큰 문장 — 같으면 '항공료 · 단체여행 모두 11월이 싼 편' · 다르면 지금 문장 · 하나만이면 그것만", () => {
    expect(flightsHeadline(11, 11)).toBe("항공료 · 단체여행 모두 11월이 싼 편");
    expect(flightsHeadline(4, 11)).toBe("항공료는 4월, 단체여행은 11월이 싼 편");
    expect(flightsHeadline(11, null)).toBe("항공료는 11월이 싼 편");
    expect(flightsHeadline(null, null)).toBe("준비 중");
  });
  it("카드 — 같으면 '11월' 한 번 · 다르면 '4월 · 11월' 그대로", () => {
    expect(cheapMonthsCard(11, 11, 2)?.value).toBe("11월");
    expect(cheapMonthsCard(4, 11, 2)?.value).toBe("4월 · 11월");
  });
});
