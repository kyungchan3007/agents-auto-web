// 쉼표 숫자 글 (작업 0324 · 0323 인스타 성과 화면 · 0324 유입 화면이 같이 씀) — 받지 못한 값(null)은 빈 글 (0 · 대시로 채우지 않음)
export const countText = (v: number | null): string => (v === null ? "" : v.toLocaleString("ko-KR"));
