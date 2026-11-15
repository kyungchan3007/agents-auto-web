// /flights 그래프 — 국제항공료(울트라마린) · 해외단체여행비(청록) 두 선 + 원/달러 월평균 점선 · 3D 비행기가 항공료 선을 따라 남 (작업 0170 · Figma 03)
// 세 값은 단위가 달라 선마다 자기 최저 ~ 최고 범위로 높이를 맞춤 (선의 모양만 비교 · 실제 숫자는 아래 카드 · 지수는 실제 요금이 아님)
// 비행기는 0169 의 선 따라가기 부품 그대로 · 항공료 선의 점을 넘김 · 움직임 줄이기면 항공료가 가장 싼 달 점에 멈춤
import { PLANE_MODEL_URL } from "@hav/shared/travel";
import { PlaneRouteLazy } from "@hav/ui/three/scene/lazy";
import type { IndexPoint } from "../lib/travel-index";

const W = 1000;
const H = 300;
const PAD_X = 32;
const PAD_Y = 40;

const idx = (period: string) => Number(period.slice(0, 4)) * 12 + Number(period.slice(5, 7)) - 1;

type Pt = { x: number; y: number; period: string };

/** 선 하나의 점들 — x 는 달 순서(공통 범위) · y 는 이 선의 최저 ~ 최고 */
function layout(points: IndexPoint[], from: number, to: number): Pt[] {
  const vs = points.map((p) => p.value);
  const lo = Math.min(...vs);
  const hi = Math.max(...vs);
  return points.map((p) => ({
    period: p.period,
    x: PAD_X + (to === from ? 0.5 : (idx(p.period) - from) / (to - from)) * (W - PAD_X * 2),
    y: hi === lo ? H / 2 : PAD_Y + (1 - (p.value - lo) / (hi - lo)) * (H - PAD_Y * 2),
  }));
}

/** 없는 달에서는 선을 끊음 (채우지 않음) */
const pathOf = (pts: Pt[]) => pts.map((p, i) => `${i > 0 && idx(pts[i - 1].period) === idx(p.period) - 1 ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

export function FlightsGraph({ air, tour, fx }: { air: IndexPoint[]; tour: IndexPoint[] | null; fx: IndexPoint[] }) {
  // 최근 36개월 안에서 세 선이 같은 가로축을 씀
  const all = [...air, ...(tour ?? []), ...fx];
  const to = Math.max(...all.map((p) => idx(p.period)));
  const from = Math.max(to - 35, Math.min(...all.map((p) => idx(p.period))));
  const inRange = (pts: IndexPoint[]) => pts.filter((p) => idx(p.period) >= from).sort((a, b) => a.period.localeCompare(b.period));
  const airPts = layout(inRange(air), from, to);
  const tourPts = tour ? layout(inRange(tour), from, to) : [];
  const fxPts = layout(inRange(fx), from, to);
  const airVals = inRange(air);
  // 항공료가 가장 싼 달(최근 36개월 중 최저 지수) — 움직임 줄이기에서 비행기가 멈출 점 · 노란 점
  const cheapIdx = airVals.length > 0 ? airVals.reduce((best, p, i) => (p.value < airVals[best].value ? i : best), 0) : 0;
  const cheap = airPts[cheapIdx];
  const label = `국제항공료 · 해외단체여행비 지수와 원/달러 월평균 선 그래프 (${airVals[0]?.period} ~ ${airVals.at(-1)?.period})`;
  return (
    <div>
      <div data-testid="travel-graph" className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="block h-auto w-full overflow-visible">
          {[0.2, 0.5, 0.8].map((r) => (
            <line key={r} x1={0} x2={W} y1={H * r} y2={H * r} stroke="var(--hav-line)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          ))}
          {fxPts.length > 1 && <path d={pathOf(fxPts)} fill="none" stroke="var(--hav-fg-2)" strokeWidth={2} strokeDasharray="6 5" vectorEffect="non-scaling-stroke" />}
          {tourPts.length > 1 && <path d={pathOf(tourPts)} fill="none" stroke="var(--hav-accent)" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />}
          <path d={pathOf(airPts)} fill="none" stroke="var(--hav-cheap)" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          {cheap && <circle cx={cheap.x} cy={cheap.y} r={11} fill="var(--hav-sun)" stroke="var(--hav-fg)" strokeWidth={2} vectorEffect="non-scaling-stroke" />}
        </svg>
        {/* 3D 비행기 — 항공료 선 위에 같은 크기로 겹침 · 선과 같은 높이로 날아감 · 마우스를 막지 않음 */}
        <div data-testid="plane-route" aria-hidden className="pointer-events-none absolute inset-0">
          <PlaneRouteLazy url={PLANE_MODEL_URL} points={airPts.map((p) => ({ x: p.x / W, y: 1 - p.y / H }))} stopIndex={cheapIdx} className="size-full" />
        </div>
      </div>
      <p className="mt-2 flex justify-between text-small text-fg-2 tabular-nums" aria-hidden>
        <span>{airVals[0]?.period}</span>
        <span>{airVals.at(-1)?.period}</span>
      </p>
      {/* 범례 — 휴대폰은 그래프 아래 */}
      <ul data-testid="travel-legend" className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-small text-fg">
        <li className="flex items-center gap-2">
          <span aria-hidden className="inline-block h-1 w-5 rounded-pill bg-cheap" />
          국제항공료
        </li>
        {tour && (
          <li className="flex items-center gap-2">
            <span aria-hidden className="inline-block h-1 w-5 rounded-pill bg-accent" />
            해외단체여행비
          </li>
        )}
        {fx.length > 1 && (
          <li className="flex items-center gap-2">
            <span aria-hidden className="inline-block w-5 border-t-2 border-dashed border-fg-2" />
            원/달러 월평균 (점선)
          </li>
        )}
      </ul>
    </div>
  );
}
