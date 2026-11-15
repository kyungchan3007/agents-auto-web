"use client";

// 여행 예산 계산 — 나라 · 한국에서 하루 쓰는 돈 · 일수 → 같은 생활이면 그 나라에서 하루 · 전체 (원 · 현지 통화) (작업 0088)
//   입력은 이 화면 상태에만 (보내지 않음) · 물가 기준 연도 · 환율 기준일을 같이 (TRV-01 · TRV-03)
import { currencyName } from "@hav/shared/currency";
import { type TravelRow, relativeText } from "@hav/shared/travel";
import { FieldLabel, Input, Select } from "@hav/ui/form/field";
import { localText, wonText } from "../lib/budget";
import { type Latest, useBudgetPlanner } from "../hooks/use-budget-planner";

export function BudgetPlanner({ rows, latestOf }: { rows: TravelRow[]; latestOf: Record<string, Latest> }) {
  const { sorted, country, setCountry, daily, setDaily, days, setDays, row, d, n, latest, budget: b } = useBudgetPlanner(rows, latestOf);

  return (
    <section id="budget" data-testid="budget" aria-labelledby="budget-title" className="scroll-mt-(--hav-nav-h) rounded-card bg-card px-6 py-6">
      <h2 id="budget-title" className="font-display text-[1.625rem] leading-tight font-normal text-cheap">
        여행 하루 예산
      </h2>
      <form className="mt-4 grid gap-4 sm:grid-cols-3" onSubmit={(e) => e.preventDefault()}>
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

      <div className="mt-4" aria-live="polite">
        {!row ? null : d == null ? (
          <p className="text-small text-expensive">하루 예산은 1원 이상의 정수로 넣어 주세요.</p>
        ) : n == null ? (
          <p className="text-small text-expensive">일수는 1 ~ 90일로 넣어 주세요.</p>
        ) : (
          b && (
            <>
              <p className="rounded-card bg-sun px-5 py-4 text-[1.375rem] font-semibold text-pin-ink sm:text-[1.625rem]">
                하루 약 {wonText(b.dailyWon)} · {n}일 약 {wonText(b.totalWon)}
              </p>
              <p className="mt-3 text-small text-fg-2">
                {row.name} 물가는 한국보다 {relativeText(row.relative)} ({row.year}년)
                {b.dailyLocal != null && row.currency && latest ? ` · 하루 ≈ ${localText(b.dailyLocal, row.currency)} (${latest.date} 매매기준율)` : ""}
                {row.currency && !latest ? ` · ${currencyName(row.currency)} 오늘 환율을 받지 못해 원으로만 보여 줍니다` : ""}
              </p>
            </>
          )
        )}
      </div>
    </section>
  );
}
