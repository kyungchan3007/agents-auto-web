// 작업 0168 — 판정 핀 (알약) 순수 로직 · 지금 signal-badge 를 대신 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   signal-badge.test.ts 는 지움 — "싼 편 · 보통 · 비싼 편" 글이 Figma 의 "쌈 · 보통 · 비쌈" 으로 바뀜 (signal-badge.tsx 를 남길지는 builder 판단 · 남기면 이 파일의 함수를 쓰게)
//
// builder 가 만들 것 — packages/ui/src/components/data/signal-pin.tsx (화면 컴포넌트 SignalPin 과 함께 아래 순수 export)
//   export type Signal = "cheap" | "normal" | "expensive"
//   export function signalLabel(signal: Signal): string        // "쌈" · "보통" · "비쌈" (색만으로 전하지 않고 항상 글자)
//   export function pinLabel(signal: Signal, pct?: number | null): string
//     - pct 가 유한한 숫자면 `${부호}${소수 첫째 자리}% ${signalLabel}` — 부호는 0 이상이면 "+" · 음수면 "-"(하이픈) · 예: -4.1 → "-4.1% 쌈" · 0.44 → "+0.4% 보통" · 2.26 → "+2.3% 비쌈"
//     - pct 가 null · undefined · NaN · Infinity 면 글자만 ("쌈") — 받지 못한 숫자를 지어내지 않음
//   export const PIN_STYLE: Record<Signal, { filled: boolean; outlined: boolean }>
//     - cheap · expensive: 바탕 채움(울트라마린 · 주홍 + 흰 글) · 테두리 없음 / normal: 흰 바탕 + 보조색 2px 테두리 (채움 없음 · 테두리 있음)
//   export const PIN_SIZE = { fontPx: 13, lineHeightPx: 20, padX: 12, padY: 4 }   // Figma: 글 SemiBold 13/20 · 안쪽 여백 12/4 · 둥근 알약(반경 999)
import { describe, expect, it } from "vitest";
import { PIN_SIZE, PIN_STYLE, pinLabel, signalLabel } from "./signal-pin";

describe("signalLabel — 글자 세 개", () => {
  it("쌈 · 보통 · 비쌈", () => {
    expect(signalLabel("cheap")).toBe("쌈");
    expect(signalLabel("normal")).toBe("보통");
    expect(signalLabel("expensive")).toBe("비쌈");
  });
});

describe("pinLabel", () => {
  it("Figma 예시 그대로 — -4.1% 쌈 · +0.4% 보통 · +2.3% 비쌈", () => {
    expect(pinLabel("cheap", -4.1)).toBe("-4.1% 쌈");
    expect(pinLabel("normal", 0.4)).toBe("+0.4% 보통");
    expect(pinLabel("expensive", 2.3)).toBe("+2.3% 비쌈");
  });

  it("소수 첫째 자리로 반올림 · 0 은 + 부호", () => {
    expect(pinLabel("cheap", -4.14)).toBe("-4.1% 쌈");
    expect(pinLabel("normal", 0.44)).toBe("+0.4% 보통");
    expect(pinLabel("expensive", 2.26)).toBe("+2.3% 비쌈");
    expect(pinLabel("normal", 0)).toBe("+0.0% 보통");
  });

  it("퍼센트가 없거나 유한하지 않으면 글자만 (숫자를 만들지 않음)", () => {
    for (const p of [null, undefined, Number.NaN, Infinity, -Infinity]) expect(pinLabel("cheap", p), String(p)).toBe("쌈");
    expect(pinLabel("expensive")).toBe("비쌈");
  });
});

describe("핀 모양", () => {
  it("쌈 · 비쌈은 채운 알약 · 보통은 흰 바탕 + 테두리", () => {
    expect(PIN_STYLE.cheap).toEqual({ filled: true, outlined: false });
    expect(PIN_STYLE.expensive).toEqual({ filled: true, outlined: false });
    expect(PIN_STYLE.normal).toEqual({ filled: false, outlined: true });
  });

  it("크기 — 글 13/20 · 안쪽 여백 12/4 (Figma)", () => {
    expect(PIN_SIZE).toEqual({ fontPx: 13, lineHeightPx: 20, padX: 12, padY: 4 });
  });
});
