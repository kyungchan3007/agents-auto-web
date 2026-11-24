// 어드민 /traffic "페이지별 머무름" 표의 계산 (작업 0349) — 순수 함수 · 그리기는 engagement-table.tsx
// 참여율 · 이탈률 = 비율(0~1) · 다른 페이지로 넘어감 = 세션당 페이지뷰(가정) · 시작 날 기준값 대비 오르내림 · 기준값이 없으면 오르내림 칸을 비움 (지어내지 않음)
import type { PageEngagement } from "@hav/shared/ga4";
import { countText } from "@/shared/format/count-text";

export type Delta = { text: string; dir: "up" | "down" | "same" };
type Cell = { text: string; delta: Delta | null };
export type EngagementView = { path: string; viewsText: string; engagement: Cell; bounce: Cell; perSession: Cell };

/** 0.6523 → "65.2%" */
export const ratePercent = (rate: number): string => `${(rate * 100).toFixed(1)}%`;

/** 1.8412 → "1.8쪽" */
export const perSessionText = (v: number): string => `${v.toFixed(1)}쪽`;

const SAME: Delta = { text: "변화 없음", dir: "same" };

/** 차이를 소수 한 자리로 반올림 — 0 이면 변화 없음 · 아니면 부호 + 크기 + 단위 */
function delta(diff: number, unit: string): Delta {
  const r = Math.round(diff * 10) / 10;
  if (r === 0) return SAME;
  return { text: `${r > 0 ? "+" : "-"}${Math.abs(r).toFixed(1)}${unit}`, dir: r > 0 ? "up" : "down" };
}

/** 비율 차이를 퍼센트포인트로 */
export const rateDelta = (now: number, before: number): Delta => delta((now - before) * 100, "%p");

/** 세션당 페이지뷰 차이 (쪽) */
export const perSessionDelta = (now: number, before: number): Delta => delta(now - before, "쪽");

/** 표 줄 — 받은 순서(페이지뷰 많은 순) 그대로 · 오늘 값이 없으면 null(자료 없음) · 기준값에 없는 페이지는 그 줄의 오르내림만 비움 */
export function engagementViews(current: PageEngagement | null, baseline: PageEngagement | null): EngagementView[] | null {
  if (!current) return null;
  const before = new Map((baseline?.pages ?? []).map((p) => [p.path, p]));
  return current.pages.map((p) => {
    const b = before.get(p.path);
    return {
      path: p.path,
      viewsText: countText(p.views),
      engagement: { text: ratePercent(p.engagementRate), delta: b ? rateDelta(p.engagementRate, b.engagementRate) : null },
      bounce: { text: ratePercent(p.bounceRate), delta: b ? rateDelta(p.bounceRate, b.bounceRate) : null },
      perSession: { text: perSessionText(p.viewsPerSession), delta: b ? perSessionDelta(p.viewsPerSession, b.viewsPerSession) : null },
    };
  });
}

/** 표 아래 한 줄 — 기준 기간을 보임 */
export const baselineNote = (baseline: PageEngagement | null): string => (baseline ? `기준값: ${baseline.from} ~ ${baseline.to} (시작 날 고정)` : "기준값 없음");
