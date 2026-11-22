"use client";

// /flights 그래프 — 새 디자인(작업 0218 · 시안 F): 공통 2D 선 그래프(LineChart · 0216) — 국제항공료(울트라마린 · 면 · 최고/최저 점) · 해외단체여행비(청록 · 면) · 원/달러 월평균(점선 · 오른쪽 눈금) · 끝 큰 숫자 말풍선 · 순서 움직임(한 번)
// 지수 두 선은 같은 눈금(왼쪽 위 숫자) · 원/달러는 자기 눈금(아래 회색 숫자 = 같은 가로선의 원 환산) — 점은 모두 받은 실제 값 · 값이 없는 선은 그리지 않고 말풍선도 없음
// 배치는 그대로 — 안내 글 · 그래프 · 범례 칩(누르면 그 선만 강조 · 칩에 최근 값) / 3D 비행기는 2D 결정으로 이 그래프에서 뺌 (비행기 부품 파일은 그대로)
import { LineChart } from "@hav/ui/data/line-chart";
import type { IndexPoint } from "../travel-index";
import { LEGEND_NAME, flightsChart } from "./flights-chart";
import { INDEX_BASE_NOTE, UNIT_NOTE } from "./flights-graph-view";
import { useFlightsGraph } from "./use-flights-graph";

export function FlightsGraph({ air, tour, fx }: { air: IndexPoint[]; tour: IndexPoint[] | null; fx: IndexPoint[] }) {
  const { focus, toggle } = useFlightsGraph();
  const c = flightsChart(air, tour, fx);
  return (
    <div>
      <p className="text-small text-fg-2">
        {INDEX_BASE_NOTE} · {UNIT_NOTE}
      </p>
      <div data-testid="travel-graph" className="mt-3">
        <LineChart
          aria={c.label}
          x={c.x}
          y={c.y}
          y2={c.y2}
          xTicks={c.xTicks}
          series={c.series}
          marks={c.marks}
          focus={focus}
          height={400}
          heightPhone={320}
        />
      </div>
      {/* 범례 — 칩을 누르면 그 선만 강조 (다시 누르면 원래대로) · 칩에는 선 이름만 (작업 0261) */}
      <ul data-testid="travel-legend" className="mt-3 flex flex-wrap gap-2 text-small text-fg max-sm:gap-y-3">
        {c.lines.map((l) => (
          <li key={l.id}>
            <button type="button" aria-pressed={focus === l.id} onClick={() => toggle(l.id)} className={`tap-44 flex items-center gap-2 rounded-pill border-2 px-3 py-1 transition-colors ${focus === l.id ? "border-cheap bg-card font-semibold" : "border-line hover:bg-surface-2"}`}>
              {l.id === "fx" ? <span aria-hidden className="inline-block w-5 border-t-2 border-dashed border-fg-2" /> : <span aria-hidden className={`inline-block h-1 w-5 rounded-pill ${l.id === "air" ? "bg-cheap" : "bg-band"}`} />}
              <span>{LEGEND_NAME[l.id]}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
