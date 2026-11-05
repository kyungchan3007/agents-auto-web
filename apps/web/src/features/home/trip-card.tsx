// 여행지 칸 하나 — 숫자 · 신호는 빌드 때 받은 값만 · 없으면 "자료 없음" 글자 (FX-02 · TRV-02)
import { currencyName, rateText } from "@hav/shared/currency";
import type { FxRate } from "@hav/shared/fx";
import type { Signal } from "@hav/shared/signal";
import { TRAVEL_COUNTRIES, relativeText } from "@hav/shared/travel";
import { SIGNAL_TEXT, signalLabel } from "@hav/ui/signal-badge";
import type { Place } from "@hav/ui/three/geo";
import Link from "next/link";
import { CurrencyFlag } from "@hav/ui/currency-flag";
import { Title } from "@hav/ui/heading";
import { StatTile } from "@hav/ui/stat-tile";

export type TripStop = {
  place: Place & { country: string };
  rate: FxRate | null;
  signal: Signal | null;
  price: { relative: number; year: number } | null;
};

export function TripCard({ stop: s, active }: { stop: TripStop; active: boolean }) {
  const country = TRAVEL_COUNTRIES[s.place.country];
  const code = s.place.currency ?? "";
  const t = s.rate ? rateText(s.rate) : null;
  return (
    <>
    {/* 지금 도시만 테두리 빛 · 나머지는 조금 작게 — 글자를 흐리게 하면 대비 기준(4.5:1) 미달이라 투명도는 안 씀 (작업 0092) */}
    <div className={`w-full rounded-card bg-surface/80 p-6 backdrop-blur-md transition duration-500 sm:p-8 ${active ? "ring-1 ring-accent/50" : "scale-[0.97] ring-1 ring-line"}`}>
      <p className="flex items-center gap-2 text-sm text-fg-2">
        <CurrencyFlag currency={code} />
        {s.place.name} · {country?.name ?? s.place.country}
      </p>
      <Title as="h3" className="mt-3 text-fg">
        {currencyName(code)},{" "}
        {s.signal ? <span className={SIGNAL_TEXT[s.signal]}>오늘은 {signalLabel(s.signal)}.</span> : <span className="text-fg-2">판단할 자료가 모자랍니다.</span>}
      </Title>
      <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
        <StatTile label="오늘 환율" value={t ? `${t.value}${t.unit}` : "자료 없음"} className="bg-surface-2 p-4" valueClassName="text-base whitespace-nowrap sm:text-lg" />
        <StatTile label="물가 · 한국 대비" value={s.price ? relativeText(s.price.relative) : "자료 없음"} sub={s.price && <>{s.price.year}년 · 세계은행</>} className="bg-surface-2 p-4" valueClassName="text-base sm:text-lg" />
      </dl>
      <p className="mt-5 flex flex-wrap gap-x-5 gap-y-1 text-sm font-semibold text-accent">
        <Link href={`/currencies/${code}`} className="hover:underline">
          {currencyName(code)} 1년 흐름 →
        </Link>
        {s.price && (
          <Link href={`/prices?country=${s.place.country}#budget`} className="hover:underline">
            {country?.name ?? "이 나라"} 여행 예산 계산 →
          </Link>
        )}
        <Link href="/prices" className="hover:underline">
          다른 나라 물가 →
        </Link>
      </p>
    </div>
    </>
  );
}
