// 작업 0192 — 통화 검색 · 자동완성 계산 (순수 함수 · 테스트 먼저 · 구현 전에는 FAIL 이 정상)
// 사용자: "통화 쪽에 검색기능도 있으면 좋을거 같아 검색기능 넣을때 자동완성 기능도 있으면 좋고"
//
// builder 가 만들 것: packages/shared/src/domain/currency-search.ts
//   export type CurrencyHit = { code: string; matches: { country: string; city?: string }[] }
//   export function searchCurrencies(query: string, codes: string[], limit: number): CurrencyHit[]
//     - 대상: codes(빌드 때 받은 통화 코드) 안의 통화만 · 결과는 통화당 한 줄(같은 통화는 묶음)
//     - 맞는 이유: 코드 · 통화 이름(currencyName) · 나라(TRAVEL_COUNTRIES 이름) · 도시(TRAVEL_CITIES) — 공백 · 대소문자 무시
//     - 순위(작을수록 위 · 한 통화는 맞은 이유 중 가장 좋은 순위): 0 코드 앞글자 > 1 통화 이름 앞글자 > 2 나라 앞글자 > 3 도시 앞글자 > 4 가운데 일치(코드 · 이름 · 나라 · 도시 어디든) · 같은 순위는 codes 순서
//     - matches = 검색어가 들어 있는 나라(→ { country }) · 도시(→ { country, city }) 모음. 코드 · 통화 이름으로만 맞으면 []. 통화가 null 인 나라는 넣지 않음. 같은 항목 중복 없음
//     - 빈 검색어(공백만 포함) → [] · limit = 줄 수 상한(앞에서부터 자름) · codes 에 없는 통화는 나오지 않음 · 표에 없는 코드는 코드 그대로 이름으로 취급(currencyName)
import { describe, expect, it } from "vitest";
import { searchCurrencies } from "./currency-search";
import { TRAVEL_COUNTRIES } from "./travel";

const ALL = ["USD", "JPY", "EUR", "GBP", "AUD", "CAD", "HKD", "SGD", "CHF", "SEK", "NZD", "NOK", "THB"];
const codesOf = (query: string, codes = ALL, limit = 50) => searchCurrencies(query, codes, limit).map((h) => h.code);

describe("무엇으로 찾나", () => {
  it("통화 코드 — 대소문자 · 공백 무시", () => {
    expect(codesOf("usd")).toEqual(["USD"]);
    expect(codesOf("JPY")).toEqual(["JPY"]);
    expect(codesOf("  Gb p ")).toEqual(["GBP"]);
  });

  it("통화 이름 — 달러 · 엔화", () => {
    expect(codesOf("엔화")).toEqual(["JPY"]);
    expect(codesOf("엔")).toEqual(["JPY"]);
    expect(codesOf("바트")).toEqual(["THB"]);
  });

  it("이름의 띄어쓰기는 무시 — '홍콩달러' 와 '홍콩 달러' 모두 HKD", () => {
    expect(codesOf("홍콩달러")).toEqual(["HKD"]);
    expect(codesOf("홍콩 달러")).toEqual(["HKD"]);
  });

  it("나라 — 일본 → JPY · matches 에 나라만", () => {
    expect(searchCurrencies("일본", ALL, 8)).toEqual([{ code: "JPY", matches: [{ country: "일본" }] }]);
  });

  it("도시 — 도쿄 → JPY · matches 에 나라와 맞은 도시", () => {
    expect(searchCurrencies("도쿄", ALL, 8)).toEqual([{ code: "JPY", matches: [{ country: "일본", city: "도쿄" }] }]);
  });

  it("영문 도시 · 검색어 안 공백 — 'la' → 미국 LA · ' 도 쿄 ' → 도쿄", () => {
    expect(searchCurrencies("la", ["USD", "JPY"], 8)).toEqual([{ code: "USD", matches: [{ country: "미국", city: "LA" }] }]);
    expect(codesOf(" 도 쿄 ")).toEqual(["JPY"]);
  });

  it("코드나 통화 이름으로만 맞으면 matches 는 빔", () => {
    expect(searchCurrencies("usd", ALL, 8)).toEqual([{ code: "USD", matches: [] }]);
    expect(searchCurrencies("엔화", ALL, 8)).toEqual([{ code: "JPY", matches: [] }]);
  });

  it("가운데 일치 — '쿄' → 도쿄(JPY)", () => {
    expect(codesOf("쿄")).toEqual(["JPY"]);
  });

  it("환율이 없는 나라(통화 null)는 결과에 없음 — 마카오는 []", () => {
    expect(TRAVEL_COUNTRIES.MAC.currency).toBeNull();
    expect(codesOf("마카오")).toEqual([]);
    expect(codesOf("방콕")).toEqual(["THB"]);
  });

  it("아무것도 안 맞으면 []", () => {
    expect(searchCurrencies("zzzz", ALL, 8)).toEqual([]);
    expect(searchCurrencies("아무데도없음", ALL, 8)).toEqual([]);
  });
});

