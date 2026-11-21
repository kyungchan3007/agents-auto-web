"use client";

// 직구 계산기 화면 — 입력은 이 화면 상태에만 (보내지 않음 · 저장하지 않음 IMP-01) · 결과 옆에 환율 기준일 · 출처 (IMP-02) · "예상" 안내 (IMP-04)
import { currencyName } from "@hav/shared/currency";
import { Input, Select, UnitInput } from "@hav/ui/form/field";
import type { ReactNode } from "react";
import { summaryLine } from "../lib/calc-copy";
import { CalcResult } from "./calc-result";
import { DUTY_FREE_USD, ROUTE_LABEL, type Route } from "../lib/rules";
import type { useCalcForm } from "../hooks/use-calc-form";

// 입력 상태는 위(calc-page)에서 한 번 만들어 내려받음 — 맨 위 큰 문장(사진 위)이 같은 입력으로 바뀌어야 해서 (작업 0175)
export function CalcForm({ form }: { form: ReturnType<typeof useCalcForm> }) {
  const { codes, input, result, rate, source, set, err, example } = form;
  return (
    <>
      {/* 휴대폰 — 결과가 두 번째 화면이라 폼 위에 요약 한 줄 · 높이 고정(글만 바뀜) (작업 0208) */}
      <p data-testid="calc-summary" className="mb-4 flex h-14 items-center overflow-hidden rounded-card bg-pin-ink px-5 ring-1 ring-card/40 text-small leading-snug font-semibold text-sun sm:hidden">
        {summaryLine(result)}
      </p>
      {/* 넓은 화면: 입력 카드를 결과 카드와 같은 높이로 늘리고 첫 줄 · 마지막 줄은 안쪽 여백에 붙이고 그 사이 줄 간격만 같게 (작업 0249 · 2번 · 0251 ㄱ) */}
      <div className="grid gap-4 lg:grid-cols-2 lg:items-stretch">
      <form data-testid="calc-input" className="grid content-start gap-4 lg:content-between rounded-[1.75rem] border border-line bg-card px-6 py-6 shadow-ticket sm:grid-cols-2" onSubmit={(e) => e.preventDefault()} aria-label="직구 계산 입력">
        <Field label="통화" htmlFor="currency">
          <Select id="currency" value={input.currency} onChange={set("currency")}>
            {codes.map((c) => (
              <option key={c} value={c}>
                {currencyName(c)} {c}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="물건 값" hint="현지 세금 · 현지 배송비까지 넣은 값" htmlFor="price" error={err("price")} badge={example}>
          <UnitInput unit={input.currency} id="price" inputMode="decimal" autoComplete="off" value={input.price} onChange={set("price")} placeholder="180" />
        </Field>
        {/* 보내는 곳 — 드롭다운 대신 두 줄 선택지 (시안 A · 작업 0221) — 한도 차이(200 · 150달러)가 바로 보임 · 화살표 키 · radiogroup · 고른 쪽은 짙은 테두리 + 오른쪽 동그라미 */}
        <div className="sm:col-span-2">
          <span id="route-label" aria-hidden className="text-small text-fg-2">
            보내는 곳
          </span>
          <div role="radiogroup" aria-label="보내는 곳" className="mt-1.5 grid gap-2">
            {(Object.keys(ROUTE_LABEL) as Route[]).map((k) => {
              const on = input.route === k;
              return (
                <label key={k} className={`relative flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-[0.875rem] border-2 bg-card px-4 text-base text-fg transition-colors focus-within:outline-3 focus-within:outline-cheap/25 ${on ? "border-fg font-semibold" : "border-field-line hover:border-cheap/60"}`}>
                  <input type="radio" name="route" value={k} checked={on} onChange={set("route")} className="absolute inset-0 size-full cursor-pointer opacity-0" />
                  <span>
                    {ROUTE_LABEL[k]} · {DUTY_FREE_USD[k]}달러
                  </span>
                  <span aria-hidden className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${on ? "border-cheap" : "border-field-line"}`}>
                    {on && <span data-testid="route-dot" className="size-2.5 rounded-full bg-cheap" />}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
        <Field label="국제 배송비" hint="한도를 넘을 때만 세금에 더함 · 모르면 비워 두기" htmlFor="shipping" error={err("shipping")}>
          <Input id="shipping" inputMode="decimal" autoComplete="off" value={input.shipping} onChange={set("shipping")} placeholder="0" />
        </Field>
        <Field label="관세율 (%)" hint="품목마다 다름 · 모르면 비워 두기" htmlFor="duty" error={err("dutyRate")}>
          <Input id="duty" inputMode="decimal" autoComplete="off" value={input.dutyRate} onChange={set("dutyRate")} placeholder="모르면 비워 두기" />
        </Field>
      </form>

      <CalcResult result={result} rate={rate} source={source} dutyRate={input.dutyRate} />
      </div>
    </>
  );
}

// 힌트 · 오류는 같은 자리(한 줄 높이 · 안내가 접히는 좁은 폭에서만 두 줄) — 오류 글도 한 줄 길이라 오류가 떠도 칸이 커지지 않음 (작업 0200 · 0208 에서 두 줄 자리를 줄여 아래 빈칸을 없앰) · 보내는 곳은 두 칸 폭
function Field({ label, hint, htmlFor, error, wide, badge, children }: { label: string; hint?: string; htmlFor: string; error?: string | null; wide?: boolean; badge?: boolean; children: ReactNode }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={htmlFor} className="text-small text-fg-2">
          {label}
        </label>
        {badge && (
          <span data-testid="calc-example" className="text-small font-semibold text-cheap">
            예시 값 — 바꿔 넣어 보세요
          </span>
        )}
      </div>
      <div className="mt-1.5">{children}</div>
      {(hint || error) && (
        <p className={`mt-1.5 min-h-5 text-small ${error ? "text-expensive" : "text-fg-2"}`}>{error ?? hint}</p>
      )}
    </div>
  );
}
