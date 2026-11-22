// 숫자 칸 글을 큰 글자 · 작은 글자로 나눔 (작업 0303 · 0312 에 상태판 · GEO 요약의 같은 함수를 모음) · 순수 함수

/** "536회" → 536 · 회 / "0 / 24 질문" → 0 · "/ 24 질문" / "측정 전" → 그대로 */
export function splitNumber(v: string): { big: string; rest: string } {
  const m = /^([\d,.]+)\s*(.*)$/.exec(v);
  return m ? { big: m[1] ?? v, rest: m[2] ?? "" } : { big: v, rest: "" };
}

/** "11-20 12:00 성공 · 공식 22개" → 시각 · 나머지 */
export function splitTime(text: string): { big: string; rest: string } {
  const m = /^((?:\d\d-\d\d )?\d\d:\d\d)\s*(.*)$/.exec(text);
  return m ? { big: m[1] ?? text, rest: m[2] ?? "" } : { big: text, rest: "" };
}
