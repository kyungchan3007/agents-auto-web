// 통화 상세 — 새 디자인(작업 0219 · 시안 A): 머리(국기 라벨 → "○○(코드) 환율" → 큰 오늘 값 카운트업 → 상태 점 + 글) + 1년 최저 · 최고 · 평균 비행 경로 카드 / 오른쪽 탑승권 "실제로 바꿀 때"(따라옴) → 아래 가로 전체 1년 흐름 → 물가 링크
// 숫자는 빌드 때 받은 값만 (없으면 이유) · 판정은 사이트 신호 규칙(최근 90일 백분위) · 설명 문단 · 변화 표 · 공유는 화면에서 뺌 · 위쪽 검색 · 칩 · 맨 아래 목록은 둘러보기 틀(browse-layout)에 있음
import { MORE_LINK } from "@hav/ui/text/more-link";
import type { Fetched } from "@hav/shared/api";
import { currencyName, pegText, rateText, toUnit } from "@hav/shared/currency";
import type { FxHistory, FxRate } from "@hav/shared/fx";
import type { PriceLevels } from "@hav/shared/prices";
import type { CurrencySignal } from "@hav/shared/signal";
import { countriesOf } from "@hav/shared/travel";
import { pinBasis } from "@/shared/signal/signal-pin-text";
import { emptyProps, fxGiven } from "@hav/shared/fx-schedule";
import { DataEmpty } from "@hav/ui/feedback/data-empty";
import { FreshnessNote } from "@/shared/rate/freshness-note";
import { BigRateNumber } from "./header/big-rate-number";
import { Converter } from "../converter/converter";
import { CurrencyMore } from "../more/currency-more";
import { CurrencyKicker } from "./header/currency-kicker";
import { PeriodChart } from "../period-chart/period-chart";
import { RangeCard } from "./range/range-card";
import { SwitchFade } from "../switch/switch-fade";
import { FaqList } from "@hav/ui/data/faq-list";
import { detailFaq } from "./detail-faq";
import { currencyListName, yearStats } from "./detail-view";
import { bigRate } from "./range/redesign";

const DOT = { cheap: "bg-pin-cheap", normal: "bg-pin-line", expensive: "bg-pin-expensive" } as const;

export type DetailData = { code: string; rate: FxRate | null; signal: Fetched<CurrencySignal>; history: Fetched<FxHistory>; /** 물가 자료 — 쓰는 나라 물가 질문 (못 받았으면 null · 작업 0345) */ levels?: PriceLevels | null; problem: string | null; };

