// 여행지 칸 하나 — 숫자 · 신호는 빌드 때 받은 값만 · 없으면 "자료 없음" 글자 (FX-02 · TRV-02)
import { currencyName, rateText } from "@hav/shared/currency";
import type { FxRate } from "@hav/shared/fx";
import type { Signal } from "@hav/shared/signal";
import { TRAVEL_COUNTRIES, relativeText } from "@hav/shared/travel";
import { signalLabel } from "@hav/ui/signal-badge";
import type { Place } from "@hav/ui/three/geo";
import Link from "next/link";
import { CurrencyFlag } from "@/shared/currency-flag";
import { SIGNAL_TONE } from "@/shared/signal-tone";

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
      <h3 className="mt-3 text-title font-semibold tracking-tight text-fg">
        {currencyName(code)},{" "}
        {s.signal ? <span className={SIGNAL_TONE[s.signal]}>오늘은 {signalLabel(s.signal)}.</span> : <span className="text-fg-2">판단할 자료가 모자랍니다.</span>}
      </h3>
      <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-card bg-surface-2 p-4">
          <dt className="text-xs text-fg-2">오늘 환율</dt>
          <dd className="mt-1 text-base font-semibold whitespace-nowrap text-fg sm:text-lg">{t ? `${t.value}${t.unit}` : "자료 없음"}</dd>
        </div>
        <div className="rounded-card bg-surface-2 p-4">
          <dt className="text-xs text-fg-2">물가 · 한국 대비</dt>
          <dd className="mt-1 text-base font-semibold text-fg sm:text-lg">{s.price ? relativeText(s.price.relative) : "자료 없음"}</dd>
          {s.price && <dd className="mt-0.5 text-xs text-fg-2">{s.price.year}년 · 세계은행</dd>}
        </div>
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
