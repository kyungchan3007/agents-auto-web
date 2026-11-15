"use client";

// 실제로 바꿀 때 — 시안(작업 0170 · Figma 02): 흰 카드 · Gasoek 제목 · 외화 입력칸 "=" 노란 원화 결과칸 · 빠른 금액 칩 · 한 줄 안내
//   입력은 이 화면 상태에만 (보내지 않음 · 저장하지 않음) · 기준일 · 출처를 같이 (FX-01) · 송금 환율이 있으면 그 값도 · 없으면 그 값은 숨김
import { SectionTitle } from "@hav/ui/text/heading";
import { SOURCE_NAME } from "@hav/shared/currency";
import type { FxRate } from "@hav/shared/fx";
import { UnitInput } from "@hav/ui/form/field";
import { amountText, presets } from "../lib/convert";
import { useConverter } from "../hooks/use-converter";

export function Converter({ code, rate }: { code: string; rate: FxRate }) {
  const { side, amount, result, remit, invalid, value, edit, pick } = useConverter(rate);
  const foreign = side === "foreign";
  return (
    <section data-testid="converter" aria-labelledby="converter-title" className="rounded-card bg-card p-6 sm:p-8">
      <SectionTitle id="converter-title" className="text-city text-cheap">
        실제로 바꿀 때
      </SectionTitle>
      <div className="mt-5 grid items-center gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <label className="block">
          <span className="sr-only">{code} 금액</span>
          <UnitInput unit={code} inputMode="decimal" autoComplete="off" value={value("foreign")} onChange={edit("foreign")} onFocus={(e) => e.target.select()} className="h-14 text-xl font-semibold" aria-describedby="converter-note" />
        </label>
        <span aria-hidden className="text-center text-city font-semibold text-cheap">
          =
        </span>
        <p aria-live="polite" className="flex h-14 items-center rounded-field bg-sun px-5 text-xl font-semibold tabular-nums text-pin-ink">
          {invalid || !foreign ? "—" : `${value("won")}원`}
        </p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="빠른 금액">
        {presets("foreign", rate).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => pick("foreign", p)}
            className={`rounded-pill border-2 px-3 py-1 text-small transition-colors ${foreign && amount === p ? "border-cheap bg-cheap text-on-accent" : "border-cheap text-cheap hover:bg-surface-2"}`}
          >
            {amountText(p, "foreign", rate)} {code}
          </button>
        ))}
      </div>
      <p id="converter-note" className="mt-4 text-small text-fg-2">
        {invalid ? (
          <span className="text-expensive">0 이상의 숫자만 넣어 주세요.</span>
        ) : (
          <>
            매매기준율 · {rate.date} · {SOURCE_NAME[rate.source]}
            {remit != null && result != null && foreign && <> · 송금으로 바꾸면 약 {amountText(remit, "won", rate)}원</>} · 실제 환전은 은행 · 환전소 수수료(우대율)에 따라 달라집니다
          </>
        )}
      </p>
    </section>
  );
}
