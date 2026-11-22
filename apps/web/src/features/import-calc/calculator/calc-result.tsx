// 직구 계산 결과 — 새 디자인(작업 0221 · 시안 A): 세관 꼬리표 한 장 — 위 남색 결론(도장 · 큰 금액 · 한도까지 막대) · 아래 영수증처럼 점선으로 나눈 내역 · 합계 · 예상 안내 (예전 작업 0170 · Figma 05 울트라마린 카드)
// 환율 기준 · 출처는 "적용 환율" 줄에 · 숫자는 계산 결과만 (받지 못하면 빈 값 · 이유) · 도장(기울기 그대로)은 면세 한도 안일 때만 (넘으면 같은 자리에 알림 글)
// 결과 금액은 입력에 따라 바뀌므로 카운트업하지 않음 (입력할 때마다 숫자가 움직이면 읽기 어려움) · 크기 안정(작업 0208) 유지 — 값이 바뀌어도 카드 · 줄 위치 고정
import { numberText } from "@hav/shared/format";
import type { FxRate } from "@hav/shared/fx";
import { Stamp } from "@hav/ui/data/stamp";
import { RollingNumber } from "@hav/ui/motion/rolling-number";
import { SOURCE_NAME } from "@hav/shared/currency";
import type { ReactNode } from "react";
import type { CalcResult as Result } from "./calc";
import type { RateSource } from "../common/customs-rate";

// 원화 금액 — 값이 있으면 굴러가는 숫자(자리 이름 slot) · 없으면 "—" (작업 0227 · 값이 바뀌면 자리마다 굴러 맞춰짐 · 처음 값은 그대로)
const won = (v: number | null, slot: string): ReactNode => (v == null ? "—" : <RollingNumber slot={slot} value={v} suffix="원" />);

