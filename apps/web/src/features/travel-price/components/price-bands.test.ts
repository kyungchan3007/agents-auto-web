// 작업 0178 — "나라 더 보기" 버튼이 펼쳐지지 않던 버그 (onClick={() => toggle} 은 함수를 부르지 않음)
// 컴포넌트 클릭 테스트 도구가 없어 소스로 확인 · 같은 실수가 다른 화면에 생기지 않게 전체 tsx 도 검사
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = resolve(__dirname, "../../..");
const tsx = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = join(dir, d.name);
    if (d.isDirectory()) return d.name === "node_modules" ? [] : tsx(p);
    return d.name.endsWith(".tsx") ? [p] : [];
  });
// () => 이름  처럼 부르지 않고 돌려주기만 하는 이벤트 핸들러
const UNCALLED = /on[A-Z]\w*=\{\s*\(\s*\)\s*=>\s*[A-Za-z_$][\w$.]*\s*\}/;

describe("나라 더 보기 버튼", () => {
  it("버튼이 toggle 을 실제로 부름", () => {
    const src = readFileSync(join(SRC, "features/travel-price/components/price-bands.tsx"), "utf8");
    expect(src).not.toMatch(UNCALLED);
    expect(src).toMatch(/onClick=\{\s*toggle\s*\}|onClick=\{\s*\(\)\s*=>\s*toggle\(\)\s*\}/);
  });

  it("모든 화면에 부르지 않는 이벤트 핸들러가 없음", () => {
    const bad = tsx(SRC).filter((f) => UNCALLED.test(readFileSync(f, "utf8")));
    expect(bad.map((f) => f.slice(SRC.length + 1))).toEqual([]);
  });
});
