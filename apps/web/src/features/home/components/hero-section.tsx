// 새 홈 첫 면 — 메뉴와 한 면으로 이어지는 파랑 · 가운데 큰 제목 "N월에 떠나세요"(월만 노랑) · 설명 한 줄 (작업 0217 · 시안 B)
// 자료는 지금 그대로(travelTiming · travelTimingCopy · heroParts) — 지수가 없으면 큰 제목 대신 "아직 받지 못했습니다" (달을 지어내지 않음) · 사진 없음
import { Eyebrow } from "@hav/ui/text/heading";
import { type TravelTiming, heroParts, travelTimingCopy } from "../lib/travel-timing";

export function HeroSection({ timing }: { timing: TravelTiming }) {
  const copy = travelTimingCopy(timing);
  const parts = heroParts(timing);
  return (
    <section data-testid="home-hero" data-surface="dark" aria-labelledby="timing-title" className="bg-surface px-4 pt-12 pb-12 text-center text-fg sm:px-8 sm:pt-16 sm:pb-20">
      <div className="mx-auto max-w-page">
        <Eyebrow className="text-fg-2!">여행 타이밍</Eyebrow>
        {parts ? (
          <>
            <h1 id="timing-title" className="mt-5 font-display text-[clamp(3.6rem,11vw,9.4rem)] leading-[0.98] font-extrabold tracking-display text-fg">
              <span data-testid="hero-month" className="text-sun">
                {parts.month}
              </span>
              에 <br />
              떠나세요
            </h1>
            <p className="mx-auto mt-7 max-w-[38em] text-body text-fg-2 sm:text-[1.125rem]">{copy.message}</p>
          </>
        ) : (
          <h1 id="timing-title" className="mt-5 font-display text-title font-extrabold tracking-display text-fg-2">
            {copy.message}
          </h1>
        )}
      </div>
    </section>
  );
}
