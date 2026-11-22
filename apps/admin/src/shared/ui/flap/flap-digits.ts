// 안내판 숫자 계산 (작업 0303 · 0312 에 flap.tsx 에서 옮김) · 순수 함수
const DIGITS = "0123456789";

export const isDigit = (c: string) => /[0-9]/.test(c);

/** 글자 칸마다 멈출 때 — 왼쪽부터 차례로 · 판 순서(order)만큼 늦게 */
export const stopTick = (k: number, order: number) => 6 + k * 2 + order * 3;

/** t 번째에 보일 숫자 — 멈출 때 최종 값이 되도록 거꾸로 셈 */
export const spinDigit = (fin: string, stop: number, t: number) => DIGITS[(Number(fin) + stop - t) % 10] ?? fin;

/** 칸 너비 — 띄어쓰기는 좁게 · 숫자는 같은 너비 */
export const cellStyle = (c: string) => (c === " " ? { width: "0.35em" } : { minWidth: isDigit(c) ? "0.6em" : undefined });
