// 작업 0168 — tokens.css 의 나머지 약속: 3D 전용 고정 토큰 · 크기 단계 · 글꼴 · 흰 거품 · 걷어 낸 장식 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//
// builder 가 정할 이름 (이 테스트가 읽음) — packages/ui/src/tokens.css
//   3D 전용 (어느 배경에서도 값이 같음 · R7 "지구 · 비행기 생김새 그대로"):
//     --hav-3d-arc: #4ff0e0 · --hav-3d-aurora-1: #4ff0e0 · --hav-3d-aurora-2: #9c8cff · --hav-3d-aurora-3: #ff8ad8
//     --hav-3d-cheap: #4c9bff · --hav-3d-normal: #c7c7cc · --hav-3d-expensive: #ff5a5f   // 지구 점(toneColor)이 읽던 지금 값 (stage.tsx toneColor 가 읽음) — sdd 에는 arc · aurora 만 있고 이것은 R7 을 지키려고 test 가 더한 이름
//   흰 거품: --hav-foam: #ffffff (+ @theme inline 의 --color-foam)
//   크기 단계 (@theme · Figma 텍스트 스타일 · 글자 크기 --text-NAME 과 줄 높이 --text-NAME--line-height):
//     --text-poster  Gasoek One 96/102 (clamp 로 모바일 약 48 · 최대 6rem)
//     --text-section Gasoek One 48/54 (clamp · 최대 3rem)
//     --text-city    Gasoek One 34/36 (2.125rem)
//     --text-body    설명 16/26 (1rem)
//     --text-number  강조 숫자 26/32 (1.625rem)
//     --text-small   작은 글 13/20 (0.8125rem)
//   글꼴: --font-display 에 "Gasoek One" · --font-sans 에 "IBM Plex Sans KR" 글자가 들어감 (next/font 변수를 앞에 두고 이름을 뒤에 둠 — var(--font-…), "IBM Plex Sans KR", …)
//   걷어 냄 (R9): .hav-reveal · hav-rise(떠오름) · text-aurora 유틸 · 휴대폰 메뉴 두 줄 높이(6.5rem)
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const CSS = readFileSync(new URL("../tokens.css", import.meta.url), "utf8");
const lc = (s: string) => s.toLowerCase();

/** `--이름: 값;` 정의를 모두 (여러 곳에 있으면 모두) */
function defs(name: string): string[] {
  return [...CSS.matchAll(new RegExp(`${name.replace(/[-]/g, "\\-")}\\s*:\\s*([^;}]+);`, "g"))].map((m) => m[1].trim());
}

describe("3D 전용 고정 토큰 (R7) — 값이 어디서나 같음", () => {
  const FIXED: Record<string, string> = {
    "--hav-3d-arc": "#4ff0e0",
    "--hav-3d-aurora-1": "#4ff0e0",
    "--hav-3d-aurora-2": "#9c8cff",
    "--hav-3d-aurora-3": "#ff8ad8",
    "--hav-3d-cheap": "#4c9bff",
    "--hav-3d-normal": "#c7c7cc",
    "--hav-3d-expensive": "#ff5a5f",
  };
  for (const [name, value] of Object.entries(FIXED)) {
    it(`${name} = ${value} (정의가 하나 이상 · 모두 같은 값)`, () => {
      const d = defs(name);
      expect(d.length, `${name} 정의`).toBeGreaterThan(0);
      for (const v of d) expect(lc(v)).toBe(value);
    });
  }
});

describe("흰 거품", () => {
  it("--hav-foam = #ffffff · 유틸 색 --color-foam 연결", () => {
    expect(defs("--hav-foam").map(lc)).toContain("#ffffff");
    expect(CSS).toMatch(/--color-foam\s*:\s*var\(--hav-foam\)/);
  });
});

