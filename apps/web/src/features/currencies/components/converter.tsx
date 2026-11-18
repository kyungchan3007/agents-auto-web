"use client";

// 실제로 바꿀 때 — 새 디자인(작업 0219 · 시안 A): 흰 탑승권 안 짙은 남색 칸 · 금액 입력 · 빠른 금액 칩 · 결과는 출발 안내판 글자판(B 모양) · 아래 매매기준율 안내
//   계산 기능은 그대로 (같은 입력 → 같은 값 · convert.ts) · 입력은 이 화면 상태에만 (보내지 않음 · 저장하지 않음) · 기준일 · 출처를 같이 (FX-01) · 송금 환율이 있으면 그 값도
//   결과 글자판은 처음 한 번만 넘어가고 값이 바뀌면 다시 넘어가지 않고 바로 바뀜 (FlapBoard 규칙) · 넓은 화면은 스크롤해도 따라옴(sticky) · 휴대폰은 끔
import { UnitInput } from "@hav/ui/form/field";
import { SectionTitle } from "@hav/ui/text/heading";
import { SOURCE_NAME } from "@hav/shared/currency";
import type { FxRate } from "@hav/shared/fx";
import { amountText, presets } from "../lib/convert";
import { useConverter } from "../hooks/use-converter";
import { ResultBoard } from "./result-board";

export function Converter({ code, rate }: { code: string; rate: FxRate }) {
  const { side, amount, result, remit, invalid, value, edit, pick } = useConverter(rate);
  const foreign = side === "foreign";
  const shown = invalid || !foreign ? "—" : `${value("won")}원`;
  return (
    <div className="rounded-[1.75rem] border border-line bg-card p-3 shadow-ticket lg:sticky lg:top-[calc(var(--hav-nav-h)+1rem)]">
      <section data-testid="converter" data-surface="elevated" aria-labelledby="converter-title" className="rounded-[1.25rem] bg-surface p-5 text-fg sm:p-6">
        <SectionTitle id="converter-title" className="text-city text-fg">
          실제로 바꿀 때
        </SectionTitle>
        <label className="mt-5 block">
          <span className="sr-only">{code} 금액</span>
          <UnitInput unit={code} inputMode="decimal" autoComplete="off" value={value("foreign")} onChange={edit("foreign")} onFocus={(e) => e.target.select()} className="h-14 text-xl font-semibold" aria-describedby="converter-note" />
        </label>
        <div data-testid="converter-board" aria-live="polite" className="mt-4 flex">
          <ResultBoard amount={invalid || !foreign || result == null ? null : Math.round(result)} label={shown} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="빠른 금액">
          {presets("foreign", rate).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => pick("foreign", p)}
              className={`rounded-pill border-2 px-3 py-1 text-small font-semibold transition-colors ${foreign && amount === p ? "border-sun bg-sun text-pin-ink" : "border-line text-fg hover:bg-card"}`}
            >
              {amountText(p, "foreign", rate)} {code}
            </button>
          ))}
        </div>
      </section>
      <p id="converter-note" className="mx-3 mt-4 mb-2 border-t-2 border-dashed border-line pt-4 text-small text-fg-2">
        {invalid ? (
          <span className="text-expensive">0 이상의 숫자만 넣어 주세요.</span>
        ) : (
          <>
            매매기준율 · {rate.date} · {SOURCE_NAME[rate.source]}
            {remit != null && result != null && foreign && <> · 송금으로 바꾸면 약 {amountText(remit, "won", rate)}원</>} · 실제 환전은 은행 · 환전소 수수료(우대율)에 따라 달라집니다
          </>
        )}
      </p>
    </div>
  );
}
