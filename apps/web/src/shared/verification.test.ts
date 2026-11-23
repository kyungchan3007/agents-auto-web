// 소유 확인 태그 조립 (작업 0317) — Bing 은 늘 · 네이버는 값이 있을 때만
import { describe, expect, it } from "vitest";
import { verificationOther } from "./verification";

const BING = { "msvalidate.01": "80D88D51D528F03400697BF62BD604BF" };

describe("verificationOther (작업 0317)", () => {
  it("요구 1: 네이버 값이 빈 글이면 Bing 만 — naver-site-verification 키 없음", () => {
    const o = verificationOther("");
    expect(o).toEqual(BING);
    expect("naver-site-verification" in o).toBe(false);
  });

  it("요구 1: 공백만 있어도 빈 값으로 봄 (스페이스 · 탭 · 줄바꿈)", () => {
    for (const v of [" ", "   ", "\t", "\n", " \t\n "]) {
      expect(verificationOther(v)).toEqual(BING);
    }
  });

  it("요구 2: 값이 있으면 naver-site-verification 이 더해짐 — Bing 은 그대로", () => {
    expect(verificationOther("abc123def456")).toEqual({ ...BING, "naver-site-verification": "abc123def456" });
  });

  it("요구 2: 값 앞뒤 공백은 떼고 넣음 · 가운데 글자는 그대로", () => {
    expect(verificationOther("  abc123  ")["naver-site-verification"]).toBe("abc123");
    expect(verificationOther("a-b_c")["naver-site-verification"]).toBe("a-b_c");
  });

  it("요구 3: 순수 함수 — 같은 값이면 같은 결과 · 돌려준 객체를 바꿔도 다음 결과에 영향 없음", () => {
    const a = verificationOther("x1");
    expect(verificationOther("x1")).toEqual(a);
    a["msvalidate.01"] = "changed";
    expect(verificationOther("x1")["msvalidate.01"]).toBe("80D88D51D528F03400697BF62BD604BF");
    expect(verificationOther("")).toEqual(BING);
  });
});
