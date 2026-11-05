// 기준일 — 기계도 읽게 <time> 으로 (작업 0115) · date 는 YYYY-MM-DD
export function DateText({ date }: { date: string }) {
  return <time dateTime={date}>{date}</time>;
}