export function CurrencyDetail({ code, rate, signal, history, levels = null }: DetailData) {
  const name = currencyName(code);
  if (!rate) {
    return <DataEmpty {...emptyProps({ screen: "currency", name: `${name}(${code})`, given: fxGiven(code) })} />;
  }
  const t = rateText(rate);
  const big = bigRate(rate);
  const s = signal.ok ? signal.data : null;
  const days = history.ok ? toUnit(history.data.rates, rate.unit) : [];
  const stats = yearStats(days);
  const peg = pegText(code);
  const faq = detailFaq({ code, rate, signal, history, levels });

  return (
    <div className="min-w-0">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-x-12">
        <div className="min-w-0">
          {/* 환율 자리의 기준 — 통화를 고르면 화면이 이 줄이 메뉴 띠 아래 96px 근처에 오게 올라가고 · 칩의 국기가 이 줄의 국기 자리로 날아옴 (작업 0231) */}
          <div data-testid="currency-kicker">
            <CurrencyKicker code={code} label={`${currencyListName(code)} · ${code}`} />
          </div>
          <h1 data-testid="big-rate" className="mt-4 font-display font-extrabold tracking-display tabular-nums">
            <SwitchFade code={code} delay={100} className="block">
              <span className="block text-[1.375rem] text-fg-2 sm:text-[1.75rem]">
                {name}({code}) 환율
              </span>
            </SwitchFade>
            <span className="mt-1 block text-[clamp(3.25rem,9vw,6.5rem)] leading-[1.05] text-figure tabular-nums">
              <BigRateNumber code={code} value={big.value} digits={big.digits} suffix={t.unit === "원" ? "원" : ""} />
              {t.unit !== "원" && <span className="ml-1 text-city"> {t.unit}</span>}
            </span>
          </h1>

          {/* 판정은 사이트 신호 규칙 그대로(최근 90일 백분위) — 색 점 + 근거 숫자 한 줄 · 기준일 · 출처는 "실제로 바꿀 때" 카드 아래 줄에 늘 남음(FX-01 · 작업 0298: 판정 설명 두 줄은 지움) */}
          <SwitchFade code={code} delay={240} className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1">
            {s?.signal && (
              <span className="inline-flex items-center gap-2 font-bold text-fg">
                <span aria-hidden className={`size-2.5 rounded-full ${DOT[s.signal]}`} />
                {pinBasis(s.signal, s.percentile)}
              </span>
            )}
            {!s && <span className="text-small text-fg-2">{`신호를 받지 못했습니다${signal.ok ? "" : ` (${signal.reason})`}`}</span>}
          </SwitchFade>
          {/* 달러에 고정된 통화(디르함 · 리얄 · 바레인 디나르)에만 한 줄 — 나머지 통화는 보이지 않는 자리도 두지 않음 (작업 0298) */}
          {peg && (
            <p data-testid="peg-note" className="mt-2 text-small text-fg-2">
              {peg}
            </p>
          )}
          <FreshnessNote date={rate.date} className="mt-2" />
          {/* 한 줄 답 (작업 0345 · 시안 5-new) — 페이지에 이미 있는 값(오늘 값 · 1년 평균 · 1년 최저)으로만 */}
          {faq.answer && (
            <div data-testid="currency-answer" className="mt-5 border-l-4 border-sun pl-4">
              <p className="text-small text-fg-2">{faq.answer.label}</p>
              {/* 상자 높이 고정(작업 0366): 넓은 화면(lg) 한 줄 · 그보다 좁으면 두 줄 높이를 미리 잡음 — 통화를 바꿔도 상자 · 아래 카드가 움직이지 않음 */}
              <p className="mt-1 min-h-[2lh] text-[1.0625rem] leading-normal font-bold text-fg sm:text-[1.125rem] lg:min-h-[1lh]">{faq.answer.text}</p>
            </div>
          )}

          <div className="mt-8">
            <RangeCard code={code} stats={stats} rate={rate} unitText={t.unit} />
          </div>
        </div>
        {/* 오른쪽: 실제로 바꿀 때 카드 → 그 아래 "다른 나라 통화 보기"(작업 0356) · 버튼 아래선은 왼쪽 "1년 최저 · 최고" 카드 아래선(둘이 같은 줄 높이 · mt-auto) */}
        <div className="flex min-w-0 flex-col gap-4">
          {/* 카드만 감싸는 칸 — 따라오는(sticky) 환전 카드는 이 칸 안에서만 움직여 버튼을 덮지 않음 (칸은 남는 높이를 채우고 버튼이 그 아래) */}
          <div className="min-h-0 flex-1">
            <Converter code={code} rate={rate} />
          </div>
          <div className="mt-auto">
            <CurrencyMore />
          </div>
        </div>
      </div>

      <SwitchFade code={code} delay={300} className="mt-12 block">
        {history.ok ? <PeriodChart rates={days} unit={rate.unit} unitText={t.unit} lastTone={s?.signal ?? null} /> : <p className="py-6 text-sm text-fg-2">1년 기록을 받지 못했습니다 ({history.reason})</p>}
      </SwitchFade>

      {/* 링크가 없는 통화도 안 보이는 같은 링크로 자리를 잡아 아래 구간 간격이 같음 (작업 0292) */}
      <p className="mt-8">
        {countriesOf(code).length > 0 ? (
          <a href={`/prices?currency=${code}`} className={MORE_LINK}>
            이 통화 쓰는 나라 물가 보기 ›
          </a>
        ) : (
          <span aria-hidden className={`${MORE_LINK} invisible`}>
            이 통화 쓰는 나라 물가 보기 ›
          </span>
        )}
      </p>

      {/* 자주 묻는 질문 (작업 0345 · 시안 6-new) — 처음 두 개 펼침 · 같은 문항이 FAQPage 구조화 자료에도 들어감 */}
      {faq.items.length > 0 && (
        <section data-testid="currency-faq" aria-labelledby="currency-faq-t" className="mt-16 max-w-[44rem]">
          <h2 id="currency-faq-t" className="font-display text-[1.75rem] leading-tight font-extrabold tracking-display text-fg sm:text-[2.25rem]">
            {name}, 자주 묻는 질문
          </h2>
          <p className="mt-2 text-small text-fg-2">숫자는 {rate.date} 매매기준율(한국수출입은행) 기준입니다.</p>
          <FaqList items={faq.items} linkText="나라 물가 자세히 보기" track="faq_open_currency" />
        </section>
      )}
    </div>
  );
}
