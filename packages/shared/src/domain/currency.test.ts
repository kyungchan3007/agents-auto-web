import { describe, expect, it } from "vitest";
import { CURRENCIES, RATE_SOURCE_LABEL, SOURCE_NOTE, USD_PEGGED, currencyFlag, currencyName, currencySymbol, groupByRegion, headline, matchCurrency, pegText, percentileText, rangeOf, rateText, sampleText, toUnit } from "./currency";

// 배포한 API 가 2026-10-28 에 준 22개
const LIVE = ["AED", "AUD", "BHD", "BND", "CAD", "CHF", "CNH", "DKK", "EUR", "GBP", "HKD", "IDR", "JPY", "KWD", "MYR", "NOK", "NZD", "SAR", "SEK", "SGD", "THB", "USD"].map((currency) => ({ currency }));

describe("지역별 그룹", () => {
  it("받은 22개가 모두 정확히 한 그룹에 · 기타 없음", () => {
    const groups = groupByRegion(LIVE);
    expect(groups.flatMap((g) => g.items).length).toBe(22);
    expect(groups.map((g) => g.region)).toEqual(["asia", "americas", "europe", "mideast", "oceania"]);
    expect(LIVE.every((c) => CURRENCIES[c.currency])).toBe(true);
  });

  it("표에 없는 통화는 버리지 않고 기타로 (FX-03)", () => {
    const groups = groupByRegion([...LIVE, { currency: "XYZ" }]);
    expect(groups.at(-1)).toMatchObject({ region: "other", label: "기타", items: [{ currency: "XYZ" }] });
  });

  it("지역 안에서는 많이 쓰는 통화부터 (알파벳순 아님) — 아시아는 엔 → 위안 · 유럽은 유로 → 파운드", () => {
    const groups = groupByRegion(LIVE);
    expect(groups[0].items.slice(0, 2).map((i) => i.currency)).toEqual(["JPY", "CNH"]);
    expect(groups.find((g) => g.region === "europe")!.items.slice(0, 2).map((i) => i.currency)).toEqual(["EUR", "GBP"]);
  });

  it("빈 지역은 탭이 없음", () => {
    expect(groupByRegion([{ currency: "USD" }]).map((g) => g.region)).toEqual(["americas"]);
  });
});

describe("국기", () => {
  it("유로는 EU · 모르는 통화는 국기 없음", () => {
    expect(currencyFlag("EUR")).toBe("EU");
    expect(currencyFlag("XYZ")).toBeNull();
  });
});

describe("첫 화면 문장 — 예측 문구 없음 (SIG-01)", () => {
  it("신호마다 문장 · 받침에 맞춘 조사", () => {
    expect(headline("USD", "cheap")).toBe("오늘, 달러는 싼 편입니다.");
    expect(headline("JPY", "expensive")).toBe("오늘, 엔화는 비싼 편입니다.");
    expect(headline("VND", "normal")).toBe("오늘, 동은 평소 수준입니다.");
    expect(headline("USD", null)).toBe("오늘, 달러는 판단할 자료가 모자랍니다.");
  });

  it("오른다 · 내린다 같은 예측 말이 없다", () => {
    for (const s of ["cheap", "normal", "expensive", null] as const) {
      expect(headline("USD", s)).not.toMatch(/오를|내릴|오른다|내린다|전망|예상/);
    }
  });
});

describe("백분위 설명 (SIG-02)", () => {
  it("싼 편 0.02 → 98%의 날보다 낮음 · 비싼 편 0.9 → 90%의 날보다 높음", () => {
    expect(percentileText("cheap", 0.02, 90)).toBe("최근 90일 중 98%의 날보다 낮음");
    expect(percentileText("expensive", 0.9, 90)).toBe("최근 90일 중 90%의 날보다 높음");
    expect(percentileText("normal", 0.5, 90)).toBe("최근 90일 중간 수준");
    expect(percentileText(null, null, 90)).toMatch(/모자라/);
  });

  it("맨 끝은 \"100%의 날보다\" 대신 가장 낮음 · 가장 높음 (화면에서 어색해서 바꿈)", () => {
    expect(percentileText("cheap", 0, 90)).toBe("최근 90일 중 가장 낮음");
    expect(percentileText("expensive", 1, 90)).toBe("최근 90일 중 가장 높음");
  });
});

describe("환율 표시 (FX-04)", () => {
  it("엔은 100 단위를 붙여 그대로", () => {
    expect(rateText({ baseRate: 838.3, unit: 100 })).toEqual({ value: "838.3", unit: "원 / 100" });
    expect(rateText({ baseRate: 1324.3, unit: 1 })).toEqual({ value: "1,324.3", unit: "원" });
    expect(rateText({ baseRate: 5.12, unit: 1 })).toEqual({ value: "5.12", unit: "원" });
    // 작업 0287(정정): 1,000원 이상은 소수 첫째 자리까지 · 1,000원 미만은 둘째 자리 · 끝자리 0 은 쓰지 않음
    expect(rateText({ baseRate: 1459.62, unit: 1 }).value).toBe("1,459.6");
    expect(rateText({ baseRate: 1330.8, unit: 1 }).value).toBe("1,330.8");
    expect(rateText({ baseRate: 1331.0, unit: 1 }).value).toBe("1,331");
    expect(rateText({ baseRate: 833.73, unit: 100 }).value).toBe("833.73");
    expect(rateText({ baseRate: 7.3, unit: 1 }).value).toBe("7.3");
    expect(rateText({ baseRate: 999.99, unit: 1 }).value).toBe("999.99");
  });
});

