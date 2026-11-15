// 직구 계산 결과 칸 — 그리기만 · 결과 옆에 환율 기준일 · 출처 (IMP-02) · "예상" 안내 (IMP-04)
import { SOURCE_NAME } from "@hav/shared/currency";
import { numberText } from "@hav/shared/format";
import type { FxRate } from "@hav/shared/fx";
import { Stamp } from "@hav/ui/data/stamp";
import { DateText } from "@hav/ui/text/date-text";
import type { CalcResult as Result } from "../lib/calc";
import type { RateSource } from "../lib/customs-rate";
import { RULES_SOURCE } from "../lib/rules";

const usd = (n: number) => numberText(n, { maximumFractionDigits: 2 });

export function CalcResult({ result: r, rate, source, dutyRate }: { result: Result | null; rate: FxRate | undefined; source?: RateSource; dutyRate: string }) {
  return (
    <div data-testid="calc-result" className="border-t-2 border-cheap pt-6 sm:pt-8" aria-live="polite">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-fg-2">원화로</p>
          <p className="mt-1 font-display text-[clamp(2rem,6vw,3.25rem)] leading-tight font-normal tracking-tighter tabular-nums">
            {r?.ok ? <span className="text-figure">{numberText(r.priceKrw)}</span> : <span className="text-fg-2">—</span>}
            <span className="ml-1.5 text-title">원</span>
          </p>
        </div>
        {/* 노란 도장 — 면세 한도 안일 때만 (해 노랑은 좋은 판정에만 · 넘으면 아래 글자가 주홍으로 알림) */}
        {r?.ok && !r.over && <Stamp className="shrink-0">면세 한도 안</Stamp>}
      </div>

      {!r && <p className="mt-6 text-base text-fg-2">물건 값을 넣으면 면세 한도 안인지 바로 보여 드립니다</p>}
      {r && !r.ok && <p className="mt-6 text-base font-semibold text-expensive">{r.reason}</p>}
      {r?.ok && (
        <>
          <div className="mt-6 h-2.5 overflow-hidden rounded-pill bg-line" role="img" aria-label={`면세 한도의 ${Math.round(r.ratio * 100)}%`}>
            <div className={`h-full rounded-pill ${r.over ? "bg-expensive" : r.ratio >= 0.8 ? "bg-normal" : "bg-cheap"}`} style={{ width: `${Math.min(100, r.ratio * 100)}%` }} />
          </div>
          <p className="mt-3 text-base text-fg">
            면세 한도 {r.limitUsd}달러 중 {usd(r.priceUsd)}달러 ·{" "}
            {r.over ? (
              <span className="font-semibold text-expensive">{usd(r.priceUsd - r.limitUsd)}달러 넘음 · 세금 붙음</span>
            ) : (
              <span className="font-semibold text-cheap">{usd(r.leftUsd)}달러 남음 · 세금 없음</span>
            )}
          </p>
          {r.tax && (
            <dl className="mt-6 grid gap-2 pt-1 text-sm">
              <Row k="과세 가격 (물건 값 + 국제 배송비)" v={r.tax.taxableKrw} />
              <Row k={`관세 (${dutyRate || "?"}%)`} v={r.tax.duty} />
              <Row k="부가세 10% ((과세 가격 + 관세) × 10%)" v={r.tax.vat} />
              <Row k="모두 합쳐 예상" v={r.tax.total} strong />
              {r.tax.duty == null && <p className="text-fg-2">관세율을 넣으면 관세 · 부가세 · 합계를 계산합니다</p>}
            </dl>
          )}
        </>
      )}

      <ul className="mt-8 space-y-1 text-small text-fg-2">
        <li>
          예상 금액입니다. 실제 세액은 관세청 과세환율 · 품목 분류로 정해집니다 · 개별소비세 등 다른 세금 · 같은 날 여러 건 합산은 빼고 계산
        </li>
        <li>
          {source?.kind === "customs" ? (
            <>환율 {source.label}</>
          ) : rate ? (
            <>
              환율 <DateText date={rate.date} /> 기준 · {SOURCE_NAME[rate.source]}
            </>
          ) : (
            "환율을 받지 못했습니다"
          )}{" "}
          · 면세 한도:{" "}
          <a href={RULES_SOURCE.url} className="underline underline-offset-2 hover:decoration-2">
            {RULES_SOURCE.name}
          </a>{" "}
          (<DateText date={RULES_SOURCE.checked} /> 확인)
        </li>
        <li>입력한 값은 이 화면 안에서만 계산하고 어디에도 보내지 않습니다</li>
      </ul>
    </div>
  );
}

function Row({ k, v, strong = false }: { k: string; v: number | null; strong?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-4 ${strong ? "pt-2 text-base font-semibold text-fg" : "text-fg-2"}`}>
      <dt>{k}</dt>
      <dd className="shrink-0 font-semibold text-fg">{v == null ? "—" : `${numberText(v)}원`}</dd>
    </div>
  );
}
