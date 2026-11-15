// 표 — 머리줄 · 좁은 화면에서 가로 스크롤 · 숫자는 쉼표 (작업 0136 · 0168: 줄 구분선을 걷고 여백으로 구분)
import { numberText } from "@hav/shared/format";
import type { ReactNode } from "react";

export function DataTable({ head, rows, caption, rowHeader = false, className = "" }: { head: string[]; rows: ReactNode[][]; caption?: ReactNode; rowHeader?: boolean; className?: string }) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-left text-sm">
        {caption && <caption className="pb-2 text-left text-xs text-fg-2">{caption}</caption>}
        <thead className="text-xs text-fg-2">
          <tr>
            {head.map((h) => (
              <th key={h} scope="col" className="py-1.5 pr-3 font-normal whitespace-nowrap last:pr-0">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-fg">
          {rows.map((row, r) => (
            <tr key={r}>
              {row.map((cell, i) =>
                rowHeader && i === 0 ? (
                  <th key={head[i]} scope="row" className="py-2.5 pr-3 font-semibold">
                    {cell}
                  </th>
                ) : (
                  <td key={head[i]} className="py-2.5 pr-3 whitespace-nowrap tabular-nums last:pr-0">
                    {typeof cell === "number" ? numberText(cell) : cell}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
