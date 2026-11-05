// 한국 시각 — zod 를 쓰지 않아 Pages 함수 묶음에도 가볍게 들어감
const KST_MS = 9 * 3600_000;

/** 한국 시각으로 옮긴 Date — getUTC* 로 한국 날짜 · 시각을 읽음 */
export function kstNow(now: Date = new Date()): Date {
  return new Date(now.getTime() + KST_MS);
}

/** 한국 날짜 (YYYY-MM-DD · KST = UTC+9) */
export function kstDate(now: Date = new Date()): string {
  return kstNow(now).toISOString().slice(0, 10);
}
