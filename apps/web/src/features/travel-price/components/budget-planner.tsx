"use client";

// 여행 예산 계산 — 새 디자인(작업 0220 · 시안 B): 첫 화면 오른쪽 흰 카드 · 나라 · 한국에서 하루 쓰는 돈 · 일수 → 같은 생활이면 그 나라에서 하루 · 전체 (원 · 현지 통화) (작업 0088)
//   계산 기능은 그대로 (budget.ts · 같은 입력 → 같은 금액) · 입력은 이 화면 상태에만 (보내지 않음) · 물가 기준 연도 · 환율 기준일을 같이 (TRV-01 · TRV-03)
//   전체 금액은 화면에 처음 들어올 때만 카운트업 (입력을 바꾸면 바로 바뀜) · 카드가 파랑 면과 하늘 면 경계에 걸침은 price-page 가 맞춤
import { currencyName } from "@hav/shared/currency";
import { type TravelRow, relativeText } from "@hav/shared/travel";
import { FieldLabel, Input, Select } from "@hav/ui/form/field";
import { CountUp } from "@hav/ui/motion/count-up";
import { SectionTitle } from "@hav/ui/text/heading";
import { localText, wonText } from "../lib/budget";
import { type Latest, useBudgetPlanner } from "../hooks/use-budget-planner";

export function BudgetPlanner({ rows, latestOf, className = "" }: { rows: TravelRow[]; latestOf: Record<string, Latest>; className?: string }) {
  const { sorted, country, setCountry, daily, setDaily, days, setDays, row, d, n, latest, budget: b } = useBudgetPlanner(rows, latestOf);

  return (
    <section id="budget" data-testid="budget" aria-labelledby="budget-title" className={`scroll-mt-(--hav-nav-h) rounded-[1.75rem] border border-line bg-card px-5 py-6 text-fg shadow-ticket sm:px-8 sm:py-8 ${className}`}>
      <SectionTitle id="budget-title" className="text-[1.625rem] leading-tight text-fg">
        여행 하루 예산
      </SectionTitle>
      <form className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_7rem]" onSubmit={(e) => e.preventDefault()}>
        <div className="sm:col-span-2">
          <FieldLabel label="나라">
            <Select value={country} onChange={(e) => setCountry(e.target.value)}>
              {sorted.map((r) => (
                <option key={r.country} value={r.country}>
                  {r.name}
                </option>
              ))}
            </Select>
          </FieldLabel>
        </div>
        <FieldLabel label="한국에서 하루 (원)">
          <Input inputMode="numeric" autoComplete="off" value={daily} onChange={(e) => setDaily(e.target.value)} aria-invalid={d == null} />
        </FieldLabel>
        <FieldLabel label="일수">
          <Input inputMode="numeric" autoComplete="off" value={days} onChange={(e) => setDays(e.target.value)} aria-invalid={n == null} />
        </FieldLabel>
      </form>

      <div className="mt-5 border-t-2 border-dashed border-line pt-5" aria-live="polite">
        {!row ? null : d == null ? (
          <p className="text-small text-expensive">하루 예산은 1원 이상의 정수로 넣어 주세요.</p>
        ) : n == null ? (
          <p className="text-small text-expensive">일수는 1 ~ 90일로 넣어 주세요.</p>
        ) : (
          b && (
            <>
              <p data-testid="budget-day" className="text-small font-bold text-fg-2">
                하루 약 {wonText(b.dailyWon)}
              </p>
              <p className="mt-1 flex flex-wrap items-baseline gap-x-3 text-fg">
                <span data-testid="budget-total" className="text-[2.25rem] leading-tight font-extrabold tracking-display tabular-nums sm:text-[2.75rem]">
                  <CountUp value={b.totalWon} suffix="원" />
                </span>
                <span className="text-body font-bold text-fg-2">{n}일 약</span>
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
