// 작업 0192 — 통화 검색 제안 줄 · 결과 없음 문구
import { describe, expect, it } from "vitest";
import { emptyText, hitText, matchText } from "./search-view";

describe("hitText", () => {
  it("나라 · 도시가 맞으면 뒤에 붙임", () => {
    expect(hitText({ code: "JPY", matches: [{ country: "일본", city: "도쿄" }] })).toBe("JPY 엔화 · 일본 도쿄");
    expect(hitText({ code: "JPY", matches: [{ country: "일본" }] })).toBe("JPY 엔화 · 일본");
  });
  it("코드나 이름으로만 맞으면 코드 · 이름만", () => {
    expect(hitText({ code: "USD", matches: [] })).toBe("USD 달러");
  });
});

describe("matchText", () => {
  it("셋 이상이면 앞의 둘 + 외 N곳", () => {
    expect(matchText([{ country: "프랑스" }, { country: "독일", city: "프랑크푸르트" }, { country: "핀란드" }, { country: "그리스" }])).toBe("프랑스, 독일 프랑크푸르트 외 2곳");
  });
});

describe("emptyText", () => {
  it("고를 수 있는 통화 수를 숫자로", () => {
    expect(emptyText(22)).toBe("찾는 통화가 없습니다 · 고를 수 있는 통화 22개");
  });
});
