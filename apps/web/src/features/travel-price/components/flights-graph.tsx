"use client";

// /flights 그래프 — 국제항공료(울트라마린 · 굵기 3 · 주인공) · 해외단체여행비(청록) · 원/달러 월평균(점선) 은 굵기 2 · 옅게 배경으로 + 3D 비행기가 항공료 선을 따라 남 (작업 0170 · 0181)
// 세 값은 단위가 달라 선마다 자기 최저 ~ 최고 범위로 높이를 맞춤 — 공통 세로 눈금이 없어 가로 눈금선은 그리지 않고 "모양만 비교합니다" 안내 (작업 0181)
// 숫자: 항공료 선에 최저(노란 점) · 최고 라벨 · 선 오른쪽 끝에 이름 + 최근 값 · 범례 칩에도 최근 값 · 칩을 누르면 그 선만 강조 · 값이 없는 선은 그리지 않고 라벨도 없음
// 비행기는 0169 의 선 따라가기 부품 그대로 · 항공료 선의 점을 넘김 · 움직임 줄이기면 항공료가 가장 싼 달 점에 멈춤
import { PLANE_MODEL_URL } from "@hav/shared/travel";
import { PointLabels } from "@hav/ui/data/point-labels";
import { PlaneRouteLazy } from "@hav/ui/three/scene/lazy";
import { useFlightsGraph } from "../hooks/use-flights-graph";
import { INDEX_BASE_NOTE, type SeriesId, UNIT_NOTE, axisTicks, endLabelText, extremeTexts, legendText, dotBox, lineStyle, planeAvoidBox, seriesStats, spreadLabels } from "../lib/flights-graph-view";
import type { IndexPoint } from "../lib/travel-index";

const W = 1000;
const H = 300;
const PAD_X = 32;
const PAD_Y = 40;
const PAD_LABEL = 22; // 그래프 위아래 라벨 자리 (py-6 = 24px 안)
const END_W = 152; // 선 오른쪽 끝 라벨 칸 (px · 넓은 화면만)
const END_GAP = 18; // 끝 라벨끼리 최소 세로 간격 (px)

const idx = (period: string) => Number(period.slice(0, 4)) * 12 + Number(period.slice(5, 7)) - 1;

type Pt = { x: number; y: number; period: string };

