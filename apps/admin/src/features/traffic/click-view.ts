// 어드민 /traffic "버튼 클릭" 표의 계산 (작업 0359) — 순수 함수 · 그리기는 click-table.tsx
// 하루 평균 = 클릭 수 ÷ (보내기 시작한 날 ~ 기간 끝 날 수) · 시작 날이 기간 끝보다 뒤면 세 칸 모두 "기록 전"(0 으로 보이지 않음)
import { CLICK_EVENTS } from "@hav/shared/click-events";
import type { ClickEvents } from "@hav/shared/ga4";
import { countText } from "@/shared/format/count-text";

export type ClickView = { name: string; label: string; page: string; countText: string; usersText: string; perDayText: string };

const BEFORE = "기록 전";
const DAY = 86400_000;
const at = (d: string) => Date.parse(`${d}T00:00:00Z`);

/** max(from, since) ~ to 양끝 포함 날 수 · since 가 to 보다 뒤면 0 */
export function clickDays(range: { from: string; to: string }, since: string): number {
  const start = since > range.from ? since : range.from;
  return start > range.to ? 0 : Math.round((at(range.to) - at(start)) / DAY) + 1;
}

/** 소수 한 자리 · 날 수가 0 이면 기록 전 */
export const perDayText = (count: number, days: number): string => (days === 0 ? BEFORE : (count / days).toFixed(1));

/** 이벤트 표 열두 개가 한 줄씩 · 보고에 없는 것은 0 번 눌림 · 많이 눌린 순(같으면 이벤트 표 순서) · 자료가 없으면 null */
export function clickViews(data: ClickEvents | null): ClickView[] | null {
  if (!data) return null;
  const days = clickDays(data, data.since);
  const rows = CLICK_EVENTS.map((e) => {
    const got = data.events.find((x) => x.name === e.name);
    return { e, count: got?.count ?? 0, users: got?.users ?? 0 };
  });
  return rows
    .map((r, i) => ({ r, i }))
    .sort((a, b) => b.r.count - a.r.count || a.i - b.i)
    .map(({ r }) => ({
      name: r.e.name,
      label: r.e.label,
      page: r.e.page,
      countText: days === 0 ? BEFORE : countText(r.count),
      usersText: days === 0 ? BEFORE : countText(r.users),
      perDayText: perDayText(r.count, days),
    }));
}

/** 표 위 한 줄 */
export const sinceText = (since: string): string => `이벤트를 보내기 시작한 날: ${since}`;
