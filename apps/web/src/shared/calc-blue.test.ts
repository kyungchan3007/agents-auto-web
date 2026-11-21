// 작업 0221 사용자 결정 — 직구 계산 머리를 파랑 면으로 ("직구 계산도 hero 쪽에 파란색으로" → 시안 .tmp/redesign-1118/C/calc-blue.html · "파랑으로") (테스트 먼저 · 구현 전에는 FAIL 이 정상)
// 메뉴부터 제목 · 설명까지 파랑 면(메뉴와 한 면 · 홈 · 여행 물가와 같은 방식 · 같은 토큰 bg-pin-cheap) · 제목 흰 글자 · 금액 노랑 · 설명 옅은 흰 글자 · 라벨도 파랑 면 위 색
// 입력 카드 · 결과 꼬리표가 파랑 면과 흰 면 경계에 걸침(그리드 첫 줄만 파랑 · 카드는 위로 끌어올림) · 흰 카드는 그림자로 구분 · 제목 아래 세 줄 자리(0208 크기 고정)는 그대로 파랑 면 안
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const WEB_SRC = resolve(__dirname, "..");
const page = readFileSync(join(WEB_SRC, "features/import-calc/components/calc-page.tsx"), "utf8");
const form = readFileSync(join(WEB_SRC, "features/import-calc/components/calc-form.tsx"), "utf8");
const code = (s: string) => s.replace(/\{\/\*[\s\S]*?\*\/\}/g, "").replace(/^\s*\/\/.*$/gm, "");

describe("직구 계산 — 파랑 첫 면", () => {
  it("파랑 띠는 그리드 첫 줄 전체 폭(bg-pin-cheap · col-span-3 · row-start-1) · 장식 표시 aria-hidden · data-testid=calc-band @design", () => {
    const m = /<div[^>]*data-testid="calc-band"[^>]*>/.exec(page)?.[0] ?? "";
    expect(m, "calc-band").not.toBe("");
    expect(m).toMatch(/aria-hidden/);
    expect(m).toMatch(/bg-pin-cheap/);
    expect(m).toMatch(/col-span-3/);
    expect(m).toMatch(/row-start-1/);
  });

  it("머리는 data-surface=\"dark\" 안(밝은 글자 토큰) · 큰 제목은 text-cheap 이 아님 · 금액은 bg=\"sea\"(노랑) · 설명은 text-fg-2 @design", () => {
    const c = code(page);
    expect(c).toMatch(/data-surface="dark"/);
    expect(c).not.toMatch(/<Title[^>]*text-cheap/);
    expect(c).toMatch(/<EmphText[^>]*bg="sea"/);
    expect(c).toMatch(/<p[^>]*text-fg-2[^>]*>물건 값을 넣으면/);
  });

  it("카드 줄은 파랑 띠 아래 둘째 줄에서 위로 끌어올려 경계에 걸침(-mt-) · 위에 보이게(relative z-10) @design", () => {
    const m = /<div[^>]*row-start-2[^>]*>/.exec(page)?.[0] ?? "";
    expect(m, "카드 줄").not.toBe("");
    expect(m).toMatch(/-mt-/);
    expect(m).toMatch(/relative z-10/);
  });

  it("제목 + 설명 덩어리의 자리(0208 크기 고정)는 640 이상만 min-h 계산식 유지 · 639 이하(휴대폰)는 미리 잡지 않음(작업 0245)", () => {
    const c = code(page);
    expect(c).toMatch(/sm:min-h-\[calc\(2\.68\*clamp\(2\.25rem,4\.5vw,3\.5rem\)/);
    expect(c).toMatch(/md:min-h-\[calc\(1\.34\*clamp\(2\.25rem,4\.5vw,3\.5rem\)/);
    expect(c, "휴대폰 기본 min-h 없음").not.toMatch(/(?<![:\w-])min-h-\[calc\(4\.02\*/);
    expect(c, "휴대폰 아래 여백 12.875rem").toMatch(/pb-\[12\.875rem\]/);
  });

  it("흰 카드(입력 · 결과)는 파랑 면 위에서 그림자 토큰으로 구분 · 휴대폰 요약 줄은 파랑 면 위에서도 보이게 가장자리 선(ring) @design", () => {
    expect(form).toMatch(/data-testid="calc-input"[^>]*shadow-(ticket|panel|pass)/);
    expect(readFileSync(join(WEB_SRC, "features/import-calc/components/calc-result.tsx"), "utf8")).toMatch(/data-testid="calc-result"[^>]*shadow-(ticket|panel|pass)/);
    expect(/<p[^>]*data-testid="calc-summary"[^>]*>/.exec(form)?.[0] ?? "").toMatch(/\bring-1\b/);
  });

  it("영문 라벨 없음 (사진 없음은 작업 0222 의 no-photos.test.ts 가 검사)", () => {
    expect(page).not.toMatch(/CUSTOMS|ITEM/);
  });
});
