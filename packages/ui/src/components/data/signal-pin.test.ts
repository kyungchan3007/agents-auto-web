// 작업 0168 — 판정 핀 (알약) 순수 로직 · 지금 signal-badge 를 대신 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   signal-badge.test.ts 는 지움 — "싼 편 · 보통 · 비싼 편" 글이 Figma 의 "낮음 · 보통 · 높음" 으로 바뀜 (signal-badge.tsx 를 남길지는 builder 판단 · 남기면 이 파일의 함수를 쓰게)
//
// builder 가 만들 것 — packages/ui/src/components/data/signal-pin.tsx (화면 컴포넌트 SignalPin 과 함께 아래 순수 export)
//   export type Signal = "cheap" | "normal" | "expensive"
//   export function signalLabel(signal: Signal): string        // "낮음" · "보통" · "높음" (색만으로 전하지 않고 항상 글자)
//   export function pinLabel(signal: Signal, pct?: number | null): string
//     - pct 가 유한한 숫자면 `${부호}${소수 첫째 자리}% ${signalLabel}` — 부호는 0 이상이면 "+" · 음수면 "-"(하이픈) · 예: -4.1 → "-4.1% 낮음" · 0.44 → "+0.4% 보통" · 2.26 → "+2.3% 높음"
//     - pct 가 null · undefined · NaN · Infinity 면 글자만 ("낮음") — 받지 못한 숫자를 지어내지 않음
//   export const PIN_STYLE: Record<Signal, { filled: boolean; outlined: boolean }>
//     - cheap · expensive: 바탕 채움(울트라마린 · 주홍 + 흰 글) · 테두리 없음 / normal: 흰 바탕 + 보조색 2px 테두리 (채움 없음 · 테두리 있음)
//   (작업 0170 추가 요청 · 사용자 "시안이랑 다르다") export function pinBasis(signal: Signal, percentile?: number | null): string
//     - 판정 기준(최근 90일 백분위 · SIG-05)의 근거 숫자 + 판정 — pinLabel(퍼센트 변화 "-4.1% 낮음")과는 다른 글: 홈 · 도착지 줄이 쓰고, pinLabel 은 "작년 대비" 같은 퍼센트용으로 남김
//     - percentile ≤ 0.5 → `하위 ${Math.round(percentile × 100)}% · ${label}` · percentile > 0.5 → `상위 ${Math.round((1 − percentile) × 100)}% · ${label}` (label 은 넘겨 준 signal 의 글자 — 백분위로 다시 판정하지 않음)
//     - 백분위가 null · undefined · 유한하지 않거나 0~1 밖이면 판정 글자만 (숫자를 지어내지 않음)
//     - SignalPin 은 percentile prop 을 받아 pinBasis 글을 보임 (text 가 있으면 text 가 먼저 · pct 는 기존대로 pinLabel)
//   export const PIN_SIZE = { fontPx: 13, lineHeightPx: 20, padX: 12, padY: 4 }   // Figma: 글 SemiBold 13/20 · 안쪽 여백 12/4 · 둥근 알약(반경 999)
import { describe, expect, it } from "vitest";
import { PIN_SIZE, PIN_STYLE, pinBasis, pinLabel, signalLabel } from "./signal-pin";

describe("signalLabel — 글자 세 개", () => {
  it("낮음 · 보통 · 높음", () => {
    expect(signalLabel("cheap")).toBe("낮음");
    expect(signalLabel("normal")).toBe("보통");
    expect(signalLabel("expensive")).toBe("높음");
  });
});

