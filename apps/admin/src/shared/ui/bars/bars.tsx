"use client";

// 어드민 가로 막대 (작업 0303) — 이름 → 막대 → 숫자 · 첫 줄(가장 큰 값)만 파랑 · 화면에 들어올 때 왼쪽에서 채움(use-fill-on-view)
//   막대마다 같은 숫자를 글로 함께 둠(보이는 숫자)
import type { BarRow } from "./bar-row";
import { useFillOnView } from "./use-fill-on-view";

export type { BarRow };

export function Bars({ rows, lead = true, testId = "bar-row" }: { rows: BarRow[]; lead?: boolean; testId?: string }) {
  const ref = useFillOnView<HTMLUListElement>();
  return (
    <ul ref={ref} className="adm-bars">
      {rows.map((r, i) => (
        <li key={r.label} data-testid={testId} data-value={r.value}>
          <span className="l" title={r.label}>
            {r.label}
          </span>
          <span className="adm-track" aria-hidden>
            <span className={`adm-fill${lead && i === 0 ? " lead" : ""}`} style={{ width: `${r.pct}%` }} />
          </span>
          <b className="n">{r.text}</b>
        </li>
      ))}
    </ul>
  );
}
