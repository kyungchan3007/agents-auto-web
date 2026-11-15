// 소개 기준 카드 6개 (작업 0170 · Figma 08) — 글은 시안처럼 한 줄 (자세한 규칙은 각 화면 · docs/domain) — 판정 설명은 사이트 신호 규칙(최근 90일 백분위 · SIG-05)
export const ABOUT_CARDS: readonly { id: string; title: string; body: string }[] = [
  { id: "rate", title: "환율", body: "한국수출입은행 매매기준율, 평일 12시. 실패하면 13:30 · 15:00 다시." },
  { id: "signal", title: "싼 편 · 비싼 편 신호", body: "최근 90일 중 오늘 값의 위치로 판정. 쌈 · 보통 · 비쌈." },
  { id: "prices", title: "여행 물가", body: "세계은행 나라별 물가 수준, 한국 = 100." },
  { id: "import", title: "직구 계산", body: "면세 한도 미국 목록 통관 $200 · 그 밖 $150, 관세청 과세환율." },
  { id: "visits", title: "방문 통계", body: "쿠키 없는 방문 수만." },
  { id: "maker", title: "누가 만드나요", body: "사람 한 명과 AI 에이전트 팀. 과정은 작업실에 공개." },
];
