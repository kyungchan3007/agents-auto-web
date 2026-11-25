"use client";

// 실제로 바꿀 때 — 새 디자인(작업 0219 · 시안 A): 흰 탑승권 안 짙은 남색 칸 · 금액 입력 · 빠른 금액 칩 · 결과는 출발 안내판 글자판(B 모양) · 아래 매매기준율 안내
//   계산 기능은 그대로 (같은 입력 → 같은 값 · convert.ts) · 입력은 이 화면 상태에만 (보내지 않음 · 저장하지 않음) · 기준일 · 출처를 같이 (FX-01) · 송금 환율이 있으면 그 값도
//   빠른 금액 칩 네 개는 같은 폭 한 줄(작업 0248 · 9번)
//   결과 글자판은 통화를 바꿀 때 직전 값에서 칸마다 굴러감(0227 굴러가는 숫자 · 작업 0231) · 넓은 화면은 스크롤해도 따라옴(sticky) · 휴대폰은 끔
import { UnitInput } from "@hav/ui/form/field";
import { SectionTitle } from "@hav/ui/text/heading";
import { SOURCE_NAME } from "@hav/shared/currency";
import type { FxRate } from "@hav/shared/fx";
import { amountText, boardAmount, presets } from "./convert";
import { useConverter } from "./use-converter";
import { useSwitchFrom } from "../switch/use-switch-from";
import { ResultBoard } from "./result-board";

export function Converter({ code, rate }: { code: string; rate: FxRate }) {
  const { side, amount, result, remit, invalid, value, edit, pick } = useConverter(rate);
  const from = useSwitchFrom(code); // 통화를 바꿀 때 직전 글자판 값에서 굴러 시작 (작업 0231)
  const foreign = side === "foreign";
  const shown = invalid || !foreign ? "—" : `${value("won")}원`;
  return (
    <div data-testid="converter-card" className="rounded-[1.5rem] border border-line bg-card p-3 shadow-ticket lg:sticky lg:top-[calc(var(--hav-nav-h)+1rem)]">
      <section data-testid="converter" data-surface="elevated" aria-labelledby="converter-title" className="rounded-[1.5rem] bg-surface p-5 text-fg sm:p-6">
        <SectionTitle id="converter-title" className="text-city text-fg">
          실제로 바꿀 때
        </SectionTitle>
        <label className="mt-5 block">
          <span className="sr-only">{code} 금액</span>
          <UnitInput unit={code} inputMode="decimal" autoComplete="off" value={value("foreign")} onChange={edit("foreign")} onFocus={(e) => e.target.select()} className="h-14 text-xl font-semibold" aria-describedby="converter-note" />
        </label>
        <div data-testid="converter-board" aria-live="polite" className="mt-4 flex">
          <ResultBoard amount={boardAmount(invalid, foreign, result)} label={shown} from={from?.won ?? null} />
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2" role="group" aria-label="빠른 금액">
          {presets("foreign", rate).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => pick("foreign", p)}
              className={`tap-44 rounded-pill border-2 px-1 py-1 text-center text-small font-semibold whitespace-nowrap transition-colors ${foreign && amount === p ? "border-sun bg-sun text-pin-ink" : "border-line text-fg hover:bg-card"}`}
            >
              {amountText(p, "foreign", rate)} {code}
            </button>
          ))}
        </div>
      </section>
      <div id="converter-note" className="mx-3 mt-4 mb-2 border-t-2 border-dashed border-line pt-4 text-small text-fg-2">
        {/* 기준일 · 출처 줄은 금액이 틀려도 늘 남김(FX-01 · 작업 0298) — 틀린 입력에서는 송금 글만 안 보이게(자리는 그대로) */}
        <p className="m-0">
          매매기준율 · {rate.date} · {SOURCE_NAME[rate.source]}
          {invalid ? (
            <span aria-hidden className="invisible"> · 송금으로 바꾸면 약 000,000원</span>
          ) : (
            remit != null && result != null && foreign && <> · 송금으로 바꾸면 약 {amountText(remit, "won", rate)}원</>
          )}{" "}
          · 실제 환전은 은행 · 환전소 수수료(우대율)에 따라 달라집니다
        </p>
        {/* 오류 글은 따로 한 줄 — 늘 한 줄 높이를 잡아 오류가 떠도 아래가 밀리지 않음 */}
        <p role="alert" className="m-0 mt-1 min-h-5 text-expensive">
          {invalid ? "0 이상의 숫자만 넣어 주세요." : null}
        </p>
      </div>
    </div>
  );
}
