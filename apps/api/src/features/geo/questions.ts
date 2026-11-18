// AI 답변 인용 측정 질문 — 번호는 저장 키라 바꾸지 않음 · 질문을 바꾸면 새 번호를 쓴다 (예전 기록과 섞이지 않게 · 작업 0139)
//   1판: 2026-11-05 ~ 11-16 (docs/geo-measurement.md 기준선) · 2판: 2026-11-17 측정부터 (작업 0183)
//   3판: 2026-11-18 측정부터 (작업 0196 · #215) — 사이트 이름이 Flapfx 로 바뀌어(#208 · #228) 브랜드 질문 8개만 새 번호(b14 ~ b21)로 바꿈. 일반 질문 16개는 그대로 두어 이름 · 주소 말고는 비교가 이어짐
//   2판은 기준 질문 6개(b1 · b2 · b3 · g1 · g2 · g7)를 그대로 두어 1판과 이어서 비교하고,
//   나머지 18개는 사이트 페이지가 실제로 답하는 좁은 질문으로 바꿈 (여행 타이밍 · 이번 주 가장 싼 도착지 · 과세환율 · 수입물가 · 최근 90일 위치 · 한국 100 기준 물가)

export type Question = { id: string; group: "brand" | "general"; text: string };

/** 지금 측정하는 질문 24개 (3판 · 브랜드 8 · 일반 16) */
export const QUESTIONS: Question[] = [
  { id: "b14", group: "brand", text: "Flapfx" },
  { id: "b15", group: "brand", text: "flapfx.com" },
  { id: "b16", group: "brand", text: "Flapfx 환율" },
  { id: "b17", group: "brand", text: "Flapfx 여행 타이밍" },
  { id: "b18", group: "brand", text: "Flapfx 국제항공료 지수" },
  { id: "b19", group: "brand", text: "Flapfx 과세환율 직구 계산" },
  { id: "b20", group: "brand", text: "Flapfx 이번 주 가장 싸게 갈 수 있는 곳" },
  { id: "b21", group: "brand", text: "Flapfx AI 에이전트가 만든 환율 사이트" },
  { id: "g1", group: "general", text: "오늘 달러 환율 싼 편인가요" },
  { id: "g2", group: "general", text: "지금 환전해도 될까 달러 최근 90일" },
  { id: "g7", group: "general", text: "해외직구 관세 계산기" },
  { id: "g17", group: "general", text: "해외여행 항공권 가장 싼 달 국제항공료 물가지수" },
  { id: "g18", group: "general", text: "국제항공료 소비자물가지수 월별 추이" },
  { id: "g19", group: "general", text: "해외단체여행비 물가지수 작년 대비" },
  { id: "g20", group: "general", text: "이번 주 환율 기준 가장 싸게 갈 수 있는 여행지" },
  { id: "g21", group: "general", text: "관세청 과세환율 이번 주 달러" },
  { id: "g22", group: "general", text: "과세환율 매매기준율 차이 직구 세금" },
  { id: "g23", group: "general", text: "수입물가지수 원달러 환율 같이 보기" },
  { id: "g24", group: "general", text: "엔화 100엔 환율 최근 90일 중 낮은 편인지" },
  { id: "g25", group: "general", text: "유로 환율 최근 90일 최저 여행 환전" },
  { id: "g26", group: "general", text: "환율 지금 싼지 최근 90일 백분위로 판단" },
  { id: "g27", group: "general", text: "여행 갈 나라 물가 한국 100 기준 비교" },
  { id: "g28", group: "general", text: "베트남 여행 물가 한국보다 싼가 환율" },
  { id: "g29", group: "general", text: "11월 해외여행 항공료 싼 시기" },
];

/** 지금은 측정하지 않는 질문 — 1 · 2판(2026-11-05 ~ 11-17, 사이트 이름 Tripfx 시기)에 쓴 것이라 예전 기록을 그때 문구로 읽을 때 씀 */
export const RETIRED_QUESTIONS: Question[] = [
  { id: "b1", group: "brand", text: "Tripfx" },
  { id: "b2", group: "brand", text: "tripfx.pages.dev" },
  { id: "b3", group: "brand", text: "Tripfx 환율" },
  { id: "b9", group: "brand", text: "Tripfx 여행 타이밍" },
  { id: "b10", group: "brand", text: "Tripfx 국제항공료 지수" },
  { id: "b11", group: "brand", text: "Tripfx 과세환율 직구 계산" },
  { id: "b12", group: "brand", text: "Tripfx 이번 주 가장 싸게 갈 수 있는 곳" },
  { id: "b13", group: "brand", text: "Tripfx AI 에이전트가 만든 환율 사이트" },
  { id: "b4", group: "brand", text: "Tripfx 환율 사이트" },
  { id: "b5", group: "brand", text: "Tripfx 직구 계산기" },
  { id: "b6", group: "brand", text: "Tripfx 여행 물가" },
  { id: "b7", group: "brand", text: "Tripfx 달러 환율 오늘" },
  { id: "b8", group: "brand", text: "Tripfx 어떤 사이트" },
  { id: "g3", group: "general", text: "엔화 환율 지금 싼 편인지 확인" },
  { id: "g4", group: "general", text: "유로 환율 최근 1년 흐름" },
  { id: "g5", group: "general", text: "한국수출입은행 매매기준율 오늘 환율 조회" },
  { id: "g6", group: "general", text: "환율 계산기 원화 달러" },
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

const ALL = [...QUESTIONS, ...RETIRED_QUESTIONS];

/** 질문 번호 → 질문 · 목록 안 순서(order) — 1판에서 뺀 질문도 찾음 (지금 목록 뒤 순서) */
export function questionOf(id: string): (Question & { order: number }) | null {
  const order = ALL.findIndex((q) => q.id === id);
  return order < 0 ? null : { ...ALL[order], order };
}

/** 그 질문을 처음 쓴 판 — 1판: b1 ~ b8 · g1 ~ g16 · 2판: b9 ~ b13 · g17 ~ g29 · 3판: b14 ~ b21 (위 머리말 · 질문 번호는 저장 키라 바뀌지 않음 · 작업 0205) */
export function editionOfQuestion(id: string): 1 | 2 | 3 {
  const n = Number(id.slice(1));
  if (id.startsWith("b")) return n >= 14 ? 3 : n >= 9 ? 2 : 1;
  return n >= 17 ? 2 : 1;
}
