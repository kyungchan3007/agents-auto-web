// 글자로 바꾸기 — 숫자 · 변화율 · 날짜 표기를 화면과 계산이 같은 모양으로 (작업 0136)

/** 한국식 천 단위 쉼표 — 소수 자릿수는 options 로 */
export const numberText = (n: number, options?: Intl.NumberFormatOptions) => n.toLocaleString("ko-KR", options);

/** "+2.3%" · "-1.9%" — 부호 붙은 변화율 (소수 첫째 자리) */
export const signedPct = (pct: number) => `${pct > 0 ? "+" : ""}${pct.toFixed(1)}%`;

/** "2026-10-30" → "10월 30일" */
export function monthDayText(date: string): string {
  const [, m, d] = date.split("-").map(Number);
  return `${m}월 ${d}일`;
}

/** 입력 칸 글자에서 쉼표 · 빈칸 빼기 — "12,345 " → "12345" */
export const stripNumberText = (s: string) => s.replace(/[,\s]/g, "");
