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
