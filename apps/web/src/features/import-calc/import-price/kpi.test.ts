// 작업 0221 — 수입물가 숫자 카드(카운트업)용 계산 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//
// builder 가 만들 것 — apps/web/src/features/import-calc/import-price/import-price.ts 에 더함
//   kpiDigits(value: number, max = 2): number   // 카운트업 소수 자리 — 값이 보이는 만큼(끝 0 제외 · 최대 max) · 정수면 0 · formatCount(value, digits) 가 numberText(value, { maximumFractionDigits: max }) 와 같음
//   deltaTone(delta: number | null): "up" | "down" | "flat" | null   // 전달보다: 오름 up(주홍 점) · 내림 down(파랑 점) · 0 flat(회색 점) · 없으면 null
import { numberText } from "@hav/shared/format";
import { formatCount } from "@hav/ui/hooks/count/use-count-up";
import { describe, expect, it } from "vitest";
import { deltaTone, kpiDigits } from "./import-price";

describe("kpiDigits — 카운트업 끝 글 = 지금 글", () => {
  it("보이는 소수 자리만", () => {
    expect(kpiDigits(156.86)).toBe(2);
    expect(kpiDigits(156.8)).toBe(1);
    expect(kpiDigits(157)).toBe(0);
    expect(kpiDigits(1341)).toBe(0);
  });
  it("최대 자리로 자름", () => {
    expect(kpiDigits(156.8649)).toBe(2);
    expect(kpiDigits(1.23456, 3)).toBe(3);
  });
  it("formatCount(value, digits) = numberText(value, 최대 2자리)", () => {
    for (const v of [156.86, 156.8, 157, 1341, 99.5, 100.04, 0.5]) expect(formatCount(v, kpiDigits(v))).toBe(numberText(v, { maximumFractionDigits: 2 }));
  });
});

describe("deltaTone", () => {
  it("오름 · 내림 · 같음 · 없음", () => {
    expect(deltaTone(4)).toBe("up");
    expect(deltaTone(-2.86)).toBe("down");
    expect(deltaTone(0)).toBe("flat");
    expect(deltaTone(null)).toBeNull();
  });
});
