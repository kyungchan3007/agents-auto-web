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
import { FX_SCHEDULE_TEXT, checkedAtText, emptyCopy } from "./fx-schedule";

describe("수집 일정 문장 — 실제 일정대로 (.github/workflows/ensure-fx.yml)", () => {
  it("평일 한국 시간 12시 이후 수출입은행 값 · 못 받으면 12:10 ~ 17:40 30분마다 다시 · 받으면 사이트를 새로 만듦 · 주말 · 공휴일은 직전 영업일 값", () => {
    for (const s of ["평일", "12시", "수출입은행", "12:10", "17:40", "30분", "사이트를 새로 만들", "주말", "공휴일", "직전 영업일"]) expect(FX_SCHEDULE_TEXT, s).toContain(s);
  });

  it("긴 줄표(—)를 쓰지 않음 (사이트 글쓰기 규칙)", () => {
    expect(FX_SCHEDULE_TEXT).not.toMatch(/[—–]/);
  });
});

describe("'자료 없음 · 날짜 시각 확인' (시안 3-new)", () => {
  it("한국 시간으로 — UTC 01:00 → 10:00", () => {
    expect(checkedAtText("2026-11-25T01:00:00.000Z")).toBe("자료 없음 · 2026-11-25 10:00 확인");
  });

  it("날짜가 바뀌는 시각 — UTC 15:30 은 한국 다음 날 00:30", () => {
    expect(checkedAtText("2026-11-24T15:30:00.000Z")).toBe("자료 없음 · 2026-11-25 00:30 확인");
  });

  it("시각을 모르거나 날짜가 아니면 시각 없이 '자료 없음' (지어내지 않음)", () => {
    expect(checkedAtText(null)).toBe("자료 없음");
    expect(checkedAtText("")).toBe("자료 없음");
    expect(checkedAtText("어제쯤")).toBe("자료 없음");
  });
});

describe("빈 상태 문장 · 링크 — 세 화면", () => {
  it("/calc — 시안 3-new 문장 그대로 · 링크 셋(과세환율 아래 · 통화별 1년 흐름 · 여행 물가)", () => {
    const c = emptyCopy({ screen: "calc" });
    expect(c.title).toBe("오늘 환율을 아직 받지 못해 계산을 잠시 멈췄습니다");
    expect(c.reason).toBe("한국수출입은행이 오늘 값을 아직 주지 않았습니다. 평일 낮 12시부터 30분마다 다시 받고, 받으면 사이트를 새로 만들어 계산이 다시 열립니다.");
    expect(c.links).toEqual([
      { label: "이번 주 관세청 과세환율 (아래)", href: "#customs" },
      { label: "통화별 1년 흐름", href: "/currencies" },
      { label: "여행 물가", href: "/prices" },
    ]);
  });

  it("여행 물가(환율 없는 나라) — 제목에 나라 이름 · 이어 볼 곳은 통화 둘러보기 · 직구 계산", () => {
    const c = emptyCopy({ screen: "prices", name: "베트남" });
    expect(c.title).toContain("베트남");
    expect(c.title).toContain("받지 못했습니다");
    expect(c.links).toEqual([
      { label: "통화 둘러보기", href: "/currencies" },
      { label: "직구 계산", href: "/calc" },
    ]);
  });

  it("통화 상세(값 못 받은 날) — 제목에 통화 이름 · 이어 볼 곳은 통화 둘러보기 · 여행 물가 · 직구 계산", () => {
    const c = emptyCopy({ screen: "currency", name: "엔화(JPY)" });
    expect(c.title).toContain("엔화(JPY)");
    expect(c.title).toContain("받지 못했습니다");
    expect(c.links).toEqual([
      { label: "통화 둘러보기", href: "/currencies" },
      { label: "여행 물가", href: "/prices" },
      { label: "직구 계산", href: "/calc" },
    ]);
  });

  it("세 화면 모두 이유에 수집 일정이 들어 있음 — 다시 받는 시각 · 사이트를 새로 만듦 (막다른 화면이 아님)", () => {
    for (const screen of ["calc", "prices", "currency"] as const) {
      const c = emptyCopy({ screen, name: "이름" });
      for (const s of ["한국수출입은행", "12시", "30분", "사이트를 새로 만들"]) expect(c.reason, `${screen} ${s}`).toContain(s);
    }
  });

  it("링크는 모두 사이트 안 주소 — 같은 페이지 칸(#) 또는 / 로 시작 · 빈 목록이 아님", () => {
    for (const screen of ["calc", "prices", "currency"] as const) {
      const { links } = emptyCopy({ screen, name: "이름" });
      expect(links.length).toBeGreaterThanOrEqual(2);
      for (const l of links) {
        expect(l.label.length).toBeGreaterThan(0);
        expect(l.href).toMatch(/^(#|\/)/);
      }
    }
  });

  it("긴 줄표(—)를 쓰지 않음", () => {
    for (const screen of ["calc", "prices", "currency"] as const) {
      const c = emptyCopy({ screen, name: "이름" });
      expect(c.title + c.reason + c.links.map((l) => l.label).join("")).not.toMatch(/[—–]/);
    }
  });
});
