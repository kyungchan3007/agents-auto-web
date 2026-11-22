// 탑승권 바코드 · 안내판 칸 (작업 0185 · 0312 에 boarding-pass.tsx · intro-cells.tsx 에서 옮김) · 순수 함수

/** 바코드 글 → 막대 (같은 글이면 같은 막대) */
export const bars = (code: string) =>
  Array.from(code).flatMap((ch, i) => {
    const v = Number.isNaN(Number(ch)) ? ch.charCodeAt(0) % 4 : Number(ch) % 4;
    return [{ key: `b${i}`, grow: 1 + v, ink: true }, { key: `g${i}`, grow: 1 + ((v + i) % 3), ink: false }];
  });

/** 한 글자 한 칸 — 모자라면 빈 칸으로 채우고 넘치면 자름 */
export function fillCells(text: string, cols: number): string[] {
  const chars = Array.from(text).slice(0, cols);
  return [...chars, ...Array.from({ length: cols - chars.length }, () => " ")];
}