describe("통화 둘러보기 (작업 0058)", () => {
  const days = [
    { date: "2026-01-02", baseRate: 1400 },
    { date: "2026-01-01", baseRate: 1450 },
    { date: "2026-01-03", baseRate: 1380 },
    { date: "2026-01-04", baseRate: 1380 },
  ];

  it("최저 · 최고 · 처음 · 마지막 — 날짜순으로 정렬해서 · 같은 최저면 앞 날짜", () => {
    expect(rangeOf(days)).toEqual({
      min: { date: "2026-01-03", baseRate: 1380 },
      max: { date: "2026-01-01", baseRate: 1450 },
      first: { date: "2026-01-01", baseRate: 1450 },
      last: { date: "2026-01-04", baseRate: 1380 },
      count: 4,
    });
  });

  it("기록이 없으면 null — 숫자를 만들지 않음 (FX-02)", () => {
    expect(rangeOf([])).toBeNull();
  });

  it("환산 예시 — 달러 100 · 엔은 100 단위라 1,000엔", () => {
    expect(sampleText("USD", { baseRate: 1324.3, unit: 1 })).toBe("100 USD → 132,430원");
    expect(sampleText("JPY", { baseRate: 838.3, unit: 100 })).toBe("1,000 JPY → 8,383원");
  });

  it("찾기 — 코드 · 한국어 이름 · 띄어쓰기 무시", () => {
    expect(matchCurrency("USD", "usd")).toBe(true);
    expect(matchCurrency("HKD", "홍콩달러")).toBe(true);
    expect(matchCurrency("JPY", "엔")).toBe(true);
    expect(matchCurrency("JPY", "유로")).toBe(false);
    expect(matchCurrency("EUR", " ")).toBe(true);
  });

  it("동전 기호 — 모르면 코드", () => {
    expect(currencySymbol("EUR")).toBe("€");
    expect(currencySymbol("KWD")).toBe("KWD");
  });

  it("단위 맞춤 — 엔 1 단위로 온 날(예비 출처)을 100 단위로 · 같은 단위는 그대로", () => {
    const rows = [
      { date: "2026-04-03", baseRate: 952.11, unit: 100 },
      { date: "2026-04-06", baseRate: 9.4724, unit: 1 },
    ];
    expect(toUnit(rows, 100).map((r) => [r.baseRate, r.unit])).toEqual([
      [952.11, 100],
      [947.24, 100],
    ]);
    expect(toUnit(rows, 100)[0]).toBe(rows[0]);
  });
});

// 작업 0289 — 미국 달러에 고정된 통화(중앙은행이 공식으로 단일 고정 환율을 밝힌 곳만: docs/domain/fx.md)
describe("달러에 고정된 통화 · 셋째 줄 (작업 0289)", () => {
  it("SAR · AED · BHD 만 — 홍콩 달러(범위 연동) · 쿠웨이트 디나르 등은 없음", () => {
    expect([...USD_PEGGED].sort()).toEqual(["AED", "BHD", "SAR"]);
    for (const c of ["USD", "JPY", "EUR", "HKD", "KWD", "CNH", "BND", "DKK"]) expect(pegText(c), c).toBeNull();
  });
  it("문장: '(통화 이름)은(는) 미국 달러에 고정된 통화라 달러와 같이 움직입니다' — 받침에 따라 은 · 는", () => {
    for (const c of ["SAR", "AED", "BHD"]) {
      const t = pegText(c) ?? "";
      expect(t, c).toMatch(/^.+(은|는) 미국 달러에 고정된 통화라 달러와 같이 움직입니다$/);
      expect(t.startsWith(currencyName(c)), c).toBe(true);
      const last = currencyName(c).charCodeAt(currencyName(c).length - 1);
      expect(t.slice(currencyName(c).length, currencyName(c).length + 1), c).toBe((last - 0xac00) % 28 !== 0 ? "은" : "는");
    }
  });
});

// 작업 0299 — 바닥 띠 환율 출처 문구는 공용 상수 하나(다섯 페이지가 같이 씀) · 수출입은행 값을 받지 못한 날은 Frankfurter 값을 씀(docs/domain/fx.md)
describe("환율 출처 문구 (작업 0299)", () => {
  it("RATE_SOURCE_LABEL = '한국수출입은행 · Frankfurter(수출입은행 값을 받지 못한 날)' · SOURCE_NOTE 는 그 앞에 '환율: ' 만 붙임", () => {
    expect(RATE_SOURCE_LABEL).toBe("한국수출입은행 · Frankfurter(수출입은행 값을 받지 못한 날)");
    expect(SOURCE_NOTE).toBe(`환율: ${RATE_SOURCE_LABEL}`);
    expect(SOURCE_NOTE, "옛 괄호 표기는 없음").not.toContain("(예비:");
  });
});
