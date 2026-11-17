// 오른쪽 상세 — 시안 순서(작업 0170 · Figma 02): 라벨 → 큰 숫자 → 판정 핀 + 한 줄 → 1년 최저 · 최고 · 평균 카드 3개 → 그래프 + 기간 칩 → 실제로 바꿀 때 → 물가 링크
// 숫자는 빌드 때 받은 값만 (없으면 이유) · 판정은 사이트 신호 규칙(최근 90일 백분위) · 설명 문단 · 변화 표 · 공유 · 국기는 시안에 없어 화면에서 뺌
import type { Fetched } from "@/shared/api";
import { currencyName, rangeOf, rateText, toUnit } from "@hav/shared/currency";
import type { FxHistory, FxRate } from "@hav/shared/fx";
import type { CurrencySignal } from "@hav/shared/signal";
import { countriesOf } from "@hav/shared/travel";
import { SignalPin } from "@hav/ui/data/signal-pin";
import { StatTile } from "@hav/ui/data/stat-tile";
import { EmptyState } from "@hav/ui/feedback/empty-state";
import { FreshnessNote } from "@hav/ui/feedback/freshness-note";
import { Eyebrow } from "@hav/ui/text/heading";
import { Converter } from "./converter";
import { PeriodChart } from "./period-chart";
import { currencyListName, detailLine, yearStats } from "../lib/detail-view";

export type DetailData = { code: string; rate: FxRate | null; signal: Fetched<CurrencySignal>; history: Fetched<FxHistory>; problem: string | null };

const won = (baseRate: number, unit: number) => {
  const t = rateText({ baseRate, unit });
  return `${t.value}${t.unit === "원" ? "원" : ` ${t.unit}`}`;
};

export function CurrencyDetail({ code, rate, signal, history, problem }: DetailData) {
  const name = currencyName(code);
  if (!rate) {
    return <EmptyState>{problem ?? `${name}(${code}) 환율이 아직 수집되지 않았습니다`}</EmptyState>;
  }
  const t = rateText(rate);
  const s = signal.ok ? signal.data : null;
  const days = history.ok ? toUnit(history.data.rates, rate.unit) : [];
  const range = rangeOf(days);
  const stats = yearStats(days);
  const cards: [string, number | undefined][] = [
    ["1년 최저", range?.min.baseRate],
    ["1년 최고", range?.max.baseRate],
    ["1년 평균", stats?.avg],
  ];

  return (
    <div className="min-w-0">
      <Eyebrow>
        {currencyListName(code)} · {code}
      </Eyebrow>
      <h1 className="mt-4 font-display text-[clamp(3.25rem,9vw,6.5rem)] leading-[1.05] font-extrabold tracking-display text-figure tabular-nums">
        {/* 제목만 읽어도 어떤 통화인지 (작업 0114) — 화면에는 바로 위 줄에 통화명이 있음 */}
        <span className="sr-only">{name}({code}) 환율 </span>
        {t.value}
        <span className="ml-1">{t.unit === "원" ? "원" : <span className="text-city"> {t.unit}</span>}</span>
      </h1>

      {/* 판정은 사이트 신호 규칙 그대로(최근 90일 백분위) — 핀에 근거 숫자 · 한 줄에 기준일 · 출처 (예비 출처면 그 사실) */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {s?.signal && <SignalPin signal={s.signal} percentile={s.percentile} />}
        <span className="text-small text-fg-2">
          {s ? detailLine({ signal: s.signal, percentile: s.percentile, windowDays: s.rule.windowDays, date: rate.date, source: rate.source }) : `신호를 받지 못했습니다 (${signal.ok ? "" : signal.reason}) · ${rate.date}`} · 예측 아님
        </span>
      </div>
      <FreshnessNote date={rate.date} className="mt-2" />

      {/* 1년 최저 · 최고 · 평균 — 받은 값으로만 (빈 날은 채우지 않음) */}
      <dl className="mt-8 grid gap-4 sm:grid-cols-3">
        {cards.map(([label, v]) => (
          <StatTile key={label} label={label} value={v === undefined ? "—" : won(v, rate.unit)} className="rounded-card bg-card px-5 py-4" valueClassName="text-[1.75rem] leading-tight" />
        ))}
      </dl>

      <div className="mt-8">
        {history.ok ? <PeriodChart rates={days} unit={rate.unit} unitText={t.unit} lastTone={s?.signal ?? null} /> : <p className="py-6 text-sm text-fg-2">1년 기록을 받지 못했습니다 ({history.reason})</p>}
      </div>

      <div className="mt-8">
        <Converter code={code} rate={rate} />
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
