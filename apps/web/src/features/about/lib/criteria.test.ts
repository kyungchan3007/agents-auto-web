// 작업 0170 — 소개(/about) 기준 카드 6개 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
// Figma 08 · SR-ABT-01 — 환율 · 신호 · 여행 물가 · 직구 계산 · 방문 통계 · 만드는 사람
// 판정 설명은 사이트 신호 규칙(최근 90일 백분위 · SIG-05)으로 씀 — Figma 예시 문구 "1년 평균과의 차이로 판정" 은 쓰지 않음 (lead 결정 · 0169 와 같은 기준)
//
// builder 가 만들 것 — apps/web/src/features/about/lib/criteria.ts
//   export const ABOUT_CARDS: readonly { id: string; title: string; body: string }[]  // 6개 · 이 순서
import { describe, expect, it } from "vitest";
import { ABOUT_CARDS } from "./criteria";

const card = (title: string) => ABOUT_CARDS.find((c) => c.title === title);

describe("기준 카드 6개", () => {
  it("제목 · 순서 (Figma)", () => {
    expect(ABOUT_CARDS.map((c) => c.title)).toEqual(["환율", "싼 편 · 비싼 편 신호", "여행 물가", "직구 계산", "방문 통계", "누가 만드나요"]);
  });

  it("id 는 서로 다르고 본문은 비지 않음", () => {
    expect(new Set(ABOUT_CARDS.map((c) => c.id)).size).toBe(6);
    for (const c of ABOUT_CARDS) expect(c.body.trim().length, c.title).toBeGreaterThan(0);
  });

  it("환율 — 한국수출입은행 · 평일 12시 · 실패하면 13:30 · 15:00 다시", () => {
    const b = card("환율")?.body ?? "";
    for (const s of ["한국수출입은행", "평일 12시", "13:30", "15:00"]) expect(b, s).toContain(s);
  });

  it("신호 — 최근 90일 기준 · 쌈 · 보통 · 비쌈 · '1년 평균' 으로 판정한다고 쓰지 않음", () => {
    const b = card("싼 편 · 비싼 편 신호")?.body ?? "";
    expect(b).toContain("90일");
    for (const s of ["쌈", "보통", "비쌈"]) expect(b, s).toContain(s);
    expect(b).not.toContain("1년 평균");
  });

  it("여행 물가 — 세계은행 · 한국 = 100", () => {
    const b = card("여행 물가")?.body ?? "";
    expect(b).toContain("세계은행");
    expect(b).toContain("한국 = 100");
  });

  it("직구 계산 — 면세 한도 $200 · $150 · 관세청 과세환율", () => {
    const b = card("직구 계산")?.body ?? "";
    for (const s of ["$200", "$150", "관세청 과세환율"]) expect(b, s).toContain(s);
  });

  it("방문 통계 — 쿠키 없는 방문 수만", () => {
    expect(card("방문 통계")?.body).toContain("쿠키");
  });

  it("누가 만드나요 — 사람 한 명과 AI 에이전트 팀 · 과정은 작업실에 공개", () => {
    const b = card("누가 만드나요")?.body ?? "";
    expect(b).toContain("AI 에이전트 팀");
    expect(b).toContain("작업실");
  });
});
