// 1 여행 타이밍 (맨 위) — 통계청 국제항공료 지수로 "언제 떠나면 싼지" · 선 그래프(SVG) 위에 3D 비행기가 선을 따라 남 (작업 0169)
// 지수가 없으면 큰 제목 대신 "아직 받지 못했습니다" · 그래프 · 비행기 없음 (숫자 · 달을 지어내지 않음)
import { PLANE_MODEL_URL } from "@hav/shared/travel";
import { PlaneRouteLazy } from "@hav/ui/three/scene/lazy";
import { Eyebrow, Title } from "@hav/ui/text/heading";
import { type TravelTiming, travelTimingCopy } from "../lib/travel-timing";

const W = 1000;
const H = 300;
const PAD_X = 48;
const PAD_Y = 56;

type Ready = Extract<TravelTiming, { kind: "ready" }>;

/** 그래프 점들 — x 는 달(1~12)에 맞춰 12칸 · y 는 지수 (높을수록 위 = 비쌈) */
function layout(t: Ready) {
  const avgs = t.months.map((m) => m.avg);
  const lo = Math.min(...avgs);
  const hi = Math.max(...avgs);
  const x = (month: number) => PAD_X + ((month - 1) / 11) * (W - PAD_X * 2);
  const y = (avg: number) => (hi === lo ? H / 2 : PAD_Y + (1 - (avg - lo) / (hi - lo)) * (H - PAD_Y * 2));
  return t.months.map((m) => ({ month: m.month, x: x(m.month), y: y(m.avg) }));
}

/** 없는 달에서는 선을 끊음 (채우지 않음) */
function linePath(pts: { month: number; x: number; y: number }[]): string {
  return pts.map((p, i) => `${i > 0 && pts[i - 1].month === p.month - 1 ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
}

export function TravelTimingSection({ timing }: { timing: TravelTiming }) {
  const copy = travelTimingCopy(timing);
  return (
    <section aria-labelledby="timing-title" className="bg-surface px-4 pt-14 pb-16 text-fg sm:px-8 sm:pt-20 sm:pb-24">
      <div className="mx-auto max-w-page">
        <Eyebrow>여행 타이밍</Eyebrow>
        {timing.kind === "ready" ? (
          <>
            <Title as="h1" size="poster" id="timing-title" className="mt-3 text-cheap">
              {copy.title}
            </Title>
            <p className="mt-6 max-w-3xl text-body text-fg-2">{copy.message}</p>
            <Graph timing={timing} />
          </>
        ) : (
          <Title as="h1" id="timing-title" className="mt-3 text-fg-2">
            {copy.message}
          </Title>
        )}
      </div>
    </section>
  );
}

function Graph({ timing }: { timing: Ready }) {
  const pts = layout(timing);
  const cheap = pts.find((p) => p.month === timing.cheapest);
  const pricey = pts.find((p) => p.month === timing.priciest);
  const first = timing.months[0].month;
  const last = timing.months[timing.months.length - 1].month;
  const label = `국제항공료 지수 선 그래프 — ${timing.cheapest}월이 가장 낮고 ${timing.priciest}월이 가장 높습니다`;
  return (
    <div className="mt-10">
      <div data-testid="travel-graph" className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="block h-auto w-full overflow-visible">
          {/* 가로 기준선 3개 */}
          {[0.2, 0.5, 0.8].map((r) => (
            <line key={r} x1={0} x2={W} y1={H * r} y2={H * r} stroke="var(--hav-line)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          ))}
          <path d={linePath(pts)} fill="none" stroke="var(--hav-cheap)" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          {pts.map((p) => (
            <circle key={p.month} cx={p.x} cy={p.y} r={4} fill="var(--hav-cheap)" />
          ))}
          {pricey && <circle cx={pricey.x} cy={pricey.y} r={10} fill="var(--hav-expensive-shape)" />}
          {cheap && <circle cx={cheap.x} cy={cheap.y} r={12} fill="var(--hav-sun)" stroke="var(--hav-fg)" strokeWidth={2} vectorEffect="non-scaling-stroke" />}
        </svg>
        {/* 점 라벨 — 넓은 화면에서 점 옆에 (글자는 SVG 밖 HTML 이라 그래프가 줄어도 같은 크기) */}
        {cheap && <PointLabel x={cheap.x} y={cheap.y} text={`${timing.cheapest}월 가장 쌈`} className="text-cheap" below />}
        {pricey && <PointLabel x={pricey.x} y={pricey.y} text={`${timing.priciest}월 가장 비쌈`} className="text-expensive" />}
        {/* 3D 비행기 — 그래프와 같은 크기로 겹침 · 선과 같은 높이로 1월 → 12월 · 마우스를 막지 않음 */}
        <div data-testid="plane-route" aria-hidden className="pointer-events-none absolute inset-0">
          <PlaneRouteLazy url={PLANE_MODEL_URL} points={pts.map((p) => ({ x: p.x / W, y: 1 - p.y / H }))} stopIndex={Math.max(0, pts.findIndex((p) => p.month === timing.cheapest))} className="size-full" />
        </div>
      </div>
      {/* 가로축 — 넓은 화면: 12달 이름 모두 · 760px 이하: 요약 축 글 */}
      <div className="relative mt-2 hidden h-6 text-small text-fg-2 min-[761px]:block" aria-hidden>
        {Array.from({ length: 12 }, (_, i) => (
          <span key={i} className="absolute -translate-x-1/2 tabular-nums" style={{ left: `${((PAD_X + (i / 11) * (W - PAD_X * 2)) / W) * 100}%` }}>
            {i + 1}월
          </span>
        ))}
      </div>
      <p className="mt-3 flex justify-between text-small text-fg-2 min-[761px]:hidden" aria-hidden>
        <span>{first}월</span>
        <span className="text-cheap">{timing.cheapest}월 가장 쌈</span>
        <span className="text-expensive">{timing.priciest}월 가장 비쌈</span>
        <span>{last}월</span>
      </p>
      <p className="mt-4 text-small text-fg-2">지수는 값이 클수록 항공료가 비싸다는 뜻이며 실제 요금이 아닙니다 · 통계청 소비자물가지수(2020년 = 100)</p>
    </div>
  );
}

function PointLabel({ x, y, text, className, below = false }: { x: number; y: number; text: string; className: string; below?: boolean }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute hidden -translate-x-1/2 text-small font-semibold whitespace-nowrap min-[761px]:block ${className}`}
      style={{ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%`, transform: `translate(-50%, ${below ? "20px" : "calc(-100% - 20px)"})` }}
    >
      {text}
    </span>
  );
}
