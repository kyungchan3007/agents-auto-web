// 작업 0350 — 규칙 먼저: 합산과세 출처가 규칙 문서 · rules.ts 주석에 적혀 있음 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   요구(request.md): docs/domain/import-calc.md 에 출처 주소 · 확인한 날과 함께 적고, rules.ts 주석 형식 그대로 적는다 · 새 계산 규칙은 만들지 않음 (목록통관 배제 제69조 ① 1호는 안내 한 줄까지만)
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../..");
const doc = readFileSync(join(ROOT, "docs/domain/import-calc.md"), "utf8");
const rules = readFileSync(join(ROOT, "apps/web/src/features/import-calc/calculator/rules.ts"), "utf8");

describe("합산과세 출처 기록 (제68조)", () => {
  it("규칙 문서 — 고시 이름 · 제68조 · 고시 번호 · 출처 주소 · 확인한 날", () => {
    for (const s of ["수입통관 사무처리에 관한 고시", "제68조", "합산과세", "2025-66", "https://www.law.go.kr/", "2026-11-25"]) expect(doc, s).toContain(s);
  });

  it("규칙 문서 — 1호(선하증권 · 항공화물운송장) · 3호(같은 해외공급자 · 같은 날짜) 원문 요지 · 2호는 삭제됨", () => {
    for (const s of ["선하증권", "항공화물운송장", "같은 해외공급자", "같은 날짜", "삭제"]) expect(doc, s).toContain(s);
  });

  it("rules.ts 주석 — 같은 출처 · 확인한 날 (기준값은 이 파일 한 곳 · IMP-03)", () => {
    for (const s of ["제68조", "2026-11-25", "https://www.law.go.kr/"]) expect(rules, s).toContain(s);
  });

  it("목록통관 배제(제69조 ① 1호)는 계산 규칙이 아님 — rules.ts 에 새 한도 값을 만들지 않음(200 · 150 만)", () => {
    expect(rules).toMatch(/"us-list": 200, other: 150/);
  });

  it("긴 줄표 없이 쓴 규칙 문서 구역 (사이트 글쓰기 규칙 — 새로 쓴 합산과세 구역만)", () => {
    const i = doc.indexOf("합산과세");
    expect(i).toBeGreaterThanOrEqual(0);
    expect(doc.slice(i, i + 600)).not.toContain("—");
  });
});