describe("pinLabel", () => {
  it("Figma 예시 그대로 — -4.1% 낮음 · +0.4% 보통 · +2.3% 높음", () => {
    expect(pinLabel("cheap", -4.1)).toBe("-4.1% 낮음");
    expect(pinLabel("normal", 0.4)).toBe("+0.4% 보통");
    expect(pinLabel("expensive", 2.3)).toBe("+2.3% 높음");
  });

  it("소수 첫째 자리로 반올림 · 0 은 + 부호", () => {
    expect(pinLabel("cheap", -4.14)).toBe("-4.1% 낮음");
    expect(pinLabel("normal", 0.44)).toBe("+0.4% 보통");
    expect(pinLabel("expensive", 2.26)).toBe("+2.3% 높음");
    expect(pinLabel("normal", 0)).toBe("+0.0% 보통");
  });

  it("퍼센트가 없거나 유한하지 않으면 글자만 (숫자를 만들지 않음)", () => {
    for (const p of [null, undefined, Number.NaN, Infinity, -Infinity]) expect(pinLabel("cheap", p), String(p)).toBe("낮음");
    expect(pinLabel("expensive")).toBe("높음");
  });
});

describe("핀 모양", () => {
  it("낮음 · 높음은 채운 알약 · 보통은 흰 바탕 + 테두리", () => {
    expect(PIN_STYLE.cheap).toEqual({ filled: true, outlined: false });
    expect(PIN_STYLE.expensive).toEqual({ filled: true, outlined: false });
    expect(PIN_STYLE.normal).toEqual({ filled: false, outlined: true });
  });

  it("크기 — 글 13/20 · 안쪽 여백 12/4 (Figma)", () => {
    expect(PIN_SIZE).toEqual({ fontPx: 13, lineHeightPx: 20, padX: 12, padY: 4 });
  });
});

describe("pinBasis — 판정 기준의 근거 숫자 (작업 0170)", () => {
  it("시안 예 — 하위 12% · 낮음 · 하위 50% · 보통 · 상위 10% · 높음", () => {
    expect(pinBasis("cheap", 0.12)).toBe("하위 12% · 낮음");
    expect(pinBasis("normal", 0.5)).toBe("하위 50% · 보통");
    expect(pinBasis("expensive", 0.9)).toBe("상위 10% · 높음");
  });

  it("0.5 를 넘으면 상위 · 이하는 하위 — 경계 0.5 / 0.51", () => {
    expect(pinBasis("normal", 0.5)).toBe("하위 50% · 보통");
    expect(pinBasis("normal", 0.51)).toBe("상위 49% · 보통");
    expect(pinBasis("normal", 0.6)).toBe("상위 40% · 보통");
  });

  it("신호 경계 — 0.3(낮음 경계) · 0.7(높음 경계) · 양 끝 0 · 1", () => {
    expect(pinBasis("cheap", 0.3)).toBe("하위 30% · 낮음");
    expect(pinBasis("normal", 0.31)).toBe("하위 31% · 보통");
    expect(pinBasis("expensive", 0.7)).toBe("상위 30% · 높음");
    expect(pinBasis("cheap", 0)).toBe("하위 0% · 낮음");
    expect(pinBasis("expensive", 1)).toBe("상위 0% · 높음");
  });

  it("정수로 반올림 — 0.124 → 12 · 0.126 → 13 · 상위는 1 − p 를 반올림 (0.876 → 12 · 0.874 → 13)", () => {
    expect(pinBasis("cheap", 0.124)).toBe("하위 12% · 낮음");
    expect(pinBasis("cheap", 0.126)).toBe("하위 13% · 낮음");
    expect(pinBasis("expensive", 0.876)).toBe("상위 12% · 높음");
    expect(pinBasis("expensive", 0.874)).toBe("상위 13% · 높음");
  });

  it("글의 판정은 넘겨 준 signal 그대로 (백분위로 다시 정하지 않음)", () => {
    expect(pinBasis("expensive", 0.1)).toBe("하위 10% · 높음");
  });

  it("백분위가 없거나 이상하면 판정 글자만 (숫자를 지어내지 않음)", () => {
    for (const p of [null, undefined, Number.NaN, Infinity, -Infinity, -0.1, 1.2]) expect(pinBasis("cheap", p), String(p)).toBe("낮음");
    expect(pinBasis("normal")).toBe("보통");
    expect(pinBasis("expensive", null)).toBe("높음");
  });
});
