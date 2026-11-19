// 작업 0227 — 직구 계산 결과가 굴러가는 숫자 부품을 쓰는지 소스 검사 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   계산하는 곳 세 군데 — 큰 금액(slot big) · 막대 아래 $ 금액(usd) · 내역 금액(price · taxable · duty · vat · total)
//   기존 화면 요소는 그대로(빼는 것 없음) — 도장 · 막대 · 내역 줄 이름 · 안내 글
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (p: string) => readFileSync(new URL(p, import.meta.url), "utf8");
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const result = () => read("../features/import-calc/components/calc-result.tsx");

describe("calc-result — 굴러가는 숫자", () => {
  it("공용 부품 RollingNumber 를 가져옴(packages/ui)", () => {
    expect(code(result())).toMatch(/import \{ RollingNumber \} from "@hav\/ui\/motion\/rolling-number"/);
  });
  it("자리 일곱 곳 slot — big · usd · price · taxable · duty · vat · total", () => {
    for (const slot of ["big", "usd", "price", "taxable", "duty", "vat", "total"]) expect(code(result()), slot).toMatch(new RegExp(`slot=["{]+${slot}`));
  });
  it("계산 결과는 카운트업하지 않음(CountUp 아님) · 단위 '원'은 부품 suffix 로", () => {
    expect(code(result())).not.toMatch(/<CountUp/);
    expect(code(result())).toMatch(/suffix="원"/);
  });
  it("기존 요소 그대로 — 데이터 id · 줄 이름 · 안내 글 · 도장", () => {
    const s = result();
    for (const t of ["calc-result", "calc-tag-top", "calc-limit-bar", "calc-limit-fill", "calc-tag-bottom"]) expect(s, t).toContain(t);
    for (const t of ["물건 값 (원화)", "과세 가격 (물건 값 + 국제 배송비)", "부가세 10% ((과세 가격 + 관세) × 10%)", "적용 환율", "모두 합쳐 예상", "예상 금액입니다. 실제 세금은 통관 때 정해집니다.", "— 한도 안이라 계산 안 함", "— 관세율을 넣으면 계산", "물건 값을 넣으면 면세 한도 안인지 바로 보여 드립니다"]) expect(s, t).toContain(t);
    expect(s).toContain("Stamp");
  });
});