export function CalcResult({ result: r, rate, source, dutyRate }: { result: Result | null; rate: FxRate | undefined; source?: RateSource; dutyRate: string }) {
  const rateText = source ? source.label : rate ? `${rate.date} 기준 · ${SOURCE_NAME[rate.source]}` : "환율을 받지 못했습니다";
  // 큰 숫자 = "모두 합쳐 예상"(합계) — 한도 안이면 합계가 물건 값 그대로 · 한도를 넘었는데 합계를 계산할 수 없는 상태(관세율 없음)는 물건 값 그대로 둠(숫자를 지어내지 않음 · 사용자 결정 대기 · 작업 0291)
  const big = r?.ok ? (r.tax?.total ?? r.priceKrw) : 0;
  return (
    // 좁은 폭은 내역 줄이 줄바꿈돼 높이가 달라지므로 폭 구간별 실측 높이(작업 0221 사용자 지적 · 320~427) · 넓은 화면은 입력 묶음과 같은 높이 (바깥은 늘어나는 칸 · 안쪽을 겹쳐 넘치는 글은 칸 안에서 스크롤 · 작업 0200) · 휴대폰은 결과가 나온 상태 높이를 최소로 — 빈칸 없이 · 빈 값 · 오류 · 한도 넘음에도 아래 칸이 움직이지 않게 (작업 0208)
    <div data-testid="calc-result" className="relative min-h-[36rem] min-[400px]:max-[428px]:min-h-[37.25rem] min-[361px]:max-[400px]:min-h-[38.5rem] min-[330px]:max-[361px]:min-h-[41.25rem] max-[330px]:min-h-[42.5rem] overflow-hidden rounded-[1.5rem] border border-line bg-card shadow-ticket lg:min-h-[36.3rem]" aria-live="polite">
      <div className="flex h-full min-h-[inherit] flex-col">
        <div data-testid="calc-tag-top" className="relative bg-pin-ink px-6 pt-5 pb-6 text-foam">
          {/* 도장 · 넘음 글은 같은 높이 칸에 — 한도 안 · 밖이 바뀌어도 아래 줄이 같은 자리 (작업 0208) */}
          <div className="flex h-14 flex-col items-start justify-center">
            {r?.ok && (r.over ? <p className="text-[1.125rem] font-semibold text-sun">면세 한도 ${r.limitUsd} 넘음 · 세금 붙음</p> : <Stamp>면세 한도 안 (${r.limitUsd})</Stamp>)}
            {/* 합계를 못 구할 때만(한도 넘음 · 관세율 없음) 큰 숫자가 물건 값임을 알림 — 같은 h-14 칸 안이라 아래 줄이 밀리지 않음 (작업 0296) */}
            {r?.ok && r.over && r.tax?.total == null && <p className="mt-0.5 text-[0.75rem] leading-[1.2] text-foam">아래 금액은 물건 값입니다 · 관세율을 넣으면 합계로 바뀝니다</p>}
          </div>
          <p className="mt-2 font-display text-[clamp(2.25rem,6vw,3.5rem)] leading-tight font-extrabold tracking-display text-foam tabular-nums">
            {/* 긴 금액(열두 글자 넘음)은 휴대폰에서 글자를 줄여 한 줄 — 줄이 바뀌어 카드가 커지지 않게 (작업 0208 lead 리뷰) */}
            {r?.ok ? <RollingNumber slot="big" value={big} suffix="원" className={`${numberText(big)}원`.length > 12 ? "max-sm:text-[1.75rem]" : ""} /> : "—원"}
          </p>
          {/* 한도까지 막대 — 채움 = 물건 값 ÷ 한도 (넘으면 가득) · 글은 항상 같은 한 줄 높이 */}
          <div data-testid="calc-limit-bar" data-ratio={r?.ok ? r.ratio : 0} className="mt-4 h-10">
            {r?.ok ? (
              <>
                <div aria-hidden className="h-2 overflow-hidden rounded-full bg-foam/20">
                  <div data-testid="calc-limit-fill" className={`h-full rounded-full ${r.over ? "bg-pin-expensive" : "bg-sun"}`} style={{ width: `${Math.min(1, r.ratio) * 100}%` }} />
                </div>
                <p className="mt-1.5 flex justify-between text-small font-semibold tabular-nums">
                  <RollingNumber slot="usd" prefix="$" value={Math.round(r.priceUsd)} />
                  <span>한도 ${r.limitUsd}</span>
                </p>
              </>
            ) : (
              <>
                {!r && <p className="text-small">물건 값을 넣으면 면세 한도 안인지 바로 보여 드립니다</p>}
                {r && !r.ok && <p className="text-small font-semibold text-sun">{r.reason}</p>}
              </>
            )}
          </div>
        </div>
        <div data-testid="calc-tag-bottom" className="flex-1 bg-card px-6 py-5 text-fg">
          {r?.ok && (
            <dl className="text-small">
              <Row k="물건 값 (원화)" v={won(r.priceKrw, "price")} />
              <Row k="과세 가격 (물건 값 + 국제 배송비)" v={r.tax ? won(r.tax.taxableKrw, "taxable") : "한도 안이라 계산하지 않음"} />
              <Row k={`관세${r.tax && dutyRate ? ` (${dutyRate}%)` : ""}`} v={won(r.tax ? r.tax.duty : 0, "duty")} />
              <Row k="부가세 10% ((과세 가격 + 관세) × 10%)" v={won(r.tax ? r.tax.vat : 0, "vat")} />
              <Row k="적용 환율" v={rateText} />
              <Row k="모두 합쳐 예상" v={r.tax ? (r.tax.total === null ? "— 관세율을 넣으면 계산" : won(r.tax.total, "total")) : won(r.priceKrw, "total")} total soft={r.tax?.total === null} />
            </dl>
          )}
          <p className="mt-4 text-small text-fg-2">예상 금액입니다. 실제 세금은 통관 때 정해집니다.</p>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v, total = false, soft = false }: { k: string; v: ReactNode; total?: boolean; soft?: boolean }) {
  return (
    <div className={`flex flex-wrap items-baseline justify-between gap-x-4 py-2.5 ${total ? "mt-1 border-t-2 border-fg pt-4 text-[1rem] font-bold" : "border-b border-dashed border-line"}`}>
      <dt className={total ? "" : "text-fg-2"}>{k}</dt>
      <dd className={`text-right ${total ? `${soft ? "text-[1rem]" : "text-[1.375rem]"} font-bold tabular-nums` : "font-semibold"}`}>{v}</dd>
    </div>
  );
}
