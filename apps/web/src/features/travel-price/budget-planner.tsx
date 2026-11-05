"use client";

// 여행 예산 계산 — 나라 · 한국에서 하루 쓰는 돈 · 일수 → 같은 생활이면 그 나라에서 하루 · 전체 (원 · 현지 통화) (작업 0088)
//   입력은 이 화면 상태에만 (보내지 않음) · 물가 기준 연도 · 환율 기준일을 같이 (TRV-01 · TRV-03)
import { currencyName } from "@hav/shared/currency";
import { type TravelRow, relativeText } from "@hav/shared/travel";
import { FieldLabel, Input, Select } from "@hav/ui/field";
import { SubTitle } from "@hav/ui/heading";
import { localText, wonText } from "./budget";
import { type Latest, useBudgetPlanner } from "./use-budget-planner";
import { StatTile } from "@hav/ui/stat-tile";

export function BudgetPlanner({ rows, latestOf }: { rows: TravelRow[]; latestOf: Record<string, Latest> }) {
  const { sorted, country, setCountry, daily, setDaily, days, setDays, row, d, n, latest, budget: b } = useBudgetPlanner(rows, latestOf);

  return (
    <section id="budget" aria-labelledby="budget-title" className="scroll-mt-20 rounded-card bg-surface-2 p-5 sm:p-8">
      <SubTitle id="budget-title">여행 예산 계산</SubTitle>
      <p className="mt-1 text-sm text-fg-2">한국에서의 하루 지출을 기준으로 그 나라의 예상 비용을 계산합니다.</p>
      <form className="mt-5 grid gap-3 sm:grid-cols-[1.2fr_1fr_0.6fr]" onSubmit={(e) => e.preventDefault()}>
        <FieldLabel label="나라">
          <Select value={country} onChange={(e) => setCountry(e.target.value)}>
            {sorted.map((r) => (
              <option key={r.country} value={r.country}>
                {r.name}
              </option>
            ))}
          </Select>
        </FieldLabel>
        <FieldLabel label="한국에서 하루 (원)">
          <Input inputMode="numeric" autoComplete="off" value={daily} onChange={(e) => setDaily(e.target.value)} aria-invalid={d == null} />
        </FieldLabel>
        <FieldLabel label="일수">
          <Input inputMode="numeric" autoComplete="off" value={days} onChange={(e) => setDays(e.target.value)} aria-invalid={n == null} />
        </FieldLabel>
      </form>

      <div className="mt-6" aria-live="polite">
        {!row ? null : d == null ? (
          <p className="text-sm text-expensive">하루 예산은 1원 이상의 정수로 넣어 주세요.</p>
        ) : n == null ? (
          <p className="text-sm text-expensive">일수는 1 ~ 90일로 넣어 주세요.</p>
        ) : (
          b && (
            <>
              <p className="text-sm text-fg-2">
                {row.name} 물가는 한국보다 <span className="font-semibold text-fg">{relativeText(row.relative)}</span> ({row.year}년)
              </p>
              <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                <StatTile label="하루" value={<>약 {wonText(b.dailyWon)}</>} sub={b.dailyLocal != null && row.currency && <span className="text-sm">≈ {localText(b.dailyLocal, row.currency)}</span>} className="bg-surface p-5" valueClassName="text-2xl tracking-tight" />
                <StatTile label={<>{n}일 전체</>} value={<>약 {wonText(b.totalWon)}</>} sub={b.totalLocal != null && row.currency && <span className="text-sm">≈ {localText(b.totalLocal, row.currency)}</span>} className="bg-surface p-5" valueClassName="text-2xl tracking-tight" />
              </dl>
              <p className="mt-3 text-xs leading-relaxed text-fg-2">
                {row.currency && latest
                  ? `${currencyName(row.currency)} 환산은 ${latest.date} 매매기준율 · `
                  : row.currency
                    ? `${currencyName(row.currency)} 오늘 환율을 받지 못해 원으로만 보여 줍니다 · `
                    : ""}
                나라 전체 가계 소비 평균(세계은행)이라 숙소 · 항공 · 도시에 따라 크게 다릅니다. 예상치입니다.
              </p>
            </>
          )
        )}
      </div>
    </section>
  );
}
