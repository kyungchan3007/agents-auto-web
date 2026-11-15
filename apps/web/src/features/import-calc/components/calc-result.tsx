// 직구 계산 결과 — 시안(작업 0170 · Figma 05): 울트라마린 카드 · 노란 윤곽 도장(면세 한도 안) · 노란 큰 숫자 · 흰 글 5줄 + 예상 안내
// 환율 기준 · 출처는 "적용 환율" 줄에 · 숫자는 계산 결과만 (받지 못하면 빈 값 · 이유) · 도장은 면세 한도 안일 때만 (넘으면 숫자 아래 줄이 알림)
import { numberText } from "@hav/shared/format";
import type { FxRate } from "@hav/shared/fx";
import { Stamp } from "@hav/ui/data/stamp";
import { SOURCE_NAME } from "@hav/shared/currency";
import type { CalcResult as Result } from "../lib/calc";
import type { RateSource } from "../lib/customs-rate";

const won = (v: number | null) => (v == null ? "—" : `${numberText(v)}원`);

export function CalcResult({ result: r, rate, source, dutyRate }: { result: Result | null; rate: FxRate | undefined; source?: RateSource; dutyRate: string }) {
  const rateText = source ? source.label : rate ? `${rate.date} 기준 · ${SOURCE_NAME[rate.source]}` : "환율을 받지 못했습니다";
  return (
    <div data-testid="calc-result" className="rounded-card bg-pin-cheap px-6 py-6 text-foam" aria-live="polite">
      {r?.ok && !r.over && (
        <Stamp>면세 한도 안 (${r.limitUsd})</Stamp>
      )}
      {r?.ok && r.over && <p className="text-[1.125rem] font-semibold text-sun">면세 한도 ${r.limitUsd} 넘음 · 세금 붙음</p>}
      <p className={`font-display text-[clamp(2.25rem,6vw,3.5rem)] leading-tight font-extrabold tracking-display text-sun tabular-nums ${r?.ok ? "mt-6" : ""}`}>
        {r?.ok ? `${numberText(r.priceKrw)}원` : "—원"}
      </p>
      {!r && <p className="mt-4 text-small">물건 값을 넣으면 면세 한도 안인지 바로 보여 드립니다</p>}
      {r && !r.ok && <p className="mt-4 text-small font-semibold text-sun">{r.reason}</p>}
      {r?.ok && (
        <dl className="mt-4 space-y-3 text-small">
          <Row k="물건 값 (원화)" v={won(r.priceKrw)} />
          <Row k="과세 가격 (물건 값 + 국제 배송비)" v={r.tax ? won(r.tax.taxableKrw) : "— 한도 안이라 계산 안 함"} />
          <Row k={`관세${r.tax && dutyRate ? ` (${dutyRate}%)` : ""}`} v={r.tax ? won(r.tax.duty) : "0원"} />
          <Row k="부가세 10% ((과세 가격 + 관세) × 10%)" v={r.tax ? won(r.tax.vat) : "0원"} />
          {r.tax && <Row k="모두 합쳐 예상" v={won(r.tax.total)} />}
          <Row k="적용 환율" v={rateText} />
        </dl>
      )}
      <p className="mt-4 text-small">예상 금액입니다. 실제 세금은 통관 때 정해집니다.</p>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4">
      <dt>{k}</dt>
      <dd className="text-right">{v}</dd>
    </div>
  );
}
