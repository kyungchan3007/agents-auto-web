// 검색 노출 판 숫자 칸 (작업 0312 에 geo-detail.tsx 에서 옮김) · 순수 함수
export const searchStats = (s: { impressions: string; clicks: string; position: string }) => [
  { label: "노출", value: s.impressions },
  { label: "클릭", value: s.clicks },
  { label: "평균 순위", value: s.position },
];
