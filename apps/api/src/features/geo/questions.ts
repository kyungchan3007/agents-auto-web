// AI 답변 인용 측정 질문 — 2026-11-05 기준선(docs/geo-measurement.md)과 같은 24개 · 번호는 저장 키라 바꾸지 않음 (작업 0139)
//   질문을 바꾸면 새 번호를 쓴다 (예전 기록과 섞이지 않게)

export type Question = { id: string; group: "brand" | "general"; text: string };

export const QUESTIONS: Question[] = [
  { id: "b1", group: "brand", text: "Tripfx" },
  { id: "b2", group: "brand", text: "tripfx.pages.dev" },
  { id: "b3", group: "brand", text: "Tripfx 환율" },
  { id: "b4", group: "brand", text: "Tripfx 환율 사이트" },
  { id: "b5", group: "brand", text: "Tripfx 직구 계산기" },
  { id: "b6", group: "brand", text: "Tripfx 여행 물가" },
  { id: "b7", group: "brand", text: "Tripfx 달러 환율 오늘" },
  { id: "b8", group: "brand", text: "Tripfx 어떤 사이트" },
  { id: "g1", group: "general", text: "오늘 달러 환율 싼 편인가요" },
  { id: "g2", group: "general", text: "지금 환전해도 될까 달러 최근 90일" },
  { id: "g3", group: "general", text: "엔화 환율 지금 싼 편인지 확인" },
  { id: "g4", group: "general", text: "유로 환율 최근 1년 흐름" },
  { id: "g5", group: "general", text: "한국수출입은행 매매기준율 오늘 환율 조회" },
  { id: "g6", group: "general", text: "환율 계산기 원화 달러" },
  { id: "g7", group: "general", text: "해외직구 관세 계산기" },
  { id: "g8", group: "general", text: "미국 직구 목록통관 면세 한도 200달러" },
  { id: "g9", group: "general", text: "해외직구 150달러 넘으면 세금 얼마" },
  { id: "g10", group: "general", text: "한국 대비 일본 물가 수준" },
  { id: "g11", group: "general", text: "나라별 물가 한국 비교 여행" },
  { id: "g12", group: "general", text: "태국 여행 경비 하루 예산 물가" },
  { id: "g13", group: "general", text: "물가 싼 여행지 환율 같이 비교" },
  { id: "g14", group: "general", text: "세계은행 구매력 평가 나라별 물가 한국 기준" },
  { id: "g15", group: "general", text: "여행 환전 타이밍 언제가 좋을까" },
  { id: "g16", group: "general", text: "직구 타이밍 환율 언제 살까" },
];

export const questionText = (id: string) => QUESTIONS.find((q) => q.id === id)?.text ?? null;
