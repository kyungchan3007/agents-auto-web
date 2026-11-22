// 굴러가는 숫자 계산 (순수 함수) — 작업 0227 · 시안 .tmp/motion-1119/roll/index.html 과 같은 값
//   칸 나누기 · 화면 읽기용 글 · 자리마다 늦춤 · 한 자리가 굴러갈 칸 수 · 굴러가는 시간
export type RollCell = { kind: "digit" | "comma"; digit?: number; place?: number };

const group = (s: string) => s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/** 왼쪽 → 오른쪽 칸 — 반올림한 정수의 자리 · 세 자리마다 쉼표 · place 0 = 일의 자리 */
export function rollCells(n: number): RollCell[] {
  const s = String(Math.max(0, Math.round(n)));
  const out: RollCell[] = [];
  for (let i = 0; i < s.length; i++) {
    const place = s.length - 1 - i;
    out.push({ kind: "digit", digit: Number(s[i]), place });
    if (place > 0 && place % 3 === 0) out.push({ kind: "comma" });
  }
  return out;
}

/** 화면 읽기용 최종 글 — 242136,"원" → "242,136원" · 값이 없으면 "—" 하나 */
export function rollText(n: number | null, suffix = "", prefix = ""): string {
  if (n === null) return "—";
  return `${prefix}${group(String(Math.max(0, Math.round(n))))}${suffix}`;
}

/** 자리마다 55ms 씩 늦게 출발 (일의 자리 0) */
export const rollDelayMs = (place: number) => place * 55;

/** 한 자리 숫자(0~9) 사이에 굴러갈 칸 수 — 커지는 쪽(1)은 0~9 · 작아지는 쪽(-1)은 -0~-9 */
export function rollSteps(from: number, to: number, dir: 1 | -1): number {
  return dir > 0 ? (to - from + 10) % 10 : -((from - to + 10) % 10) || 0;
}

/** 굴러가는 시간 — 520ms + 칸당 42ms · 1150ms 를 넘지 않음 */
export const rollDurationMs = (steps: number) => Math.min(1150, 520 + Math.abs(steps) * 42);

/** 띠 길이 = 0~9 다섯 벌 · 가운데 벌(MID)에서 시작해 여유를 둠 (작업 0312 에 rolling-number.tsx 에서 옮김) */
export const ROLL_REPS = 5;
export const ROLL_MID = 20;
/** 띠 자기 높이의 비율 — 칸 높이가 em · rem 어느 쪽이어도 같음 */
export const rollShift = (pos: number) => `translateY(${((-pos / (ROLL_REPS * 10)) * 100).toFixed(4)}%)`;
/** 띠의 숫자 줄 */
export const rollRows = () => Array.from({ length: ROLL_REPS * 10 }, (_, k) => k % 10);

/** 이전 값에서 굴러 시작할 때 — 자리마다 이전 숫자(없던 자리는 0) · 방향 · 같은 값이면 쓰지 않음 */
export function rollFrom(rounded: number, from: number | null) {
  const fromRounded = from !== null && Number.isFinite(from) ? Math.max(0, Math.round(from)) : null;
  const useFrom = fromRounded !== null && fromRounded !== rounded;
  const byPlace = new Map(useFrom ? rollCells(fromRounded).flatMap((c) => (c.kind === "digit" ? [[c.place ?? 0, c.digit ?? 0] as const] : [])) : []);
  const dir: 1 | -1 = useFrom && fromRounded !== null && rounded < fromRounded ? -1 : 1;
  return { useFrom, dir, digitAt: (place: number) => (useFrom ? (byPlace.get(place) ?? 0) : null) };
}

/** 글자판 모양에서 앞을 채울 빈 칸 수 */
export const padCols = (cols: number, cellCount: number, hasSuffix: boolean) => Math.max(0, cols - cellCount - (hasSuffix ? 1 : 0));

/** 화면 값 — 음수는 0 · 정수 */
export const rollValue = (value: number) => Math.max(0, Math.round(value));
