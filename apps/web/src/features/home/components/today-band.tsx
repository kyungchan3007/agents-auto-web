// 2 오늘 환율 — 하늘 종이 바탕(페이지와 같음 · 맨 위 사진 구간과 이어짐) · 왼쪽 3D 지구(생김새 그대로) · 오른쪽 "이번 주 가장 싸게 갈 수 있는 곳" 문장 · 울트라마린 큰 숫자 + 노란 형광펜 띠 (작업 0169 · 0175 네 번째 묶음: 울트라마린 바다 띠를 없앰)
// 오늘 환율이 없으면 큰 문장 대신 "오늘 환율을 아직 받지 못했습니다" · 숫자 칸 비움 (숫자를 지어내지 않음) · 판단은 사이트 신호 규칙(최근 90일 백분위)
import type { FxRate } from "@hav/shared/fx";
import { DateText } from "@hav/ui/text/date-text";
import { EmphText } from "@hav/ui/text/emph";
import { Eyebrow, Title } from "@hav/ui/text/heading";
import { GlobeLazy } from "@hav/ui/three/scene/lazy";
import { type Destination, NO_RATE_COPY, type SignalRow, cheapestCopy, cheapestDestination } from "../lib/destinations";
import { DESTINATIONS, EARTH_TEXTURE, SEOUL } from "../lib/places";

type Props = { rates: FxRate[]; signals: SignalRow[]; windowDays: number; problem: string | null };

export function TodayBand({ rates, signals, windowDays, problem }: Props) {
  const found = cheapestDestination(signals, rates, DESTINATIONS as Destination[]);
  const copy = found ? cheapestCopy(found, windowDays) : null;
  const source = found ? rates.find((r) => r.currency === found.rate.currency) : undefined;
  return (
    <section id="today" aria-labelledby="today-title" className="bg-surface px-4 py-14 text-fg sm:px-8 sm:py-20">
      <div className="mx-auto grid max-w-page items-center gap-10 lg:grid-cols-[440px_minmax(0,1fr)] lg:gap-16">
        {/* 지구 — 호 색 = 그 나라 통화 신호 · 3D 가 안 되면 이 칸만 빔 (글자는 그대로) */}
        <GlobeLazy
          className="mx-auto size-[260px] sm:size-[360px] lg:size-[440px]"
          origin={SEOUL}
          texture={EARTH_TEXTURE}
          arcs={DESTINATIONS.map((d) => ({ to: d, tone: signals.find((s) => s.currency === d.currency)?.signal ?? null }))}
        />
        <div className="min-w-0">
          <Eyebrow>오늘 환율</Eyebrow>
          {copy && found ? (
            <>
              <Title id="today-title" className="mt-3 text-cheap">
                <EmphText text={copy.headline} />
              </Title>
              <p className="mt-6 font-display text-poster font-normal tracking-tight tabular-nums text-cheap">
                <EmphText text={`${copy.value} / ${copy.per}`} />
              </p>
              <p className="mt-6 text-body text-fg-2">{copy.evidence}</p>
              {source?.source === "frankfurter" && <p className="mt-2 text-small text-fg-2">수출입은행 값을 받지 못해 예비 출처(Frankfurter) 값입니다 · 기준일 <DateText date={source.date} /></p>}
            </>
          ) : (
            <>
              <Title id="today-title" className="mt-3 text-cheap">
                {rates.length === 0 ? NO_RATE_COPY : "이번 주 가장 싼 곳을 판단할 신호가 아직 없습니다"}
              </Title>
              <p className="mt-6 text-body text-fg-2">
                {rates.length === 0 ? (problem ?? "환율이 아직 수집되지 않았습니다") : `최근 ${windowDays}일 자료가 모자라 도착지 신호를 내지 못했습니다`}
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
