"use client";

// 직구 계산기 화면 — 입력은 이 화면 상태에만 (보내지 않음 · 저장하지 않음 IMP-01) · 결과 옆에 환율 기준일 · 출처 (IMP-02) · "예상" 안내 (IMP-04)
import { currencyName } from "@hav/shared/currency";
import { Input, Select, UnitInput } from "@hav/ui/form/field";
import type { ReactNode } from "react";
import { CalcResult } from "./calc-result";
import { DUTY_FREE_USD, ROUTE_LABEL, type Route } from "../lib/rules";
import type { useCalcForm } from "../hooks/use-calc-form";

// 입력 상태는 위(calc-page)에서 한 번 만들어 내려받음 — 맨 위 큰 문장(사진 위)이 같은 입력으로 바뀌어야 해서 (작업 0175)
export function CalcForm({ form }: { form: ReturnType<typeof useCalcForm> }) {
  const { codes, input, result, rate, source, set, err } = form;
  return (
    <>
      <div className="grid items-start gap-4 lg:grid-cols-2">
      <form data-testid="calc-input" className="grid content-start gap-4 rounded-card bg-card px-6 py-6" onSubmit={(e) => e.preventDefault()} aria-label="직구 계산 입력">
        <Field label="통화" htmlFor="currency">
          <Select id="currency" value={input.currency} onChange={set("currency")}>
            {codes.map((c) => (
              <option key={c} value={c}>
                {currencyName(c)} {c}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="물건 값" hint="현지 세금 · 현지 배송비까지 넣은 값" htmlFor="price" error={err("price")}>
          <UnitInput unit={input.currency} id="price" inputMode="decimal" autoComplete="off" value={input.price} onChange={set("price")} placeholder="180" />
        </Field>
        <Field label="보내는 곳" htmlFor="route">
          <Select id="route" value={input.route} onChange={set("route")}>
            {(Object.keys(ROUTE_LABEL) as Route[]).map((k) => (
              <option key={k} value={k}>
                {ROUTE_LABEL[k]} · {DUTY_FREE_USD[k]}달러
              </option>
            ))}
          </Select>
        </Field>
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

function Field({ label, hint, htmlFor, error, children }: { label: string; hint?: string; htmlFor: string; error?: string | null; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="text-small text-fg-2">
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="mt-1.5 text-small text-fg-2">{hint}</p>}
      {error && <p className="mt-1.5 text-sm text-expensive">{error}</p>}
    </div>
  );
}
