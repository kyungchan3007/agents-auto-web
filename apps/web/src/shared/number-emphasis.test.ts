// 작업 0175 세 번째 묶음 — 제목 속 숫자 · 금액 강조: 공통 부품 · 화면 적용 (소스 검사) (테스트 먼저 · 구현 전에는 FAIL 이 정상)
// 큰 제목 · 구간 제목 안의 숫자 · 퍼센트 · 금액을 한 부품으로 강조 — 하늘 종이 위: 글자색 그대로 + 해 노랑 형광펜 띠(글자 아래 40~50%) · 비쌈 뜻: 주홍 글자 · 바다 띠 위: 해 노랑 글자 (노란 글자는 하늘 종이 위 대비 부족이라 쓰지 않음)
//
// builder 가 할 것 (prd N1~N4 · sdd)
//   packages/ui/src/lib/emphasis.ts: splitNumbers · numberTone (emphasis.test.ts)
//   packages/ui/src/components/text/emph.tsx: Emph({ children, bg?: "light" | "sea", tone?: "neutral" | "expensive" }) · EmphText({ text, bg?, tone? }) — text 를 splitNumbers 로 나눠 숫자 조각만 Emph 로 · tone 을 안 주면 numberTone(text)
//     Emph: data-testid="emph" · data-tone · data-bg · light+neutral = 해 노랑 형광펜 띠(--hav-sun · 아래 40~50% — 그라데이션 transparent 50~60% 에서 시작) · expensive = text-expensive(주홍) · sea = 해 노랑 글자(text-figure 또는 text-sun)
//     이 부품만 그라데이션 허용(0168 "장식 그라데이션 없음" 검사에서 제외)
//   화면: 아래 다섯 곳의 문장을 <EmphText text={…}> 로 그림 (Title 안에 span · 색 클래스를 직접 쓰지 않음) — 홈 바다 띠만 bg="sea"
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const WEB_SRC = resolve(__dirname, ".."); // apps/web/src
const ROOT = resolve(WEB_SRC, "../../..");
const codeOf = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const read = (p: string) => codeOf(readFileSync(p, "utf8"));

describe("Emph · EmphText 공통 부품", () => {
  const src = () => read(join(ROOT, "packages/ui/src/components/text/emph.tsx"));

  it("부품 두 개 export · props(bg · tone) · splitNumbers · numberTone 사용", () => {
    const s = src();
    expect(s).toMatch(/export function Emph\(/);
    expect(s).toMatch(/export function EmphText\(/);
    expect(s).toMatch(/"light"\s*\|\s*"sea"/);
    expect(s).toMatch(/"neutral"\s*\|\s*"expensive"/);
    expect(s).toMatch(/\bsplitNumbers\(/);
    expect(s).toMatch(/\bnumberTone\(/);
    expect(s).toMatch(/from\s*"\.\.\/\.\.\/lib\/emphasis"/);
  });

  it("e2e 가 찾는 표시 — emph · data-tone · data-bg", () => {
    const s = src();
    expect(s).toMatch(/data-testid="emph"/);
    expect(s).toMatch(/data-tone=/);
    expect(s).toMatch(/data-bg=/);
  });

  it("하늘 종이 위: 해 노랑(sun) 형광펜 띠 — 그라데이션이 글자 높이 아래 40~50%(transparent 50~60% 에서 시작) @design", () => {
    const s = src();
    expect(s).toMatch(/gradient/);
    expect(s).toMatch(/--hav-sun|\bsun\b/);
    expect(s).toMatch(/transparent[ _]*(5\d|60)%/);
  });

  it("비쌈 뜻은 주홍 글자(text-expensive) · 바다 띠 위는 해 노랑 글자(text-figure · text-sun) — 노란 글자를 하늘 종이 위에 쓰지 않음 @design", () => {
    const s = src();
    expect(s).toMatch(/text-expensive/);
    expect(s).toMatch(/text-figure|text-sun/);
  });
});

describe("화면 적용 — 큰 문장이 공통 부품을 씀 (화면마다 따로 칠하지 않음)", () => {
  const SCREENS: [string, string, RegExp, "light" | "sea"][] = [
    ["apps/web/src/features/travel-price/components/prices-header.tsx", "여행 물가 큰 문장", /title/, "sea"], // 작업 0220: 파랑 면 위 큰 제목 — 숫자 %만 노랑(bg="sea") // 작업 0201: 머리가 prices-header.tsx 로 옮겨 감 (고른 나라 문장)
    ["apps/web/src/features/import-calc/components/calc-page.tsx", "직구 큰 문장", /calcHeadline/, "sea"], // 작업 0221 사용자 결정: 파랑 면 머리라 해 노랑 글자
    // 홈 여행 타이밍은 작업 0217 에서 파랑 첫 면 큰 제목(월만 노랑 · hero-section.tsx)으로 바뀌어 EmphText 형광펜이 없음
    ["apps/web/src/features/travel-price/components/flights-page.tsx", "여행 타이밍(/flights) 큰 문장", /headline/, "light"],
    // 홈 오늘 환율 구간은 작업 0177 에서 출발 안내판으로 바뀌어 큰 문장이 없음 (바다 띠 · bg="sea" 문장 없어짐)
  ];

  for (const [file, label, data, bg] of SCREENS) {
    it(`${label} — EmphText 로 그림${bg === "sea" ? ' (bg="sea")' : ""}`, () => {
      const s = read(join(ROOT, file));
      expect(s, "emph 가져오기").toMatch(/from\s*"@hav\/ui\/text\/emph"/);
      const tags = [...s.matchAll(/<EmphText\b[^>]*>/g)].map((m) => m[0]);
      expect(tags.length, "EmphText 사용").toBeGreaterThan(0);
      expect(tags.some((t) => data.test(t)), `자료(${data})로 만든 문장을 넘김`).toBe(true);
      if (bg === "sea") expect(tags.some((t) => /bg="sea"/.test(t)), "바다 띠 위").toBe(true);
      else expect(tags.some((t) => /bg="sea"/.test(t)), "하늘 종이 위").toBe(false);
    });

    it(`${label} — Title 안에 숫자를 직접 칠하는 span · 색 클래스가 없음`, () => {
      const s = read(join(ROOT, file));
      for (const block of s.match(/<Title\b[\s\S]*?<\/Title>/g) ?? []) {
        expect(block).not.toMatch(/<span\b/);
        expect(block).not.toMatch(/text-figure|text-expensive|text-sun|bg-sun|bg-\[/);
      }
    });
  }
});
