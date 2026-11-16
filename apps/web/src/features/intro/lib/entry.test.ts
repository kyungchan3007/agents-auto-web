// 작업 0186 — 인트로를 띄울지 (사이트에 들어올 때만 · 사이트 안 이동 · #위치 링크에서는 띄우지 않음)
//   원칙: 기존 홈은 그대로 · 인트로는 덮기만 — "오늘 환율"(/#today) 을 누를 때마다 인트로가 다시 뜨면 안 됨
import { describe, expect, it } from "vitest";
import { shouldShowIntro } from "./entry";

const base = { wide: true, off: false, hash: "", shownBefore: false, navType: "navigate", referrer: "", origin: "https://tripfx.pages.dev", firstPath: "/" } as const;

describe("인트로를 띄울지 (작업 0186)", () => {
  it("주소창 · 즐겨찾기로 처음 들어오면 띄움", () => {
    expect(shouldShowIntro(base)).toBe(true);
  });

  it("다른 사이트(검색 결과 등)에서 들어와도 띄움", () => {
    expect(shouldShowIntro({ ...base, referrer: "https://www.google.com/" })).toBe(true);
  });

  it("새로고침이면 띄움 (예전 주소가 사이트 안이어도)", () => {
    expect(shouldShowIntro({ ...base, navType: "reload", referrer: "https://tripfx.pages.dev/currencies" })).toBe(true);
  });

  it("주소에 #위치(예: #today)가 있으면 띄우지 않음 — '오늘 환율' 링크", () => {
    expect(shouldShowIntro({ ...base, hash: "#today" })).toBe(false);
  });

  it("사이트 안 다른 페이지에서 링크로 홈에 오면 띄우지 않음", () => {
    expect(shouldShowIntro({ ...base, referrer: "https://tripfx.pages.dev/prices" })).toBe(false);
  });

  it("이 문서에서 이미 한 번 띄웠으면(홈 → 다른 화면 → 홈) 다시 띄우지 않음", () => {
    expect(shouldShowIntro({ ...base, shownBefore: true })).toBe(false);
  });

  it("처음 연 문서가 홈이 아니면(다른 페이지로 들어와 화면 안에서 홈으로 이동) 띄우지 않음", () => {
    expect(shouldShowIntro({ ...base, firstPath: "/currencies" })).toBe(false);
  });

  it("폭 700 이하 · 끄기 스위치면 띄우지 않음 (0185 그대로)", () => {
    expect(shouldShowIntro({ ...base, wide: false })).toBe(false);
    expect(shouldShowIntro({ ...base, off: true })).toBe(false);
  });

  it("referrer 가 잘못된 값이어도 죽지 않음 — 외부로 봄", () => {
    expect(shouldShowIntro({ ...base, referrer: "not a url" })).toBe(true);
  });
});
