// 블랙프라이데이 hero 문구 (작업 0381) — 사용자가 정한 글 그대로 · "$200" 은 직구 계산기 rules 의 미국 한도에서(IMP-03 · 값이 바뀌면 문구도 따라감) · 긴 줄표 없음
import { DUTY_FREE_USD } from "@/shared/customs/rules";

const LIMIT = `$${DUTY_FREE_USD["us-list"]}`;

export const BF_COPY = {
  label: "블랙프라이데이 11.27 · 사이버먼데이 11.30",
  accent: LIMIT,
  titleLines: [`${LIMIT} 넘기 전에`, "먼저 계산하세요."],
  lede: `미국 직구는 ${LIMIT}까지 면세입니다.`,
  tag: "관세청 · 목록통관 기준",
  note: "같은 판매자에게 같은 날 산 물건은 합쳐서 봅니다 · 예상 금액",
  receiptNote: "예상 금액 · 실제 세액은 관세청 기준",
  brand: "FLAPFX DIRECT",
  sub: "해외 직구 · 장바구니 확인",
} as const;
