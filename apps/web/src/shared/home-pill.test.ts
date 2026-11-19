// 작업 0228 — 홈 요약 알약 소스 검사 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   파일: apps/web/src/features/home/components/destinations-pill.tsx (새) · destination-table.tsx 가 씀
//   표시 계약(e2e/home-pill.spec.ts 맨 위 주석)의 testid 와 움직임 방식(웹 애니메이션 · 움직임 줄이기)을 소스에서 확인
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (p: string) => readFileSync(new URL(p, import.meta.url), "utf8");
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const pill = () => read("../features/home/components/destinations-pill.tsx");
const table = () => read("../features/home/components/destination-table.tsx");

describe("destinations-pill — 알약 부품", () => {
  it("export · 알약 글은 pillText 로 · M 은 cheapDestinationCount", () => {
    expect(code(pill())).toMatch(/export function DestinationsPill\(/);
    expect(code(pill() + table())).toMatch(/pillText\(/);
    expect(code(pill() + table())).toMatch(/cheapDestinationCount\(/);
  });
  it("표시 계약 testid", () => {
    for (const id of ["dest-pill", "dest-pill-flag", "dest-pill-text"]) expect(pill(), id).toContain(id);
    expect(table() + pill()).toContain("data-state");
  });
  it("움직임 줄이기 · 서버 첫 그림은 펼친 최종 모양 · 타이머로 값을 바꾸지 않음", () => {
    const s = code(pill() + table() + read("../features/home/hooks/use-destinations-pill.ts"));
    expect(s).toMatch(/useReducedMotion|prefers-reduced-motion/);
    expect(s).not.toMatch(/setInterval/);
  });
  it("기존 줄 요소 그대로 — dest-list · dest-row · dest-rate · dest-dot · dest-status · dest-flag · dest-city", () => {
    for (const id of ["dest-list", "dest-row", "dest-rate", "dest-dot", "dest-status", "dest-flag", "dest-city", "dest-scale"]) expect(table(), id).toContain(id);
  });
});