/** 칸을 사방으로 n px 넓힘 — 노란 점의 테두리(굵기 2 · 크기가 그래프 폭과 상관없이 일정)까지 이름표가 피하게 (작업 0218 · 그래프가 좁아져도 안 가림) */
const grow = (b: { left: number; top: number; right: number; bottom: number }, n: number) => ({ left: b.left - n, top: b.top - n, right: b.right + n, bottom: b.bottom + n });

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
  const { box, width: pw, focus, toggle } = useFlightsGraph(W);
  // 최근 36개월 안에서 세 선이 같은 가로축을 씀
  const all = [...air, ...(tour ?? []), ...fx];
  const to = Math.max(...all.map((p) => idx(p.period)));
  const from = Math.max(to - 35, Math.min(...all.map((p) => idx(p.period))));
  const inRange = (pts: IndexPoint[]) => pts.filter((p) => idx(p.period) >= from).sort((a, b) => a.period.localeCompare(b.period));
  const airVals = inRange(air);
  const tourVals = tour ? inRange(tour) : [];
  const fxVals = inRange(fx);
  const airPts = layout(airVals, from, to);
  const tourPts = layout(tourVals, from, to);
  const fxPts = layout(fxVals, from, to);
  // 항공료가 가장 싼 달(최근 36개월 중 최저 지수) — 움직임 줄이기에서 비행기가 멈출 점 · 노란 점
  const stats = seriesStats(airVals);
  const cheapIdx = stats ? airVals.findIndex((p) => p.period === stats.min.period) : 0;
  const cheap = airPts[cheapIdx];
  const priceyIdx = stats ? airVals.findIndex((p) => p.period === stats.max.period) : 0;
  const pricey = airPts[priceyIdx];
  const label = `국제항공료 · 해외단체여행비 지수와 원/달러 월평균 선 그래프 (${airVals[0]?.period} ~ ${airVals.at(-1)?.period})`;
  // 선 · 끝 라벨 · 범례에 쓸 줄 목록 — 값이 없는 선은 넣지 않음 (그리지 않고 라벨도 없음)
  const lines: { id: SeriesId; pts: Pt[]; vals: IndexPoint[] }[] = [
    { id: "air", pts: airPts, vals: airVals },
    ...(tourVals.length > 0 ? [{ id: "tour" as const, pts: tourPts, vals: tourVals }] : []),
    ...(fxVals.length > 0 ? [{ id: "fx" as const, pts: fxPts, vals: fxVals }] : []),
  ];
  // 라벨은 화면 픽셀 기준 — 그래프(SVG)는 폭에 맞춰 같은 비율로 줄어듦
  const s = pw / W;
  const px = (p: Pt) => ({ x: p.x * s, y: p.y * s });
  const texts = stats ? extremeTexts(stats) : null;
  const showMax = !!stats && stats.max.period !== stats.min.period;
  // 선 오른쪽 끝 이름 + 최근 값 — 휴대폰(그래프 폭이 좁음)에서는 칸이 없어 범례 칩이 최근 값을 보임
  const endOn = pw >= 560;
  const endYs = spreadLabels(lines.map((l) => l.pts[l.pts.length - 1].y * s), END_GAP, -PAD_LABEL, H * s + PAD_LABEL);
  const ticks = axisTicks(from, to, pw);
  const xPct = (i: number) => ((PAD_X + (to === from ? 0.5 : (i - from) / (to - from)) * (W - PAD_X * 2)) / W) * 100;
  return (
    <div>
      <p className="text-small text-fg-2">
        {INDEX_BASE_NOTE} · {UNIT_NOTE}
      </p>
      <div data-testid="travel-graph" className="relative py-6" style={endOn ? { paddingRight: END_W } : undefined}>
        <div ref={box} className="relative">
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="block h-auto w-full overflow-visible">
            {lines
              .filter((l) => l.id !== "air" && l.pts.length > 1)
              .map((l) => {
                const st = lineStyle(focus, l.id);
                return l.id === "fx" ? (
                  <path key={l.id} d={pathOf(l.pts)} fill="none" stroke="var(--hav-fg-2)" strokeWidth={st.width} strokeOpacity={st.opacity} strokeDasharray="6 5" vectorEffect="non-scaling-stroke" />
                ) : (
                  <path key={l.id} d={pathOf(l.pts)} fill="none" stroke="var(--hav-accent)" strokeWidth={st.width} strokeOpacity={st.opacity} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                );
              })}
            <path d={pathOf(airPts)} fill="none" stroke="var(--hav-cheap)" strokeWidth={lineStyle(focus, "air").width} strokeOpacity={lineStyle(focus, "air").opacity} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            {pricey && showMax && <circle cx={pricey.x} cy={pricey.y} r={6} fill="var(--hav-expensive-shape)" />}
            {cheap && <circle cx={cheap.x} cy={cheap.y} r={11} fill="var(--hav-sun)" stroke="var(--hav-fg)" strokeWidth={2} vectorEffect="non-scaling-stroke" />}
          </svg>
          {/* 3D 비행기 — 항공료 선 위에 같은 크기로 겹침 · 선과 같은 높이로 날아감 · 마우스를 막지 않음 */}
          <div data-testid="plane-route" aria-hidden className="pointer-events-none absolute inset-0">
            <PlaneRouteLazy url={PLANE_MODEL_URL} points={airPts.map((p) => ({ x: p.x / W, y: 1 - p.y / H }))} stopIndex={cheapIdx} className="size-full" />
          </div>
          {texts && cheap && pricey && (
            <PointLabels max={{ ...px(pricey), text: texts.max }} min={{ ...px(cheap), text: texts.min }} today={px(airPts[airPts.length - 1])} bounds={{ left: 0, top: -PAD_LABEL, right: pw, bottom: H * s + PAD_LABEL }} avoid={[planeAvoidBox(px(cheap), s), grow(dotBox(px(cheap), s), 2)]} />
          )}
        </div>
        {endOn &&
          lines.map((l, i) => (
            <span key={l.id} data-testid={`end-label-${l.id}`} aria-hidden className={`pointer-events-none absolute text-small font-semibold whitespace-nowrap ${l.id === "air" ? "text-cheap" : l.id === "tour" ? "text-accent" : "text-fg-2"}`} style={{ left: `calc(100% - ${END_W - 10}px)`, top: PAD_LABEL + 2 + endYs[i], transform: "translateY(-50%)" }}>
              {endLabelText(l.id, l.vals[l.vals.length - 1])}
            </span>
          ))}
      </div>
      {/* 가로축 — 처음 · 끝 달은 늘 보이고(끝은 오른쪽으로 붙여 칸 밖으로 안 나감) 사이는 6개월 간격 · 글자가 겹치면 생략 */}
      <div className="relative mt-1 h-5 text-small whitespace-nowrap text-fg-2 tabular-nums" aria-hidden style={endOn ? { marginRight: END_W } : undefined}>
        {ticks.map((t) => (
          <span key={t.idx} data-testid="month-tick" className="absolute whitespace-nowrap" style={{ left: `${xPct(t.idx)}%`, transform: `translateX(${t.anchor === "start" ? "0%" : t.anchor === "end" ? "-100%" : "-50%"})` }}>
            {t.period}
          </span>
        ))}
      </div>
      {/* 범례 — 칩을 누르면 그 선만 강조 (다시 누르면 원래대로) · 칩에 최근 값 */}
      <ul data-testid="travel-legend" className="mt-3 flex flex-wrap gap-2 text-small text-fg">
        {lines.map((l) => (
          <li key={l.id}>
            <button type="button" aria-pressed={focus === l.id} onClick={() => toggle(l.id)} className={`flex items-center gap-2 rounded-pill border-2 px-3 py-1 transition-colors ${focus === l.id ? "border-cheap bg-card font-semibold" : "border-line hover:bg-surface-2"}`}>
              {l.id === "fx" ? <span aria-hidden className="inline-block w-5 border-t-2 border-dashed border-fg-2" /> : <span aria-hidden className={`inline-block h-1 w-5 rounded-pill ${l.id === "air" ? "bg-cheap" : "bg-accent"}`} />}
              <span className="tabular-nums">{legendText(l.id, l.vals[l.vals.length - 1])}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
