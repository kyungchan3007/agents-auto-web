// 작업 0396 — 안내 문구 두 갈래(제공 안 함 · 늦음) · 주는 통화 판정 · 개발자 문단 · "자료 없음 · 확인" 제거 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   바뀐 계약: emptyCopy(p: { screen; name?; given?: boolean }) → { title; links } (reason 문단 없음 · given 기본 true) · fxGiven(currency: string | null): boolean (수출입은행이 주는 통화인가 · 목록 한 곳 상수 · 통화 없음 null 은 false)
//             checkedAtText 지움(쓰는 곳 없음) · emptyProps 는 { …emptyCopy } 만(이름표 없음) · DataEmpty 는 checked · reason 없이 그려짐
// (아래는 작업 0346 원문)
// 작업 0346 — 빈 화면(막다른 화면) 없애기: 빈 상태 문장 · 링크 목록 (시안 3-new) (테스트 먼저 · 구현 전에는 FAIL 이 정상)
// 요구: 값을 못 받은 날 세 화면(/calc · 여행 물가 환율 없는 나라 · 통화 상세)이 같은 빈 상태를 씀 — '자료 없음 · 날짜 시각 확인' · 제목 · 이유와 다시 받는 시각(실제 수집 일정) · '그동안 볼 수 있는 것' 링크
//
// builder 가 만들 것 — packages/shared/src/domain/fx-schedule.ts (순수 함수 · @hav/shared/fx-schedule 로 내보냄 — package.json exports)
//   export const FX_SCHEDULE_TEXT: string                       // 실제 수집 일정 한 문단(아래 규칙)
//   export function checkedAtText(iso: string | null): string   // "자료 없음 · 2026-11-25 10:00 확인" (한국 시간) · 시각을 모르거나 날짜가 아니면 "자료 없음" 만 (지어내지 않음)
//   export type EmptyScreen = "calc" | "prices" | "currency"
//   export type EmptyLink = { label: string; href: string }
//   export function emptyCopy(p: { screen: EmptyScreen; name?: string }): { title: string; reason: string; links: EmptyLink[] }
// packages/ui/src/components/feedback/data-empty.tsx — 공통 부품 DataEmpty (테스트는 data-empty.test.ts)
import { describe, expect, it } from "vitest";
import * as fx from "./fx-schedule";
import { FX_SCHEDULE_TEXT, emptyCopy, fxGiven } from "./fx-schedule";

describe("수집 일정 문장 — 실제 일정대로 (.github/workflows/ensure-fx.yml)", () => {
  it("평일 한국 시간 12시 이후 수출입은행 값 · 못 받으면 12:10 ~ 17:40 30분마다 다시 · 받으면 사이트를 새로 만듦 · 주말 · 공휴일은 직전 영업일 값", () => {
    for (const s of ["평일", "12시", "수출입은행", "12:10", "17:40", "30분", "사이트를 새로 만들", "주말", "공휴일", "직전 영업일"]) expect(FX_SCHEDULE_TEXT, s).toContain(s);
  });

  it("긴 줄표(—)를 쓰지 않음 (사이트 글쓰기 규칙)", () => {
    expect(FX_SCHEDULE_TEXT).not.toMatch(/[—–]/);
  });
});

describe("주는 통화인가 — fxGiven (지어내지 않음: 수출입은행 목록 한 곳)", () => {
  it("엔 · 달러 · 유로 · 바트 · 루피아는 줌", () => {
    for (const c of ["JPY", "USD", "EUR", "THB", "IDR"]) expect(fxGiven(c), c).toBe(true);
  });
  it("동(VND)은 주지 않음 · 통화 없음(null · 빈 글)도 false", () => {
    expect(fxGiven("VND")).toBe(false);
    expect(fxGiven(null)).toBe(false);
    expect(fxGiven("")).toBe(false);
  });
});

describe("지운 것 — 개발자 말투 · '자료 없음 · 확인'", () => {
  it("checkedAtText 는 더 이상 내보내지 않음", () => {
    expect("checkedAtText" in fx).toBe(false);
  });
  it("어느 화면 · 어느 갈래에도 수집 일정 · 개발자 말이 없음", () => {
    for (const screen of ["calc", "prices", "currency"] as const)
      for (const given of [true, false]) {
        const c = emptyCopy({ screen, name: "베트남", given });
        const all = JSON.stringify(c);
        for (const bad of ["수출입은행이", "30분마다", "사이트를 새로", "자료 없음", "확인", "12시부터"]) expect(all, `${screen}/${given} ${bad}`).not.toContain(bad);
      }
  });
});

describe("emptyCopy — 두 갈래", () => {
  it("여행 물가 · 주지 않는 통화 → \"{나라} 환율은 아직 제공되지 않습니다\"", () => {
    expect(emptyCopy({ screen: "prices", name: "베트남", given: false }).title).toBe("베트남 환율은 아직 제공되지 않습니다");
  });
  it("여행 물가 · 늦음 → \"오늘 환율을 아직 받지 못했습니다\"", () => {
    expect(emptyCopy({ screen: "prices", name: "일본", given: true }).title).toBe("오늘 환율을 아직 받지 못했습니다");
    expect(emptyCopy({ screen: "prices", name: "일본" }).title).toBe("오늘 환율을 아직 받지 못했습니다");
  });
  it("통화 상세 · 주지 않는 통화 → \"{이름} 환율은 아직 제공되지 않습니다\" · 늦음 → 이름 + 받지 못했습니다", () => {
    expect(emptyCopy({ screen: "currency", name: "동(VND)", given: false }).title).toBe("동(VND) 환율은 아직 제공되지 않습니다");
    const late = emptyCopy({ screen: "currency", name: "엔화(JPY)" }).title;
    expect(late).toContain("엔화(JPY)");
    expect(late).toContain("받지 못했습니다");
  });
  it("직구 계산 · 계산을 멈췄다는 뜻이 보이는 제목(builder 판단) · 받지 못함 + 계산", () => {
    const t = emptyCopy({ screen: "calc" }).title;
    expect(t).toContain("받지 못");
    expect(t).toContain("계산");
  });
  it("그동안 볼 수 있는 것 링크는 그대로 남음 — calc 셋 · prices 둘 · currency 셋", () => {
    expect(emptyCopy({ screen: "calc" }).links).toEqual([
      { label: "이번 주 관세청 과세환율 (아래)", href: "#customs" },
      { label: "통화별 1년 흐름", href: "/currencies" },
      { label: "여행 물가", href: "/prices" },
    ]);
    for (const given of [true, false]) {
      expect(emptyCopy({ screen: "prices", name: "베트남", given }).links).toEqual([
        { label: "통화 둘러보기", href: "/currencies" },
        { label: "직구 계산", href: "/calc" },
      ]);
      expect(emptyCopy({ screen: "currency", name: "동(VND)", given }).links).toEqual([
        { label: "통화 둘러보기", href: "/currencies" },
        { label: "여행 물가", href: "/prices" },
        { label: "직구 계산", href: "/calc" },
      ]);
    }
  });
  it("긴 줄표(—)를 쓰지 않음 · 링크는 사이트 안 주소", () => {
    for (const screen of ["calc", "prices", "currency"] as const)
      for (const given of [true, false]) {
        const c = emptyCopy({ screen, name: "이름", given });
        expect(c.title + c.links.map((l) => l.label).join("")).not.toMatch(/[—–]/);
        for (const l of c.links) expect(l.href).toMatch(/^(#|\/)/);
      }
  });
});
