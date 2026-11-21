// 통화 둘러보기 표 — "90일 최고보다" 계산 · 글 · 줄 만들기 · 두 단 나누기 (작업 0260 · 순수 함수)
//   값은 /signal 이 준 오늘 값(latest)과 90일 최고(max) 둘 다 1 외화당 원이라 단위(엔 100 등)와 무관 · 받지 못한 값은 지어내지 않고 null("—")

export type Drop = number | "top" | null;
export type RateRow = { currency: string; drop: Drop; text: string; bar: number };

const ok = (v: number | null | undefined): v is number => typeof v === "number" && Number.isFinite(v) && v > 0;

/** (오늘 − 90일 최고) ÷ 90일 최고 — 0 이하의 분수 · 오늘이 최고(오늘 ≥ 최고)면 "top" · 값이 없거나 이상하면 null */
export function dropFromHigh(latest: number | null | undefined, max: number | null | undefined): Drop {
  if (!ok(latest) || !ok(max)) return null;
  if (latest >= max) return "top";
  return (latest - max) / max;
}

/** "−11.8%"(U+2212 · 소수 한 자리) · "최고" · "—" · 반올림해 0.0 이 되면 "0.0%" */
export function dropText(d: Drop): string {
  if (d === "top") return "최고";
  if (d === null) return "—";
  const n = Math.abs(d * 100).toFixed(1);
  return n === "0.0" ? "0.0%" : `−${n}%`;
}

type Entry = { currency: string; latest: number | null | undefined; max: number | null | undefined; signal: "cheap" | "normal" | "expensive" | null };

/** 많이 내린 순서 · 최고는 숫자 줄 뒤 · "—" 는 맨 끝 · 같은 폭은 받은 순서 · 신호 없음(기록 부족)은 "—" · bar = 가장 많이 내린 통화가 1 */
export function rateRows(entries: Entry[]): RateRow[] {
  const rows = entries.map((e, i) => {
    const drop = e.signal === null ? null : dropFromHigh(e.latest, e.max);
    return { currency: e.currency, drop, text: dropText(drop), i };
  });
  const rank = (d: Drop) => (typeof d === "number" ? 0 : d === "top" ? 1 : 2);
  rows.sort((a, b) => rank(a.drop) - rank(b.drop) || (typeof a.drop === "number" && typeof b.drop === "number" ? a.drop - b.drop : 0) || a.i - b.i);
  const biggest = Math.max(0, ...rows.map((r) => (typeof r.drop === "number" ? -r.drop : 0)));
  return rows.map(({ i: _i, ...r }) => ({ ...r, bar: typeof r.drop === "number" && biggest > 0 ? Math.min(1, -r.drop / biggest) : 0 }));
}

/** 앞 절반(홀수면 앞이 하나 더) · 뒤 절반 */
export function splitColumns<T>(rows: T[]): [T[], T[]] {
  const n = Math.ceil(rows.length / 2);
  return [rows.slice(0, n), rows.slice(n)];
}
