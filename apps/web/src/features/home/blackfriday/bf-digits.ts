// 블프 입력칸 숫자만 (작업 0385) — 반각 0-9 외 글자(문자 · 기호 · 한글 · 소수점 · 쉼표 · - · $ · 공백 · 전각 숫자)는 모두 버림
export const digitsOnly = (s: string): string => s.replace(/[^0-9]/g, "");
