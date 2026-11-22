// 통화 상세 — 새 디자인(작업 0219 · 시안 A): 머리(국기 라벨 → "○○(코드) 환율" → 큰 오늘 값 카운트업 → 상태 점 + 글) + 1년 최저 · 최고 · 평균 비행 경로 카드 / 오른쪽 탑승권 "실제로 바꿀 때"(따라옴) → 아래 가로 전체 1년 흐름 → 물가 링크
// 숫자는 빌드 때 받은 값만 (없으면 이유) · 판정은 사이트 신호 규칙(최근 90일 백분위) · 설명 문단 · 변화 표 · 공유는 화면에서 뺌 · 위쪽 검색 · 칩 · 맨 아래 목록은 둘러보기 틀(browse-layout)에 있음
import type { Fetched } from "@/shared/api";
import { currencyName, pegText, rateText, toUnit } from "@hav/shared/currency";
import type { FxHistory, FxRate } from "@hav/shared/fx";
import type { CurrencySignal } from "@hav/shared/signal";
import { countriesOf } from "@hav/shared/travel";
import { pinBasis } from "@hav/ui/data/signal-pin";
import { EmptyState } from "@hav/ui/feedback/empty-state";
import { FreshnessNote } from "@hav/ui/feedback/freshness-note";
import { BigRateNumber } from "./big-rate-number";
import { Converter } from "./converter";
import { CurrencyKicker } from "./currency-kicker";
import { PeriodChart } from "./period-chart";
import { RangeCard } from "./range-card";
import { SwitchFade } from "./switch-fade";
import { currencyListName, verdictLines, verdictSub, yearStats } from "../lib/detail-view";
import { bigRate } from "../lib/redesign";

const DOT = { cheap: "bg-pin-cheap", normal: "bg-pin-line", expensive: "bg-pin-expensive" } as const;

export type DetailData = { code: string; rate: FxRate | null; signal: Fetched<CurrencySignal>; history: Fetched<FxHistory>; problem: string | null };

export function CurrencyDetail({ code, rate, signal, history, problem }: DetailData) {
  const name = currencyName(code);
  if (!rate) {
    return <EmptyState>{problem ?? `${name}(${code}) 환율이 아직 수집되지 않았습니다`}</EmptyState>;
  }
  const t = rateText(rate);
  const big = bigRate(rate);
  const s = signal.ok ? signal.data : null;
  const days = history.ok ? toUnit(history.data.rates, rate.unit) : [];
  const stats = yearStats(days);
  const lines = s ? verdictLines({ signal: s.signal, percentile: s.percentile, windowDays: s.rule.windowDays, date: rate.date, source: rate.source }) : (["", ""] as [string, string]);
  const peg = pegText(code);

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

          {/* 판정은 사이트 신호 규칙 그대로(최근 90일 백분위) — 색 점 + 근거 숫자 · 한 줄에 기준일 · 출처 (예비 출처면 그 사실) */}
          <SwitchFade code={code} delay={240} className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1">
            {s?.signal && (
              <span className="inline-flex items-center gap-2 font-bold text-fg">
                <span aria-hidden className={`size-2.5 rounded-full ${DOT[s.signal]}`} />
                {pinBasis(s.signal, s.percentile)}
              </span>
            )}
            <span className="text-small text-fg-2">
              <span className="block">{s ? lines[0] : `신호를 받지 못했습니다${signal.ok ? "" : ` (${signal.reason})`}`}</span>
              <span className="block">{s ? lines[1] : verdictSub(rate.date, rate.source)}</span>
            </span>
          </SwitchFade>
          {/* 셋째 줄 자리는 늘 같은 높이로 잡음 — 고정 통화가 아니어도 안 보이는 같은 글이 자리를 차지해 통화를 바꿔도 아래가 밀리지 않음 (작업 0289) */}
          <p data-testid="peg-note" className="mt-2 text-small text-fg-2">
            {peg ?? <span aria-hidden className="invisible">이 통화는 미국 달러에 고정된 통화라 달러와 같이 움직입니다</span>}
          </p>
          <FreshnessNote date={rate.date} className="mt-2" />

          <div className="mt-8">
            <RangeCard code={code} stats={stats} rate={rate} unitText={t.unit} />
          </div>
        </div>
        <div className="min-w-0">
          <Converter code={code} rate={rate} />
        </div>
      </div>

      <SwitchFade code={code} delay={300} className="mt-12 block">
        {history.ok ? <PeriodChart rates={days} unit={rate.unit} unitText={t.unit} lastTone={s?.signal ?? null} /> : <p className="py-6 text-sm text-fg-2">1년 기록을 받지 못했습니다 ({history.reason})</p>}
      </SwitchFade>

      {countriesOf(code).length > 0 && (
        <p className="mt-8">
          <a href={`/prices?currency=${code}`} className="text-body text-cheap hover:underline">
            이 통화 쓰는 나라 물가 보기 ›
          </a>
        </p>
      )}
    </div>
  );
}
