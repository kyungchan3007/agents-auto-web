// 작업 0220 사용자 지적 — 여행 물가 머리 제목 세 줄 (시안 B/shots/prices-1280.png) · 테스트 먼저
// 넓은 화면에서 제목이 왼쪽 칼럼에 묶여(글자 크기 기준 em 폭) "인도는 한국보다 / 물가가 63% / 낮습니다" 로 줄 바뀜 · 휴대폰은 제한 없음(위아래 그대로)
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const WEB_SRC = resolve(__dirname, "..");
const header = readFileSync(join(WEB_SRC, "features/travel-price/components/prices-header.tsx"), "utf8");

describe("여행 물가 제목 — 세 줄 칼럼", () => {
  it("큰 제목(h1)은 넓은 화면(lg)에서만 em 폭 제한(lg:max-w-[..em]) · 휴대폰은 제한 없음", () => {
    const h1 = /<h1[^>]*>/.exec(header)?.[0] ?? "";
    expect(h1).not.toBe("");
    expect(h1).toMatch(/lg:max-w-\[[\d.]+em\]/);
    expect(h1.replace(/lg:max-w-\[[\d.]+em\]/, "")).not.toMatch(/\bmax-w-/);
  });
});

// 작업 0220 사용자 지적 — 예산 카드 위치 · 크기 (시안 B/prices.html .budget: 폭 452px · translateY(150px) · 안쪽 여백 28 30 26 · 입력 64px · 결과 44px) · 테스트 먼저
describe("여행 물가 예산 카드 — 시안 B 위치 · 크기", () => {
  const page = readFileSync(join(WEB_SRC, "features/travel-price/components/price-page.tsx"), "utf8");
  const card = readFileSync(join(WEB_SRC, "features/travel-price/components/budget-planner.tsx"), "utf8");

  it("넓은 화면 카드: 폭 28.25rem(452px) · 아래로 내림(lg:translate-y-[150px]) · 파랑 면은 카드 원래 자리 아래 40px 까지(lg:mb-10) · 아래 구간 위쪽 여백이 내려온 만큼 늘어남", () => {
    const cell = /<div[^>]*className="[^"]*row-start-2[^"]*"[^>]*>/.exec(page)?.[0] ?? "";
    expect(cell, "카드 칸").not.toBe("");
    expect(cell).toMatch(/lg:w-\[28\.25rem\]/);
    expect(cell).toMatch(/lg:translate-y-\[150px\]/);
    expect(cell).toMatch(/lg:mb-10/);
    expect(cell).not.toMatch(/lg:row-span-2/);
    expect(page).toMatch(/lg:pt-\[calc\(150px\+/);
  });

  it("카드 안: 안쪽 여백 28 · 30 · 입력 칸 64px(h-16) · 결과 숫자 44px", () => {
    expect(card).toMatch(/lg:px-\[30px\]/);
    expect(card).toMatch(/lg:pt-7/);
    expect(card).toMatch(/lg:text-\[2\.75rem\]/);
    expect((card.match(/lg:h-16/g) ?? []).length).toBeGreaterThanOrEqual(3);
  });
});
