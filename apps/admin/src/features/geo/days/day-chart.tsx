"use client";

// 측정한 날마다 (작업 0214 → 작업 0303 어드민 주 그래프) — 막대 = 그날 응답 받은 질문 수 · 파란 점 = 답에 인용 · 점선 = 측정 실패 · 마지막 날만 파랑
//   막대에 마우스를 올리거나 누르거나 포커스하면 아래에 그날 기록 · 막대마다 같은 글을 aria-label · 숨은 글로 함께 둠(서버 HTML)
import { useDayPick } from "./use-day-pick";
import { type DayColumn, dayAxis, dayOfMonth, dayTip } from "../common/geo-bars";

export function DayChart({ columns }: { columns: DayColumn[] }) {
  const { on, pick: setOn } = useDayPick();
  const axis = dayAxis(columns);
  return (
    <div className="adm-chart">
      <div className="adm-plot">
        <div className="adm-gl" aria-hidden>
          <span>{axis.max}</span>
          <span>{axis.mid}</span>
          <span>0</span>
        </div>
        <ol data-testid="day-bars" className="adm-days">
          {columns.map((c, i) => (
            <li key={c.day} data-testid="day-bar" style={{ display: "flex" }}>
              <button
                type="button"
                className={`adm-day${c.failed ? " fail" : ""}${i === columns.length - 1 ? " last" : ""}${on === i ? " on" : ""}`}
                style={{ ["--i" as string]: i }}
                aria-label={c.text}
                onMouseEnter={() => setOn(i)}
                onFocus={() => setOn(i)}
                onClick={() => setOn(i)}
              >
                <span className="b" style={{ height: `calc((100% - 22px) * ${c.heightPct / 100})` }}>
                  {c.cited > 0 && <i className="cite" aria-hidden />}
                </span>
                <span className="d" aria-hidden>
                  {dayOfMonth(c.day)}
                </span>
                <span className="sr-only">{c.text}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
      <p className="adm-tip" aria-live="polite">
        {dayTip(columns, on)}
      </p>
    </div>
  );
}
