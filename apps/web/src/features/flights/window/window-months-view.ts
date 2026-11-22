// 여행 타이밍 "창밖으로 보는 12달" 계산 — 순수 함수 (작업 0229 · 모션 1번)
//   달마다 지수 = 홈 12달 막대와 같은 계산(@hav/shared/travel 의 monthlyAverages · 최근 36개월 같은 달 평균) · 싼 달은 앞선 달 · 비싼 달은 뒤선 달(같은 값이어도 겹치지 않음)
//   값이 없는 달은 없는 채로(지어내지 않음) · 값이 있는 달이 2개 미만이면 null (그리지 않음)
import { monthlyAverages } from "@hav/shared/travel";

export type IndexPoint = { period: string; value: number };

/** 달(1~12)마다 창밖 계절 · 한마디 (시안 M) */
export const SEASONS: { season: "겨울" | "봄" | "여름" | "가을"; desc: string }[] = [
  { season: "겨울", desc: "깊은 눈" },
  { season: "겨울", desc: "녹는 눈" },
  { season: "봄", desc: "새싹" },
  { season: "봄", desc: "벚꽃" },
  { season: "봄", desc: "신록 · 꽃밭" },
  { season: "여름", desc: "물 댄 논" },
  { season: "여름", desc: "장마 비" },
  { season: "여름", desc: "한여름 뭉게구름" },
  { season: "가을", desc: "익는 들" },
  { season: "가을", desc: "단풍" },
  { season: "가을", desc: "늦가을 · 건초" },
  { season: "겨울", desc: "첫눈 · 불 켜진 집" },
];

export const seasonOf = (month: number) => SEASONS[Math.min(12, Math.max(1, month)) - 1];

export type WindowMonth = { month: number; avg: number; text: string; season: string; desc: string; tone: "high" | "low" | null; tag: string | null; cmp: string };
export type WindowMonths = { months: WindowMonth[]; lowest: number; highest: number; complete: boolean };

export function windowMonths(points: IndexPoint[] | null | undefined): WindowMonths | null {
  const avg = monthlyAverages(points ?? []);
  const have = Object.entries(avg)
    .map(([m, v]) => ({ month: Number(m), avg: v.avg }))
    .sort((a, b) => a.month - b.month);
  if (have.length < 2) return null;
  let low = have[0];
  let high = have[0];
  for (const m of have) {
    if (m.avg < low.avg) low = m;
    if (m.avg >= high.avg) high = m;
  }
  const complete = have.length === 12;
  const span = complete ? "1년" : "받은 달";
  const lowText = low.avg.toFixed(1);
  const months = have.map((m) => {
    const text = m.avg.toFixed(1);
    const diff = (Number(text) - Number(lowText)).toFixed(1);
    const { season, desc } = seasonOf(m.month);
    const tone = m.month === low.month ? "low" : m.month === high.month ? "high" : null;
    const cmp = tone === "low" ? `${span} 중 가장 낮은 달` : tone === "high" ? `${span} 중 가장 높은 달 · ${low.month}월보다 ${diff} 높음` : `${low.month}월보다 ${diff} 높음`;
    const tag = tone === "low" ? "가장 저렴한 달" : tone === "high" ? "가장 비싼 달" : null;
    return { month: m.month, avg: m.avg, text, season, desc, tone, tag, cmp } satisfies WindowMonth;
  });
  return { months, lowest: low.month, highest: high.month, complete };
}

/** 글자판 "1월" · "11월" — 한 자리 달은 앞 칸이 빔 */
export function flapChars(month: number): [string, string, string] {
  const s = String(month);
  return s.length === 1 ? ["", s, "월"] : [s[0], s[1], "월"];
}

/** 다시 보기 재생 순서 — 달을 작은 순서로 지나 가장 싼 달에서 멈춤 (가장 싼 달이 마지막이면 그대로) */
export function playSequence(months: number[], lowest: number): number[] {
  const sorted = [...months].sort((a, b) => a - b);
  return sorted[sorted.length - 1] === lowest ? sorted : [...sorted, lowest];
}

/** 받은 값의 기간 "2024-12 ~ 2026-10" — 홈 12달 막대와 같은 최근 36개월 안의 첫 · 끝 달 (설명 글에 씀) · 값이 없으면 null */
export function periodRange(points: IndexPoint[] | null | undefined): string | null {
  const ps = (points ?? []).map((p) => p.period).sort();
  if (ps.length === 0) return null;
  const idx = (p: string) => Number(p.slice(0, 4)) * 12 + Number(p.slice(5, 7));
  const last = idx(ps[ps.length - 1]);
  const inWindow = ps.filter((p) => idx(p) > last - 36);
  return `${inWindow[0]} ~ ${inWindow[inWindow.length - 1]}`;
}

type WinMonth = { month: number; avg: number; text: string };

/** 달 → 평균값 맵 (훅이 넘김 숫자에 씀 · 작업 0312 에 window-months.tsx 에서 옮김) */
export const monthValues = (months: WinMonth[]) => Object.fromEntries(months.map((m) => [m.month, m.avg])) as Record<number, number>;

/** 고른 달 · 값 폭 · 자리 · 가장 싼 달 글 */
export function windowPick<T extends WinMonth>(months: T[], month: number, lowest: number) {
  const cur = months.find((m) => m.month === month) ?? months[0]!;
  const vals = months.map((m) => Number(m.text));
  return {
    cur,
    vmin: Math.min(...vals),
    vmax: Math.max(...vals),
    idx: Math.max(0, months.findIndex((m) => m.month === cur.month)),
    n: months.length,
    lowText: months.find((m) => m.month === lowest)?.text,
  };
}

/** 큰 숫자 — 소수 첫째 자리 */
export const oneDecimal = (v: number) => v.toFixed(1);
