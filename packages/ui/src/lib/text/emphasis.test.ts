// 작업 0175 세 번째 묶음 — 제목 속 숫자 · 금액 강조: 문장을 [글 · 숫자] 조각으로 (순수 함수 · 테스트 먼저 · 구현 전에는 FAIL 이 정상)
// 사용자 "타이틀이나 이런 데 보면 수치나 달러 표시는 조금 강조하기 위해서 색깔을 조금 바꾸자" · "여행 물가 63% 이거는 강조를 좀 해야 할 것 같아"
//
// builder 가 만들 것 — packages/ui/src/lib/text/emphasis.ts
//   export type Piece = { text: string; num: boolean }
//   export function splitNumbers(sentence: string): Piece[]
//     - 숫자 · 퍼센트 · 통화 기호 · 단위를 한 덩어리(num: true)로: 앞에 부호(+ -)나 통화 기호($ ¥ € £ ฿ ₫)가 바로 붙고, 숫자는 쉼표 · 소수점 허용, 뒤에 단위(% 원 엔 달러 월 일 년)가 바로 붙으면 함께
//     - 조사는 덩어리에 넣지 않음 ("63%의" → "63%" + "의" · "4월에" → "4월" + "에" · "원이" → "원" + "이")
//     - 숫자 사이의 글(" / " 등)은 num: false · 숫자 없는 문장은 한 조각 · 빈 글은 [] · 이어 붙이면 원래 문장과 같음(손실 없음) · 이웃한 같은 종류 조각은 합쳐서 돌려줌
//   export function numberTone(sentence: string): "neutral" | "expensive"
//     - 비싼 쪽을 뜻하는 문장이면 "expensive" (높습니다 · 비쌉니다 · 비싼 · 올랐습니다 · 붙습니다) · 싼 쪽 · 중립 말(낮습니다 · 싼 · 싸 · 내렸습니다 · 없이)이 함께 있으면 "neutral" · 그 밖은 "neutral"
import { describe, expect, it } from "vitest";
import { numberTone, parseCount, splitNumbers } from "./emphasis";

const t = (s: string) => splitNumbers(s).map((p) => [p.text, p.num]);

describe("splitNumbers — 숫자 · 퍼센트 · 통화 기호 · 단위 한 덩어리", () => {
  it("퍼센트 — '63%' (여행 물가 큰 문장)", () => {
    expect(t("인도는 한국보다 물가가 63% 낮습니다")).toEqual([["인도는 한국보다 물가가 ", false], ["63%", true], [" 낮습니다", false]]);
  });

  it("통화 기호 — '$180' (직구 큰 문장) · '¥20,000'", () => {
    expect(t("$180 물건, 세금 없이 받습니다")).toEqual([["$180", true], [" 물건, 세금 없이 받습니다", false]]);
    expect(t("¥20,000 물건, 세금 없이 받습니다")).toEqual([["¥20,000", true], [" 물건, 세금 없이 받습니다", false]]);
  });

  it("쉼표 · 소수점 · 단위 — '1,332원' · '1,554.4원' · '1달러'", () => {
    expect(t("1,332원")).toEqual([["1,332원", true]]);
    expect(t("최고 1,554.4원")).toEqual([["최고 ", false], ["1,554.4원", true]]);
    expect(t("1달러")).toEqual([["1달러", true]]);
  });

  it("'833원 / 100엔' 은 '833원' · '100엔' 각각", () => {
    expect(t("833원 / 100엔")).toEqual([["833원", true], [" / ", false], ["100엔", true]]);
  });

  it("월 · 조사는 덩어리 밖 — '4월에' → '4월' + '에' · '11월이' → '11월' + '이'", () => {
    expect(t("4월에 떠나세요")).toEqual([["4월", true], ["에 떠나세요", false]]);
    expect(t("항공료는 4월, 단체여행은 11월이 싼 편")).toEqual([["항공료는 ", false], ["4월", true], [", 단체여행은 ", false], ["11월", true], ["이 싼 편", false]]);
  });

  it("부호 — '+2.3%' · '-4.1%' 는 부호까지 한 덩어리", () => {
    expect(t("작년보다 +2.3% 올랐습니다")).toEqual([["작년보다 ", false], ["+2.3%", true], [" 올랐습니다", false]]);
    expect(t("작년보다 -4.1% 내렸습니다")).toEqual([["작년보다 ", false], ["-4.1%", true], [" 내렸습니다", false]]);
  });

  it("금액 뒤 조사 — '50,760원이' → '50,760원' + '이' · 일 · 퍼센트 조사 '88%의'", () => {
    expect(t("관세 · 부가세 약 50,760원이 붙습니다")).toEqual([["관세 · 부가세 약 ", false], ["50,760원", true], ["이 붙습니다", false]]);
    expect(t("최근 90일 중 88%의 날보다 낮습니다")).toEqual([["최근 ", false], ["90일", true], [" 중 ", false], ["88%", true], ["의 날보다 낮습니다", false]]);
  });

  it("숫자 없는 문장은 그대로 한 조각 · 빈 글은 []", () => {
    expect(t("물건 값을 넣어 보세요")).toEqual([["물건 값을 넣어 보세요", false]]);
    expect(t("국제항공료 지수를 아직 받지 못했습니다")).toEqual([["국제항공료 지수를 아직 받지 못했습니다", false]]);
    expect(splitNumbers("")).toEqual([]);
  });

  it("손실 없음 — 이어 붙이면 원래 문장 · 이웃한 같은 종류 조각은 합쳐짐", () => {
    for (const s of ["인도는 한국보다 물가가 63% 낮습니다", "$180 물건, 세금 없이 받습니다", "833원 / 100엔", "항공료는 4월, 단체여행은 11월이 싼 편", "1,332원", "", "숫자 없음", "2026년 11월 15일"]) {
      const pieces = splitNumbers(s);
      expect(pieces.map((p) => p.text).join(""), s).toBe(s);
      for (let i = 1; i < pieces.length; i++) expect(pieces[i].num !== pieces[i - 1].num, `${s} 이웃 조각`).toBe(true);
    }
  });
});

