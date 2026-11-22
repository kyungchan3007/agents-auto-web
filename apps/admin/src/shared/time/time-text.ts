// 어드민 시각 문구 — 한국 시간 (작업 0105 · 0170 · 0303 · 0312 에 작업실 곳곳의 같은 함수를 모음) · 순수 함수
const parts = (iso: string, o: Intl.DateTimeFormatOptions) =>
  Object.fromEntries(new Intl.DateTimeFormat("ko-KR", { ...o, hour12: false, timeZone: "Asia/Seoul" }).formatToParts(new Date(iso)).map((x) => [x.type, x.value]));

/** "11-15 02:07" (숫자 칸 · 기록 줄) */
export function kstStamp(iso: string): string {
  const p = parts(iso, { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  return `${p.month}-${p.day} ${p.hour === "24" ? "00" : p.hour}:${p.minute}`;
}

/** "10월 30일 14:39" (문장) */
export function kstDateTimeText(iso: string): string {
  const p = parts(iso, { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
  return `${p.month}월 ${p.day}일 ${p.hour}:${p.minute}`;
}

/** "14:39" */
export const kstHourMinute = (iso: string) => new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Seoul" }).format(new Date(iso));

/** 지금과의 차이 → "방금" · "12분 전" · "6시간 전" · "2일 전" */
export function agoText(ms: number): string {
  const m = Math.round(ms / 60000);
  if (m < 1) return "방금";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}시간 전` : `${Math.floor(h / 24)}일 전`;
}

/** 남은 초 → "4:05" */
export const countdownText = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
