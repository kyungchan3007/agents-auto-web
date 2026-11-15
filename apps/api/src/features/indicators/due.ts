// 월간 지표(KOSIS · ECOS)를 "지금 채울 때인지" 판단 — 순수 함수 (작업 0171)
//   지금은 매달 1일 회차에서만 받아 키를 넣은 직후부터 다음 달 1일까지 비어 있었음 → 평일 회차에서 비었거나 발표된 달보다 오래됐으면 채움
/** KOSIS: 2026-11-03 에 10월 자료가 올라옴 · 여유 두 날 (0164 plan) */
export const KOSIS_PUBLISH_DAY = 5;
/** ECOS: 다음 달 15일경 발표 · 여유 두 날 (0165 plan) */
export const ECOS_PUBLISH_DAY = 17;

const monthIndex = (ym: string) => Number(ym.slice(0, 4)) * 12 + Number(ym.slice(5, 7)) - 1;

/**
 * 기대하는 최신 달 = today 의 일이 publishDay 이상이면 지난달, 아니면 지지난달 (연도 넘어감 포함)
 * latest(저장된 최신 달 YYYY-MM)가 null · 읽을 수 없는 글 · 기대 달보다 앞이면 true · 같거나 뒤면 false (뒤인 값이 와도 다시 받지 않음)
 */
export function monthlyDue(latest: string | null, today: string, publishDay: number): boolean {
  if (!latest || !/^\d{4}-(0[1-9]|1[0-2])$/.test(latest)) return true;
  const expected = monthIndex(today) - (Number(today.slice(8, 10)) >= publishDay ? 1 : 2);
  return monthIndex(latest) < expected;
}