describe("크기 단계 — Figma 텍스트 스타일 그대로", () => {
  /** 글자 크기 값 → 가장 큰 크기(px) · clamp 면 앞(작은) 크기도 */
  function sizes(name: string): { min: number; max: number } {
    const raw = defs(`--text-${name}`)[0];
    expect(raw, `--text-${name} 정의`).toBeDefined();
    const nums = [...raw.matchAll(/(\d*\.?\d+)rem/g)].map((m) => Number(m[1]) * 16);
    expect(nums.length, `--text-${name} 값 ${raw}`).toBeGreaterThan(0);
    return { min: Math.min(...nums), max: Math.max(...nums) };
  }
  /** 줄 높이 비율 (단위 없는 숫자 또는 rem) */
  function ratio(name: string, fontPx: number): number {
    const raw = defs(`--text-${name}--line-height`)[0];
    expect(raw, `--text-${name}--line-height 정의`).toBeDefined();
    const rem = /^(\d*\.?\d+)rem$/.exec(raw);
    return rem ? (Number(rem[1]) * 16) / fontPx : Number(raw);
  }

  const SPEC: [string, number, number][] = [
    ["poster", 96, 102],
    ["section", 48, 54],
    ["city", 34, 36],
    ["body", 16, 26],
    ["number", 26, 32],
    ["small", 13, 20],
  ];
  for (const [name, px, line] of SPEC) {
    it(`--text-${name}: ${px}px / ${line}px`, () => {
      expect(sizes(name).max).toBeCloseTo(px, 1);
      expect(ratio(name, px)).toBeCloseTo(line / px, 2);
    });
  }

  it("포스터 큰 제목은 모바일에서 약 48 까지 줄어듦 (clamp 앞 값 40~56px)", () => {
    const { min, max } = sizes("poster");
    expect(min).toBeGreaterThanOrEqual(40);
    expect(min).toBeLessThanOrEqual(56);
    expect(max).toBe(96);
    expect(defs("--text-poster")[0]).toMatch(/^clamp\(/);
  });
});

describe("밝은 화면 하나 (작업 0173)", () => {
  it("어두운 화면 설정에 반응하는 블록이 없음 (@media prefers-color-scheme)", () => {
    expect(CSS).not.toMatch(/prefers-color-scheme/);
  });

  it(":root 가 color-scheme: light 를 알림 (브라우저 기본 컨트롤 · 스크롤바도 밝게)", () => {
    expect(CSS).toMatch(/:root[^{]*\{[^}]*color-scheme\s*:\s*light\s*;/);
  });
});

describe("큰 숫자 색 (0169)", () => {
  it("--hav-figure 를 유틸 색 --color-figure 로 연결 (text-figure)", () => {
    expect(CSS).toMatch(/--color-figure\s*:\s*var\(--hav-figure\)/);
  });
});

describe("글꼴", () => {
  it("--font-display 는 Pretendard(작업 0176 · 큰 제목 · 큰 숫자 800) · --font-sans 는 IBM Plex Sans KR (본문 — Pretendard 가 아님)", () => {
    expect(defs("--font-display")[0]).toContain("Pretendard");
    expect(defs("--font-display")[0]).not.toContain("Gasoek");
    expect(defs("--font-sans")[0]).toContain("IBM Plex Sans KR");
    expect(defs("--font-sans")[0].indexOf("Pretendard")).toBe(-1);
  });
});

describe("걷어 낸 장식 (R9)", () => {
  it("떠오름(.hav-reveal · hav-rise) · text-aurora 유틸이 없음", () => {
    expect(CSS).not.toMatch(/hav-reveal/);
    expect(CSS).not.toMatch(/hav-rise/);
    expect(CSS).not.toMatch(/@utility\s+text-aurora/);
  });

  it("고정 메뉴 높이는 한 줄 기준 — 휴대폰 두 줄(6.5rem) 값이 없음 (모바일 메뉴는 아이콘 → 펼침)", () => {
    expect(CSS).not.toMatch(/6\.5rem/);
    expect(CSS).toMatch(/--hav-nav-h\s*:/);
  });
});
