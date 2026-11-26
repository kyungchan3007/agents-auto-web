// 작업 0381 — 블프 hero 문구 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
// 요구(prd 3 · 5 · 6 · 8): 사용자가 정한 글 그대로 · "$200" 은 rules 의 미국 한도에서 (값이 바뀌면 문구도 따라감)
//
// builder 가 만들 것 — apps/web/src/features/home/blackfriday/bf-copy.ts
//   export const BF_COPY = {
//     label: "블랙프라이데이 11.27 · 사이버먼데이 11.30",        // 제목 위 노란 알약
//     accent: "$200",                                            // 제목에서 노랑으로 칠하는 부분 = `$${DUTY_FREE_USD["us-list"]}`
//     titleLines: ["$200 넘기 전에", "먼저 계산하세요."],         // 줄바꿈 두 줄
//     lede: "미국 직구는 $200까지 면세입니다.",
//     tag: "관세청 · 목록통관 기준",
//     note: "같은 판매자에게 같은 날 산 물건은 합쳐서 봅니다 · 예상 금액",
//     receiptNote: "예상 금액 · 실제 세액은 관세청 기준",
//     brand: "FLAPFX DIRECT", sub: "해외 직구 · 장바구니 확인",
//   } as const
import { describe, expect, it } from "vitest";
import { DUTY_FREE_USD } from "../../import-calc/calculator/rules";
import { BF_COPY } from "./bf-copy";

describe("블프 hero 문구 — 정한 글 그대로", () => {
  it("라벨 · 제목 · 한 줄 · 꼬리표", () => {
    expect(BF_COPY.label).toBe("블랙프라이데이 11.27 · 사이버먼데이 11.30");
    expect(BF_COPY.titleLines).toEqual(["$200 넘기 전에", "먼저 계산하세요."]);
    expect(BF_COPY.lede).toBe("미국 직구는 $200까지 면세입니다.");
    expect(BF_COPY.tag).toBe("관세청 · 목록통관 기준");
  });

  it("아래 작은 글 · 영수증 맨 아래 글", () => {
    expect(BF_COPY.note).toBe("같은 판매자에게 같은 날 산 물건은 합쳐서 봅니다 · 예상 금액");
    expect(BF_COPY.receiptNote).toBe("예상 금액 · 실제 세액은 관세청 기준");
  });

  it("영수증 머리 글", () => {
    expect(BF_COPY.brand).toBe("FLAPFX DIRECT");
    expect(BF_COPY.sub).toBe("해외 직구 · 장바구니 확인");
  });

  it("$200 은 rules 의 미국 한도와 같은 값 (IMP-03 · 한 곳)", () => {
    const limit = `$${DUTY_FREE_USD["us-list"]}`;
    expect(BF_COPY.accent).toBe(limit);
    expect(BF_COPY.titleLines[0].startsWith(limit)).toBe(true);
    expect(BF_COPY.lede).toContain(`${limit}까지`);
  });

  it("긴 줄표(—)를 쓰지 않음 (사이트 글쓰기 규칙: 쉼표 · 가운뎃점)", () => {
    const all = [BF_COPY.label, ...BF_COPY.titleLines, BF_COPY.lede, BF_COPY.tag, BF_COPY.note, BF_COPY.receiptNote, BF_COPY.brand, BF_COPY.sub].join(" ");
    expect(all).not.toMatch(/[—–]/);
  });
});
