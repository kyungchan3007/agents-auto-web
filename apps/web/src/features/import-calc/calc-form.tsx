"use client";

// 직구 계산기 화면 — 입력은 이 화면 상태에만 (보내지 않음 · 저장하지 않음 IMP-01) · 결과 옆에 환율 기준일 · 출처 (IMP-02) · "예상" 안내 (IMP-04)
import { currencyName } from "@hav/shared/currency";
import type { FxRate } from "@hav/shared/fx";
import { Input, Select } from "@hav/ui/field";
import type { ReactNode } from "react";
import { CalcResult } from "./calc-result";
import { DUTY_FREE_USD, ROUTE_LABEL, RULES_SOURCE, type Route } from "./rules";
import { useCalcForm } from "./use-calc-form";

export function CalcForm({ rates }: { rates: FxRate[] }) {
  const { codes, input, result, mood, rate, set, err } = useCalcForm(rates);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-12">
      <form className="grid content-start gap-5" onSubmit={(e) => e.preventDefault()} aria-label="직구 계산 입력">
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
          <div className="relative">
            <Input id="price" inputMode="decimal" autoComplete="off" value={input.price} onChange={set("price")} placeholder="180" className="pr-14" />
            <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm text-fg-2">{input.currency}</span>
          </div>
        </Field>
        <Field label="보내는 곳" hint="미국에서 오는 목록통관 물품만 200달러 · 건강기능식품 · 의약품 등은 일반통관이라 150달러" htmlFor="route">
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
          <a href={RULES_SOURCE.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-sm text-accent hover:underline">
            관세청에서 품목 세율 찾기 ↗
          </a>
        </Field>
      </form>

      <CalcResult result={result} mood={mood} rate={rate} dutyRate={input.dutyRate} />
    </div>
  );
}

function Field({ label, hint, htmlFor, error, children }: { label: string; hint?: string; htmlFor: string; error?: string | null; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="text-sm font-semibold text-fg">
        {label}
      </label>
      {hint && <p className="mt-0.5 text-xs text-fg-2">{hint}</p>}
      <div className="mt-2">{children}</div>
      {error && <p className="mt-1.5 text-sm text-expensive">{error}</p>}
    </div>
  );
}
