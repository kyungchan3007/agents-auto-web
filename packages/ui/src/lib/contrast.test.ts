// 작업 0168 · 0173 — 새 테마 "하늘 종이 · 바다 띠" 대비 — 밝은 화면 하나 (어두운 화면 모드 "밤 포스터" 는 없앰 · 작업 0173)
// 사용자 "피그마 시안대로 하나만 있으면 돼 두개 다 필요 없어" → tokens.css 에 @media (prefers-color-scheme: dark) 블록이 없고, 읽은 값이 곧 화면의 값
//   (예전에는 밤 블록을 떼어 내고 읽었음 — 이제 떼어 낼 블록이 없어야 하므로 tokens.css 전체를 그대로 읽음 · 블록이 남아 있으면 light 값이 덮여 아래 검사가 실패)
// 토큰 이름은 그대로 · 값만 새 테마 (sdd.md 1) — 정해진 값(R1 · R2)은 고정, 나머지 보조 값은 대비로만 판정
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { contrastRatio, luminance, readSurfaces } from "./contrast";

const CSS = readFileSync(new URL("../tokens.css", import.meta.url), "utf8");

const base = readSurfaces(CSS);

const lc = (v: string) => v.toLowerCase();
function hue(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  const h = d === 0 ? 0 : max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}

// 본문으로 쓰는 색은 4.5 (WCAG AA) — 큰 글자 3 기준이던 오로라 그라데이션은 새 테마에서 쓰지 않음 (3D 전용으로만 남김)
const BODY = ["fg", "fg-2", "accent", "cheap", "normal", "expensive"];

describe("contrastRatio", () => {
  it("검정 · 흰색은 21, 같은 색은 1", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
    expect(contrastRatio("#4ff0e0", "#4ff0e0")).toBe(1);
  });
  it("#rrggbb 가 아니면 오류", () => {
    expect(() => contrastRatio("red", "#000000")).toThrow();
  });
});

describe("tokens.css — 세 배경 (하늘 종이 light · 바다 띠 dark · elevated)", () => {
  it("dark · elevated · light 세 배경이 모두 있다", () => {
    expect(Object.keys(base).sort()).toEqual(["dark", "elevated", "light"]);
  });

  it("R1 · R2 정해진 값 — 흰 바탕 #FFFFFF(작업 0216 사용자 결정 · 예전 하늘 종이 #EAF4F2) · 글자 #16246E · 보조 #4A5A8C · 쌈 = 울트라마린 #2438A8", () => {
    expect(lc(base.light.surface)).toBe("#ffffff");
    expect(lc(base.light["surface-2"])).not.toBe("#ffffff"); // 흰 카드 · 칸 구분용 옅은 면은 흰색이 아님
    expect(lc(base.light.fg)).toBe("#16246e");
    expect(lc(base.light["fg-2"])).toBe("#4a5a8c");
    expect(lc(base.light.cheap)).toBe("#2438a8");
  });

  it("바다 띠(dark) 바탕 = 울트라마린 #2438A8 · 글자 종이색/흰색 · 포인트(accent) = 해 노랑 #F7C548", () => {
    expect(lc(base.dark.surface)).toBe("#2438a8");
    expect(luminance(base.dark.fg)).toBeGreaterThanOrEqual(0.8);
    expect(lc(base.dark.accent)).toBe("#f7c548");
  });

  it("elevated(바다 띠 안의 칸) 바탕은 바다 띠보다 한 단계 짙음", () => {
    expect(luminance(base.elevated.surface)).toBeLessThan(luminance(base.dark.surface));
  });

  it("R2 판정 색은 파랑(쌈) · 빨강 계열(비쌈) 둘뿐 — 색상 각도로 확인 (모든 배경)", () => {
    for (const [name, v] of Object.entries(base)) {
      expect(hue(v.cheap), `${name} cheap`).toBeGreaterThanOrEqual(190);
      expect(hue(v.cheap), `${name} cheap`).toBeLessThanOrEqual(250);
      const e = hue(v.expensive);
      expect(e <= 25 || e >= 350, `${name} expensive 각도 ${e}`).toBe(true);
    }
  });

  it("light 의 포인트(accent)는 바다 청록 계열 (글자로도 쓰므로 대비 맞춘 진한 값)", () => {
    expect(hue(base.light.accent)).toBeGreaterThanOrEqual(160);
    expect(hue(base.light.accent)).toBeLessThanOrEqual(190);
  });

  for (const [name, v] of Object.entries(base)) {
    for (const bg of ["surface", "surface-2"]) {
      for (const fg of BODY) {
        it(`${name}: ${fg} on ${bg} ≥ 4.5`, () => {
          expect(contrastRatio(v[fg], v[bg])).toBeGreaterThanOrEqual(4.5);
        });
      }
    }
    it(`${name}: on-accent on accent ≥ 4.5 (버튼 글자)`, () => {
      expect(contrastRatio(v["on-accent"], v.accent)).toBeGreaterThanOrEqual(4.5);
    });
  }
});

