// 그래프의 최고 · 최저 점 라벨 — 화면 픽셀 위치를 받아 서로 · 오늘 점과 겹치지 않게 놓음 (작업 0181 · 위치 계산은 lib/extreme-labels 의 placeExtremeLabels · 0175 통화 그래프와 같은 방식)
// 부모는 position:relative 인 칸 · 좌표는 그 칸 왼쪽 위 기준 px · 최고는 비쌈 색 · 최저는 쌈 색 · 보조 정보라 화면 읽기 도구는 건너뜀(aria-hidden)
import { type Placed, placeExtremeLabels } from "../../lib/extreme-labels";

type Pt = { x: number; y: number };

export function PointLabels({ max, min, today, bounds, charWidth = 9 }: { max: Pt & { text: string }; min: Pt & { text: string }; today: Pt; bounds: { left: number; top: number; right: number; bottom: number }; charWidth?: number }) {
  const placed = placeExtremeLabels({ max, min, today, bounds, font: { size: 13, charWidth } });
  return (
    <>
      <PointLabel placed={placed.max} testId="extreme-max" className="text-expensive" text={max.text} />
      <PointLabel placed={placed.min} testId="extreme-min" className="text-cheap" text={min.text} />
    </>
  );
}

function PointLabel({ placed, className, text, testId }: { placed: Placed; className: string; text: string; testId: string }) {
  const shiftX = placed.anchor === "start" ? "0%" : placed.anchor === "end" ? "-100%" : "-50%";
  return (
    <span data-testid={testId} aria-hidden className={`pointer-events-none absolute text-[13px] leading-[13px] font-semibold whitespace-nowrap ${className}`} style={{ left: placed.x, top: placed.y, transform: `translateX(${shiftX})` }}>
      {text}
    </span>
  );
}
