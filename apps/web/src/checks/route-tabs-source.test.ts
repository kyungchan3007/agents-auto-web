// 작업 0360 — "많이 가는 곳" 탭의 나라 구성은 공식 출국 통계 출처가 규칙 문서에 있고 코드의 순위와 같음 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   요구(request.md): geo 가 한국관광공사 · 법무부 등 공식 자료에서 순위를 확인해 출처 주소 · 확인한 날과 함께 docs/domain/travel-price.md 에 적는다 · 출처를 확인하지 못하면 이 탭은 뺀다
//   문서(8add3f49): 한국관광공사 한국관광 데이터랩 · 2025년 1~12월 합계 · 일본 · 베트남 · 미국 · 태국 · 필리핀 · 대만 · 그다음 홍콩 · 싱가포르 · 마카오 · 인도네시아
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { POPULAR_RANKING } from "@hav/shared/route-tabs";
import { TRAVEL_COUNTRIES } from "@hav/shared/travel";
import { describe, expect, it } from "vitest";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../..");
const doc = readFileSync(join(ROOT, "docs/domain/travel-price.md"), "utf8");
const section = doc.slice(doc.indexOf("## 한국인이 많이 가는 나라"));

describe("많이 가는 곳 출처 기록 (작업 0360)", () => {
  it("규칙 문서 — 출처 기관 · 주소 · 기준 기간 · 확인한 날", () => {
    for (const s of ["한국관광공사", "https://datalab.visitkorea.or.kr/", "2025년", "2026-11-25"]) expect(section, s).toContain(s);
  });

  it("코드의 순위(POPULAR_RANKING) = 문서의 순위표(1~6위) 순서 + '그다음' 줄 순서", () => {
    const table = [...section.matchAll(/^\| (\d+) \| ([^|]+?) \|/gm)].map((m) => m[2].trim());
    const next = (section.match(/그다음: (.+)/)?.[1] ?? "").split(" · ").map((x) => x.replace(/\s*[\d,]+\s*$/, "").trim());
    const names = [...table, ...next];
    expect(table).toHaveLength(6);
    expect(POPULAR_RANKING.map((c) => TRAVEL_COUNTRIES[c]?.name)).toEqual(names);
  });

  it("긴 줄표 없이 쓴 구역 (사이트 글쓰기 규칙 — 새로 쓴 구역만)", () => {
    expect(section.length).toBeGreaterThan(100);
    expect(section.slice(0, section.indexOf("\n## ", 5) > 0 ? section.indexOf("\n## ", 5) : undefined)).not.toContain("—");
  });
});