describe("판정 핀 글자 대비 (흰 글 on 쌈 · 비쌈 바탕 · 남색 글 on 흰 바탕 · 하늘 종이 위)", () => {
  it("하늘 종이(light) 위 핀: 흰 글 on cheap · expensive ≥ 4.5 (핀 글은 13px SemiBold 라 본문 기준 · 핀은 하늘 종이 위 도착지 줄에 놓임)", () => {
    // Figma 의 비쌈 주홍 #D9452B 는 흰 글 4.34 · 하늘 종이 위 글자 3.87 로 4.5 에 못 미침 → builder 는 조금 더 진한 주홍(예: #C13A22 = 5.39 / 4.81)을 써야 함 (lead 판단 필요 — 보고에 적음)
    for (const fill of ["cheap", "expensive"]) expect(contrastRatio("#ffffff", base.light[fill]), fill).toBeGreaterThanOrEqual(4.5);
  });

  it("보통 핀: 흰 바탕 위 남색(fg) 글 ≥ 4.5 · 보조색(fg-2) 2px 테두리 ≥ 3 (하늘 종이 기준)", () => {
    expect(contrastRatio(base.light.fg, "#ffffff")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(base.light["fg-2"], "#ffffff")).toBeGreaterThanOrEqual(3);
  });
});

describe("밝은 화면 하나 — 어두운 화면 모드(밤 포스터) 없음 (작업 0173)", () => {
  it("tokens.css 에 prefers-color-scheme 이 없음 — 기기 설정과 상관없이 같은 값", () => {
    expect(CSS).not.toMatch(/prefers-color-scheme/);
  });

  it("light(하늘 종이) 값이 짙은 바탕으로 덮이지 않음 — 바탕은 밝고 글자는 짙음", () => {
    expect(luminance(base.light.surface)).toBeGreaterThanOrEqual(0.8);
    expect(luminance(base.light.fg)).toBeLessThanOrEqual(0.05);
  });

  it("바다 띠(dark)는 시안대로 울트라마린 그대로 — 어두운 구간은 남김", () => {
    expect(lc(base.dark.surface)).toBe("#2438a8");
  });
});

// 큰 숫자 전용 색 --hav-figure (text-figure · 작업 0169) — 하늘 종이 위 울트라마린 · 바다 띠 · 칸 위 해 노랑
// 큰 숫자(Gasoek One · 26px 이상)라 큰 글자 기준 3 이상 (builder 계산은 본문 4.5 도 넘음: 종이 8.49 · 띠 5.91)
describe("큰 숫자 색 --hav-figure", () => {
  it("값 — 하늘 종이 #2438A8 · 바다 띠 · elevated #F7C548", () => {
    expect(lc(base.light.figure)).toBe("#2438a8");
    expect(lc(base.dark.figure)).toBe("#f7c548");
    expect(lc(base.elevated.figure)).toBe("#f7c548");
  });

  for (const [name, v] of Object.entries(base)) {
    for (const bg of ["surface", "surface-2"]) {
      it(`${name}: figure on ${bg} ≥ 3 (큰 글자)`, () => {
        expect(contrastRatio(v.figure, v[bg])).toBeGreaterThanOrEqual(3);
      });
    }
  }
});

