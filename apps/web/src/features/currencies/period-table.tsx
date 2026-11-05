// 기간별 변화 표 — 차트와 같은 숫자를 글자로 (작업 0115)
import { rateText } from "@hav/shared/currency";
import { DateText } from "@hav/ui/date-text";
import { changeText } from "./periods";
import type { periodRows } from "./summary";

export function PeriodTable({ rows, unit }: { rows: ReturnType<typeof periodRows>; unit: number }) {
  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full text-left text-sm">
        <caption className="pb-2 text-left text-xs text-fg-2">기간별 변화 · {rows[0].to.date} 기준</caption>
        <thead className="text-xs text-fg-2">
          <tr>
            <th scope="col" className="py-1.5 pr-3 font-normal">기간</th>
            <th scope="col" className="py-1.5 pr-3 font-normal">시작일</th>
            <th scope="col" className="py-1.5 pr-3 font-normal">시작 값</th>
            <th scope="col" className="py-1.5 font-normal">변화</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line border-t border-line text-fg">
          {rows.map((r) => (
            <tr key={r.id}>
              <th scope="row" className="py-2 pr-3 font-medium">{r.label}</th>
              <td className="py-2 pr-3 whitespace-nowrap"><DateText date={r.from.date} /></td>
              <td className="py-2 pr-3 whitespace-nowrap">{rateText({ baseRate: r.from.baseRate, unit: unit }).value}</td>
              <td className="py-2 whitespace-nowrap">{changeText(r.pct).value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
