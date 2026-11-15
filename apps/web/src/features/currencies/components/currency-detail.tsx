// 오른쪽 상세 — 오늘 환율 · 신호 · 환율 계산기(작업 0086) · 기간별 흐름(작업 0087) · 최저 · 최고 · 환산 예시 (빌드 때 받은 값만 · 없으면 이유)
import type { Fetched } from "@/shared/api";
import { currencyName, rangeOf, rateText, toUnit } from "@hav/shared/currency";
import type { FxHistory, FxRate } from "@hav/shared/fx";
import type { CurrencySignal } from "@hav/shared/signal";
import { TRAVEL_COUNTRIES, countriesOf } from "@hav/shared/travel";
import { LinkRow } from "@hav/ui/text/link-row";
import { SignalPin } from "@hav/ui/data/signal-pin";
import { CurrencyFlag } from "@hav/ui/data/currency-flag";
import { FreshnessNote } from "@hav/ui/feedback/freshness-note";
import { Converter } from "./converter";
import { describeCurrency } from "../lib/describe";
import { currencyListName, detailLine, yearStats } from "../lib/detail-view";
import { PeriodChart } from "./period-chart";
import { PeriodTable } from "./period-table";
import { ShareButton } from "./share-button";
import { periodRows, showsSummary, summaryOf } from "../lib/summary";
import { EmptyState } from "@hav/ui/feedback/empty-state";
import { StatTile } from "@hav/ui/data/stat-tile";

export type DetailData = { code: string; rate: FxRate | null; signal: Fetched<CurrencySignal>; history: Fetched<FxHistory>; problem: string | null };

export function CurrencyDetail({ code, rate, signal, history, problem }: DetailData) {
  const name = currencyName(code);
  if (!rate) {
    return (
      <EmptyState>{problem ?? `${name}(${code}) 환율이 아직 수집되지 않았습니다`}</EmptyState>
    );
  }
  const t = rateText(rate);
  const s = signal.ok ? signal.data : null;
  const days = history.ok ? toUnit(history.data.rates, rate.unit) : [];
  const range = rangeOf(days);
  const stats = yearStats(days);
  // 요약 · 기간별 표는 비교군 통화에만 먼저 (docs/geo-measurement.md)
  const first = showsSummary(code);
  const rows = first ? periodRows(days) : [];

  return (
    <div className="min-w-0">
      <p className="flex flex-wrap items-center gap-2 text-small text-fg-2">
        <CurrencyFlag currency={code} />
        <span className="font-semibold text-fg">{currencyListName(code)}</span> · {code}
        <span className="ml-auto">
          <ShareButton title={`${name} ${code} 환율 · Tripfx`} text={describeCurrency(code, rate, s?.signal ?? null)} />
        </span>
      </p>
      <FreshnessNote date={rate.date} className="mt-1" />
      <h1 className="mt-3 font-display text-[clamp(2.5rem,7vw,4.5rem)] leading-none font-normal tracking-tighter tabular-nums">
        {/* 제목만 읽어도 어떤 통화인지 (작업 0114) — 화면에는 바로 위 줄에 통화명이 있음 */}
        <span className="sr-only">{name}({code}) 환율 </span>
        <span className="text-figure">{t.value}</span>
        <span className="ml-2 text-title text-fg">{t.unit}</span>
      </h1>
      {/* 판정은 사이트 신호 규칙 그대로(최근 90일 백분위) — 핀은 글자만 · 한 줄에 기준일 · 출처 (예비 출처면 그 사실) */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        {s?.signal && <SignalPin signal={s.signal} />}
        <span className="text-small text-fg-2">
          {s ? detailLine({ signal: s.signal, percentile: s.percentile, windowDays: s.rule.windowDays, date: rate.date, source: rate.source }) : `신호를 받지 못했습니다 (${signal.ok ? "" : signal.reason}) · ${rate.date}`} · 예측 아님
        </span>
      </div>

      {first && <p className="mt-5 text-sm leading-relaxed text-fg-2">{summaryOf(name, code, rate, days, s ? { signal: s.signal, percentile: s.percentile, windowDays: s.rule.windowDays } : null)}</p>}

      <div className="mt-8">
        <Converter code={code} rate={rate} />
      </div>

      <div className="mt-10">
        {history.ok ? <PeriodChart rates={days} unitText={t.unit} lastTone={s?.signal ?? null} /> : <p className="border-t-2 border-line py-6 text-sm text-fg-2">1년 기록을 받지 못했습니다 ({history.reason})</p>}
      </div>

      {rows.length > 0 && <PeriodTable rows={rows} unit={rate.unit} />}

      {/* 1년 최저 · 최고 · 평균 — 받은 값으로만 (빈 날은 채우지 않음) */}
      <dl className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <StatTile label="1년 최저" value={range ? rateText({ baseRate: range.min.baseRate, unit: rate.unit }).value : "—"} sub={range && `${t.unit} · ${range.min.date}`} />
        <StatTile label="1년 최고" value={range ? rateText({ baseRate: range.max.baseRate, unit: rate.unit }).value : "—"} sub={range && `${t.unit} · ${range.max.date}`} />
        <StatTile label="1년 평균" value={stats ? rateText({ baseRate: stats.avg, unit: rate.unit }).value : "—"} sub={stats && `${t.unit} · 받은 ${days.length}일`} />
      </dl>
      <LinkRow>
        <a href={`/calc?currency=${code}`} className="hover:underline">
          이 통화로 직구 계산하기 →
        </a>
        {countriesOf(code).length === 1 && (
          <a href={`/prices?country=${countriesOf(code)[0]}#budget`} className="hover:underline">
            {TRAVEL_COUNTRIES[countriesOf(code)[0]]?.name} 여행 예산 계산 →
          </a>
        )}
        {countriesOf(code).length > 0 && (
          <a href="/prices" className="hover:underline">
            이 통화 쓰는 나라 물가 보기 →
          </a>
        )}
      </LinkRow>
    </div>
  );
}
