// 통화 상세 — 새 디자인(작업 0219 · 시안 A): 머리(국기 라벨 → "○○(코드) 환율" → 큰 오늘 값 카운트업 → 상태 점 + 글) + 1년 최저 · 최고 · 평균 비행 경로 카드 / 오른쪽 탑승권 "실제로 바꿀 때"(따라옴) → 아래 가로 전체 1년 흐름 → 물가 링크
// 숫자는 빌드 때 받은 값만 (없으면 이유) · 판정은 사이트 신호 규칙(최근 90일 백분위) · 설명 문단 · 변화 표 · 공유는 화면에서 뺌 · 위쪽 검색 · 칩 · 맨 아래 목록은 둘러보기 틀(browse-layout)에 있음
import type { Fetched } from "@/shared/api";
import { currencyName, rateText, toUnit } from "@hav/shared/currency";
import type { FxHistory, FxRate } from "@hav/shared/fx";
import type { CurrencySignal } from "@hav/shared/signal";
import { countriesOf } from "@hav/shared/travel";
import { CurrencyFlag } from "@hav/ui/data/currency-flag";
import { pinBasis } from "@hav/ui/data/signal-pin";
import { EmptyState } from "@hav/ui/feedback/empty-state";
import { FreshnessNote } from "@hav/ui/feedback/freshness-note";
import { CountUp } from "@hav/ui/motion/count-up";
import { Eyebrow } from "@hav/ui/text/heading";
import { Converter } from "./converter";
import { PeriodChart } from "./period-chart";
import { RangeCard } from "./range-card";
import { currencyListName, detailLine, yearStats } from "../lib/detail-view";
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

  return (
    <div className="min-w-0">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-x-12">
        <div className="min-w-0">
          <Eyebrow>
            <span className="inline-flex items-center gap-2">
              <CurrencyFlag currency={code} className="h-4 w-6 shrink-0" />
              <span>
                {currencyListName(code)} · {code}
              </span>
            </span>
          </Eyebrow>
          <h1 data-testid="big-rate" className="mt-4 font-display font-extrabold tracking-display tabular-nums">
            <span className="block text-[1.5rem] text-fg-2 sm:text-[1.875rem]">
              {name}({code}) 환율
            </span>
            <span className="mt-1 block text-[clamp(3.25rem,9vw,6.5rem)] leading-[1.05] text-figure tabular-nums">
              <CountUp value={big.value} digits={big.digits} suffix={t.unit === "원" ? "원" : ""} />
              {t.unit !== "원" && <span className="ml-1 text-city"> {t.unit}</span>}
            </span>
          </h1>

          {/* 판정은 사이트 신호 규칙 그대로(최근 90일 백분위) — 색 점 + 근거 숫자 · 한 줄에 기준일 · 출처 (예비 출처면 그 사실) */}
          <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1">
            {s?.signal && (
              <span className="inline-flex items-center gap-2 font-bold text-fg">
                <span aria-hidden className={`size-2.5 rounded-full ${DOT[s.signal]}`} />
                {pinBasis(s.signal, s.percentile)}
              </span>
            )}
            <span className="text-small text-fg-2">
              {s ? detailLine({ signal: s.signal, percentile: s.percentile, windowDays: s.rule.windowDays, date: rate.date, source: rate.source }) : `신호를 받지 못했습니다 (${signal.ok ? "" : signal.reason}) · ${rate.date}`} · 예측 아님
            </span>
          </div>
          <FreshnessNote date={rate.date} className="mt-2" />

          <div className="mt-8">
            <RangeCard stats={stats} rate={rate} unitText={t.unit} />
          </div>
        </div>
        <div className="min-w-0">
          <Converter code={code} rate={rate} />
        </div>
      </div>

      <div className="mt-12">
        {history.ok ? <PeriodChart rates={days} unit={rate.unit} unitText={t.unit} lastTone={s?.signal ?? null} /> : <p className="py-6 text-sm text-fg-2">1년 기록을 받지 못했습니다 ({history.reason})</p>}
      </div>

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