describe("codes 에 없는 통화는 나오지 않음", () => {
  it("codes 에 JPY 가 없으면 도쿄 · 엔 · 일본 · jpy 모두 []", () => {
    const some = ["USD", "EUR"];
    expect(codesOf("도쿄", some)).toEqual([]);
    expect(codesOf("엔", some)).toEqual([]);
    expect(codesOf("일본", some)).toEqual([]);
    expect(codesOf("jpy", some)).toEqual([]);
  });

  it("codes 가 비면 []", () => {
    expect(searchCurrencies("usd", [], 8)).toEqual([]);
  });

  it("표에 없는 통화 코드도 코드로는 찾음 (통화 목록을 코드에 고정하지 않음)", () => {
    expect(codesOf("zz", ["USD", "ZZZ"])).toEqual(["ZZZ"]);
  });
});

describe("빈 검색어 · limit", () => {
  it("빈 검색어 · 공백만 → []", () => {
    expect(searchCurrencies("", ALL, 8)).toEqual([]);
    expect(searchCurrencies("   ", ALL, 8)).toEqual([]);
  });

  it("limit — 줄 수 상한 · 앞에서부터 자름", () => {
    const all = codesOf("u"); // USD(코드 앞글자) 다음 가운데 일치들
    expect(all.length).toBeGreaterThan(2);
    expect(codesOf("u", ALL, 2)).toEqual(all.slice(0, 2));
    expect(codesOf("u", ALL, 1)).toEqual(all.slice(0, 1));
    expect(searchCurrencies("u", ALL, 0)).toEqual([]);
  });
});

describe("순위", () => {
  it("코드 앞글자가 가운데 일치보다 위 — 'u' 는 USD 먼저, 그 다음 가운데 일치는 codes 순서 (EUR → AUD)", () => {
    expect(codesOf("u", ["EUR", "AUD", "USD"])).toEqual(["USD", "EUR", "AUD"]);
  });

  it("통화 이름 앞글자가 가운데 일치보다 위 — '달러' 는 USD(달러) 먼저, 그 다음 AUD · HKD(… 달러)", () => {
    expect(codesOf("달러", ["AUD", "HKD", "USD"])).toEqual(["USD", "AUD", "HKD"]);
  });

  it("같은 순위(코드 앞글자)는 codes 순서 — 'c' : CHF → CAD", () => {
    expect(codesOf("c", ["CHF", "CAD", "JPY"])).toEqual(["CHF", "CAD"]);
    expect(codesOf("c", ["CAD", "CHF", "JPY"])).toEqual(["CAD", "CHF"]);
  });

  it("통화 이름 앞글자 > 나라 앞글자 — '스' : SEK · CHF(이름 앞글자) 다음 EUR(스페인 나라 앞글자)", () => {
    expect(codesOf("스", ["EUR", "SEK", "CHF"])).toEqual(["SEK", "CHF", "EUR"]);
  });

  it("나라 앞글자 > 도시 앞글자 — '오' : EUR(오스트리아) 다음 JPY · NZD · NOK(오사카 · 오클랜드 · 오슬로) 는 codes 순서", () => {
    expect(codesOf("오", ["JPY", "USD", "EUR", "NZD", "NOK"])).toEqual(["EUR", "JPY", "NZD", "NOK"]);
  });

  it("codes 순서를 바꾸면 같은 순위끼리의 순서도 바뀜", () => {
    expect(codesOf("오", ["NOK", "NZD", "EUR", "JPY"])).toEqual(["EUR", "NOK", "NZD", "JPY"]);
  });
});

describe("같은 통화는 한 줄로 묶음 (EUR)", () => {
  it("'프' → EUR 한 줄 · matches 에 프랑스(나라) · 독일 프랑크푸르트(도시) · 맞지 않은 독일 나라는 없음", () => {
    const r = searchCurrencies("프", ["EUR"], 8);
    expect(r).toHaveLength(1);
    expect(r[0].code).toBe("EUR");
    expect(r[0].matches).toContainEqual({ country: "프랑스" });
    expect(r[0].matches).toContainEqual({ country: "독일", city: "프랑크푸르트" });
    expect(r[0].matches).not.toContainEqual({ country: "독일" });
  });

  it("'독일' → EUR 한 줄 · 독일만", () => {
    expect(searchCurrencies("독일", ["EUR", "USD"], 8)).toEqual([{ code: "EUR", matches: [{ country: "독일" }] }]);
  });

  it("'리' 처럼 여러 곳이 맞아도 EUR 는 한 줄", () => {
    expect(searchCurrencies("리", ALL, 50).filter((h) => h.code === "EUR")).toHaveLength(1);
  });

  it("같은 matches 항목이 두 번 나오지 않음", () => {
    for (const q of ["프", "리", "스", "오", "아", "도"]) {
      for (const h of searchCurrencies(q, ALL, 50)) {
        const keys = h.matches.map((m) => `${m.country}|${m.city ?? ""}`);
        expect(new Set(keys).size, `${q} ${h.code}`).toBe(keys.length);
      }
    }
  });

  it("USD — '하와이' → USD · 미국 하와이", () => {
    expect(searchCurrencies("하와이", ALL, 8)).toEqual([{ code: "USD", matches: [{ country: "미국", city: "하와이" }] }]);
  });
});
