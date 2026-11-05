// 기간별 변화 표 — 차트와 같은 숫자를 글자로 (작업 0115)
import { rateText } from "@hav/shared/currency";
import { DataTable } from "@hav/ui/data/data-table";
import { DateText } from "@hav/ui/text/date-text";
import { changeText } from "../lib/periods";
import type { periodRows } from "../lib/summary";

export function PeriodTable({ rows, unit }: { rows: ReturnType<typeof periodRows>; unit: number }) {
  return (
    <DataTable
      className="mt-6"
      rowHeader
      caption={`기간별 변화 · ${rows[0].to.date} 기준`}
      head={["기간", "시작일", "시작 값", "변화"]}
      rows={rows.map((r) => [r.label, <DateText key="date" date={r.from.date} />, rateText({ baseRate: r.from.baseRate, unit }).value, changeText(r.pct).value])}
    />
  );
}