// 제목 속 숫자 강조 (작업 0175 세 번째 묶음 · N4) — 하늘 종이 위 해 노랑 형광펜 띠 위 글자 · 주홍 글자 · 바다 띠 위 해 노랑 글자
describe("제목 속 숫자 강조 대비", () => {
  it("해 노랑 토큰 --hav-sun 은 #F7C548", () => {
    expect(CSS).toMatch(/--hav-sun\s*:\s*#f7c548/i);
  });

  it("형광펜 띠(#F7C548) 위에서도 큰 제목 색(cheap · fg)이 본문 기준 4.5 이상 — 띠가 글자를 못 읽게 만들지 않음", () => {
    for (const fg of ["cheap", "fg"]) expect(contrastRatio(base.light[fg], "#f7c548"), fg).toBeGreaterThanOrEqual(4.5);
  });

  it("주홍 글자(expensive)가 하늘 종이 위에서 4.5 이상 (비쌈 뜻 숫자)", () => {
    expect(contrastRatio(base.light.expensive, base.light.surface)).toBeGreaterThanOrEqual(4.5);
    expect(lc(base.light.expensive)).toBe("#c13a22");
  });

  it("바다 띠 위 해 노랑 글자(figure)가 울트라마린 위에서 4.5 이상", () => {
    expect(lc(base.dark.figure)).toBe("#f7c548");
    expect(contrastRatio(base.dark.figure, base.dark.surface)).toBeGreaterThanOrEqual(4.5);
  });

  it("하늘 종이 위 노란 글자는 대비가 모자라 쓰지 않음을 숫자로 — #F7C548 on 하늘 종이 < 3", () => {
    expect(contrastRatio("#f7c548", base.light.surface)).toBeLessThan(3);
  });
});

// 울트라마린 면 위 강조 — 주홍 글자는 읽히지 않아 해 노랑 글자로 (작업 0175 · 사진 막은 작업 0222 에서 없어지고 파랑 면만 남음)
describe("울트라마린 면 위 강조 글자", () => {
  it("주홍(#C13A22)은 울트라마린(#2438A8) 위 대비가 3 미만 — 그래서 파랑 면 안에서는 비쌈 뜻도 노란 글자", () => {
    expect(contrastRatio(base.light.expensive, base.light.cheap)).toBeLessThan(3);
  });

  it("해 노랑 글자는 울트라마린 위에서 4.5 이상", () => {
    expect(contrastRatio("#f7c548", base.light.cheap)).toBeGreaterThanOrEqual(4.5);
  });
});

// 출발 안내판(작업 0177 · 벽에 걸린 물건처럼) — 판 #16246E · 칸 #1f3190(작업 0216 · 시안 B) 위 글자: 두 줄 모두 햇빛 노랑 #F7C548
describe("출발 안내판 글자 대비", () => {
  it("칸 색은 #1f3190 · 판은 짙은 남색 잉크(#16246E)", () => {
    expect(CSS).toMatch(/--hav-flap-cell\s*:\s*#1f3190/i);
    expect(CSS).toMatch(/--hav-pin-ink\s*:\s*#16246e/i);
  });

  it("햇빛 노랑(두 줄 #F7C548)이 칸 · 판 위에서 4.5 이상", () => {
    for (const bg of ["#1f3190", "#16246e"]) expect(contrastRatio("#f7c548", bg), bg).toBeGreaterThanOrEqual(4.5);
  });

  it("흰 글자 줄(w)도 칸 · 판 위에서 4.5 이상", () => {
    for (const bg of ["#1f3190", "#16246e"]) expect(contrastRatio("#ffffff", bg), bg).toBeGreaterThanOrEqual(4.5);
  });

  it("칸과 판이 구분됨(대비 1.1 이상) · 이음선(#0E1648)이 칸보다 더 짙음(대비 1.4 이상)", () => {
    expect(contrastRatio("#1f3190", "#16246e")).toBeGreaterThanOrEqual(1.1);
    expect(contrastRatio("#1f3190", "#0e1648")).toBeGreaterThanOrEqual(1.4);
  });
});

// 작업 0221 사용자 지적 — 입력 칸은 시안처럼 옅은 선 · 포커스일 때만 파랑 (공용 Field) · 옅은 선도 도형 대비 3 이상, 포커스 표시는 분명
describe("입력 칸 선 — 옅은 선(--hav-field-line) · 포커스 파랑", () => {
  const css = readFileSync(new URL("../tokens.css", import.meta.url), "utf8");
  const light = readSurfaces(css).light;
  it("옅은 선이 흰 칸(카드) 위에서 도형 대비 3 이상 · 글자색(fg)보다는 옅음", () => {
    const line = /--hav-field-line:\s*(#[0-9a-f]{6})/i.exec(css)?.[1];
    expect(line, "--hav-field-line 토큰").toBeTruthy();
    expect(contrastRatio(line as string, light.card)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(line as string, light.card)).toBeLessThan(contrastRatio(light.fg, light.card));
  });
  it("포커스 테두리(cheap)가 흰 칸 위에서 도형 대비 3 이상 · 옅은 선과 구분됨", () => {
    const line = /--hav-field-line:\s*(#[0-9a-f]{6})/i.exec(css)?.[1] as string;
    expect(contrastRatio(light.cheap, light.card)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(light.cheap, line)).toBeGreaterThanOrEqual(1.5);
  });
});
