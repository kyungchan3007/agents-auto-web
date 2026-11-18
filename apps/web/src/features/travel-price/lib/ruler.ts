// 한국 = 100 물가 자 계산 — 순수 함수 (작업 0220 · 테스트 ruler.test.ts)
// 점은 지금 세 칸 표의 맨 위 나라들(실제 자료) · 값 = 표의 "물가 N" 과 같은 round(relative × 100) · 나라가 없으면 점을 찍지 않음 (지어내지 않음)
import { BAND_EDGE } from "@hav/shared/travel";

export type RulerScale = { lo: number; hi: number };

const DEFAULT_LO = 30;
const DEFAULT_HI = 120;

/** 자의 눈금 범위 — 기본 30 ~ 120 · 값이 밖이면 10 단위로 넓힘 */
export function rulerScale(values: number[]): RulerScale {
  if (values.length === 0) return { lo: DEFAULT_LO, hi: DEFAULT_HI };
  return { lo: Math.min(DEFAULT_LO, Math.floor(Math.min(...values) / 10) * 10), hi: Math.max(DEFAULT_HI, Math.ceil(Math.max(...values) / 10) * 10) };
}

/** 자 위 위치 0 ~ 100 (%) — 범위 밖은 자름 */
export function rulerX(value: number, s: RulerScale): number {
  return Math.min(100, Math.max(0, ((value - s.lo) / (s.hi - s.lo)) * 100));
}

/** 싼 칸이 끝나는 · 비싼 칸이 시작하는 위치 (BAND_EDGE × 100) */
export function rulerSegments(s: RulerScale): { cheapEnd: number; priceyStart: number } {
  return { cheapEnd: rulerX(BAND_EDGE.cheap * 100, s), priceyStart: rulerX(BAND_EDGE.pricey * 100, s) };
}

export type RulerPin = { country: string; name: string; value: number; x: number; side: "up" | "down" };

/** 구간마다 맨 위 perBand 나라 · 값 오름차순 · 옆 핀은 위 · 아래 번갈아 (이름표가 겹치지 않게) */
export function rulerPins(bands: { rows: { country: string; name: string; relative: number }[] }[], perBand = 2): RulerPin[] {
  const picked = bands
    .flatMap((b) => b.rows.slice(0, perBand))
    .map((r) => ({ country: r.country, name: r.name, value: Math.round(r.relative * 100) }))
    .sort((a, b) => a.value - b.value);
  const scale = rulerScale(picked.map((p) => p.value));
  return picked.map((p, i) => ({ ...p, x: rulerX(p.value, scale), side: i % 2 === 0 ? "up" : "down" }));
}

/** 라벨 폭 추정(px) — 이름 글자 수 × 14.5 · 숫자 줄 최소 36 · 양옆 여유 8 (휴대폰 글자 크기 기준) */
function labelWidth(name: string): number {
  return Math.max(name.length * 14.5, 36) + 8;
}

/**
 * 휴대폰 라벨 겹침 풀기 (작업 0220 lead 지시) — 같은 쪽(위 · 아래)에서 x 순서대로, 앞 라벨들과 겹치지 않는 가장 가까운 줄(tier · 0 = 자에 가장 가까움)에 놓음.
 * 겹침 = |Δx(px)| < (폭1 + 폭2) / 2 · widthPx = 자 상자의 폭 추정(휴대폰 약 296px) · 넓은 화면은 tier 를 쓰지 않음(화면이 넓어 겹치지 않음)
 */
export function rulerTiers(pins: { country: string; name: string; x: number; side: "up" | "down" }[], widthPx = 296): Record<string, number> {
  const out: Record<string, number> = {};
  const placed: Record<string, { px: number; w: number }[][]> = { up: [], down: [] };
  for (const p of [...pins].sort((a, b) => a.x - b.x)) {
    const px = (p.x / 100) * widthPx;
    const w = labelWidth(p.name);
    let tier = 0;
    for (;;) {
      const row = (placed[p.side][tier] ??= []);
      if (row.every((o) => Math.abs(o.px - px) >= (o.w + w) / 2)) {
        row.push({ px, w });
        break;
      }
      tier += 1;
    }
    out[p.country] = tier;
  }
  return out;
}

export function rulerMaxTier(tiers: Record<string, number>): number {
  return Math.max(0, ...Object.values(tiers));
}