describe("numberTone — 비싼 쪽을 뜻하는 문장", () => {
  it("낮습니다 · 싼 편 · 세금 없이 → neutral", () => {
    expect(numberTone("인도는 한국보다 물가가 63% 낮습니다")).toBe("neutral");
    expect(numberTone("항공료는 4월, 단체여행은 11월이 싼 편")).toBe("neutral");
    expect(numberTone("$180 물건, 세금 없이 받습니다")).toBe("neutral");
    expect(numberTone("4월에 떠나세요")).toBe("neutral");
    expect(numberTone("작년보다 -2.3% 내렸습니다")).toBe("neutral");
    expect(numberTone("항공료는 11월이 가장 저렴합니다")).toBe("neutral"); // 작업 0276: '저렴'도 싼 쪽 낱말 — 강조 색이 사라지지 않음
    expect(numberTone("가장 저렴한 달은 11월, 가장 비싼 달은 5월")).toBe("neutral");
  });

  it("높습니다 · 올랐습니다 · 세금이 붙습니다 → expensive (주홍)", () => {
    expect(numberTone("미국은 한국보다 물가가 31% 높습니다")).toBe("expensive");
    expect(numberTone("작년보다 +6.1% 올랐습니다")).toBe("expensive");
    expect(numberTone("관세 · 부가세 약 50,760원이 붙습니다")).toBe("expensive");
  });

  it("낮은 쪽과 높은 쪽이 같이 나오면(4월이 가장 낮고, 8월이 가장 높습니다) neutral", () => {
    expect(numberTone("4월이 1년 중 가장 낮고, 8월이 가장 높습니다")).toBe("neutral");
  });

  it("글이 없어도 오류 없이 neutral", () => {
    expect(numberTone("")).toBe("neutral");
  });
});

// 작업 0321 — 큰 제목 숫자 카운트업에 쓸 값 읽기 (순수 함수)
describe("parseCount — 숫자 조각 → 카운트업 값 · 앞뒤 글 · 소수 자리 (작업 0321)", () => {
  it("직구 금액 '64,426원' → 값 64426 · 단위 원 · 소수 없음", () => {
    expect(parseCount("64,426원")).toEqual({ prefix: "", value: 64426, digits: 0, suffix: "원" });
  });

  it("여행 물가 '27%' → 값 27 · 단위 %", () => {
    expect(parseCount("27%")).toEqual({ prefix: "", value: 27, digits: 0, suffix: "%" });
  });

  it("통화 기호 · 소수 자리 — '$1,200.5' → 앞 $ · 값 1200.5 · 자리 1", () => {
    expect(parseCount("$1,200.5")).toEqual({ prefix: "$", value: 1200.5, digits: 1, suffix: "" });
    expect(parseCount("¥120,000")).toEqual({ prefix: "¥", value: 120000, digits: 0, suffix: "" });
  });

  it("부호는 앞 글로 — '+3%' · '-12%'", () => {
    expect(parseCount("+3%")).toEqual({ prefix: "+", value: 3, digits: 0, suffix: "%" });
    expect(parseCount("-12%")).toEqual({ prefix: "-", value: 12, digits: 0, suffix: "%" });
  });

  it("앞뒤 글을 다시 이으면 원래 조각 — 쉼표 · 단위가 그대로(카운트 끝 글 = 서버 글)", () => {
    for (const t of ["64,426원", "27%", "$1,200", "3,000,000원", "9%", "100달러"]) {
      const p = parseCount(t);
      expect(p, t).not.toBeNull();
      const { prefix, value, digits, suffix } = p!;
      expect(`${prefix}${value.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })}${suffix}`, t).toBe(t);
    }
  });

  it("쉼표 없는 1000 이상(연도 · 번호)은 형식이 달라지므로 null — 카운트하지 않음", () => {
    expect(parseCount("2026년")).toBeNull();
    expect(parseCount("1000원")).toBeNull();
  });

  it("숫자가 아닌 조각 · 빈 글은 null", () => {
    expect(parseCount("")).toBeNull();
    expect(parseCount("원")).toBeNull();
    expect(parseCount("약")).toBeNull();
  });
});
