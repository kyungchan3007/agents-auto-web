// 도착지 요약 알약 — 국기들 + "도착지 N곳 중 M곳이 최근 90일 중 싼 편" (작업 0228 · 모션 13번)
//   카드 안 맨 위에 겹쳐 놓이는 한 줄 · 카드가 알약으로 접혀 있을 때(pill)와 펼치는 동안(expanding) 만 있고 끝(final)에는 DOM 에서 빠짐
//   N = 도착지 수 · M = 사이트 신호 규칙(하위 30% 이하)으로 싼 편인 도착지 수 (cheapDestinationCount)
import { Flag } from "@hav/ui/data/flag";
import { cheapDestinationCount, type DestinationRowData, pillParts, pillText } from "../common/destinations";

/** fade: 1 보임 → 0 사라짐 (펼치기 시작 0.18초) */
export function DestinationsPill({ rows, windowDays, fade }: { rows: DestinationRowData[]; windowDays: number; fade: number }) {
  // 휴대폰에서 글이 꺾일 때 "편" 한 글자만 다음 줄에 남지 않게 — "최근 90일 중 싼 편" 은 한 덩어리로 묶어 그 앞에서 꺾임 (문구는 pillText 그대로 · 나누기만 여기서)
  const { head, tail } = pillParts(pillText(rows.length, cheapDestinationCount(rows), windowDays));
  return (
    <div
      data-testid="dest-pill"
      className="pointer-events-none absolute inset-x-0 top-0 z-10 flex h-[calc(var(--pill-h)-4px)] items-center gap-2.5 px-[1.125rem] sm:gap-3.5 sm:px-7"
      style={{ opacity: fade, transform: `translateY(${(1 - fade) * -8}px)` }}
    >
      <span className="flex shrink-0 gap-[0.3125rem]">
        {rows.map((row) => (
          <span key={row.id} data-testid="dest-pill-flag" className="block overflow-hidden rounded-[0.25rem] ring-1 ring-line">
            <Flag country={row.flag} label={row.flagLabel} className="h-4 w-6 sm:h-5 sm:w-[1.875rem]" />
          </span>
        ))}
      </span>
      <b data-testid="dest-pill-text" className="text-[0.9375rem] leading-[1.35] font-bold tracking-display text-balance text-fg sm:text-[1.125rem]">
        {head}
        <span className="whitespace-nowrap">{tail}</span>
      </b>
    </div>
  );
}
