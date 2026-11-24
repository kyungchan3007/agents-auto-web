// 새 홈 첫 면 — 메뉴와 한 면으로 이어지는 파랑 · 가운데 큰 제목 "N월에 떠나세요"(월만 노랑) · 설명 한 줄 (작업 0217 · 시안 B)
// 여백(작업 0217 · 미리보기 뒤 고칠 것 1 · 2): 설명 문장 ↔ 탑승권 카드 = 시안 B/home.html(.hero 아래 300 − 카드 위로 250 = 50px · 휴대폰 230 − 190 = 40px)
//   화면 높이(작업 0217 · 고칠 것 2): 폭 lg(1024) 이상에서 높이 구간마다 큰 제목 글자 · 위아래 여백만 줄여 노트북 높이에서도 안내판 · 97% 줄 · 국기 칩 · 검색 칸이 첫 화면 안
//     구간 = 880 이하 · 881~1000 · 1001~1180 (겹치지 않게) · 1181 이상은 시안 그대로 · 폭 기준 배치(휴대폰 · 태블릿)는 그대로
// 작업 0347: 설명 문장 아래에 안내 문장 · 작은 줄(약 60px)이 끼어 구간마다 위 · 아래 여백 · 큰 제목 글자를 더 줄이고(880 이하는 "여행 타이밍" 작은 글도 숨김) 큰 제목은 40px 아래로 내려가지 않음
// 자료는 지금 그대로(travelTiming · travelTimingCopy · heroParts) — 지수가 없으면 큰 제목 대신 "아직 받지 못했습니다" (달을 지어내지 않음) · 사진 없음
import { Eyebrow } from "@hav/ui/text/heading";
import { HERO_GUIDE } from "./hero-guide";
import { type TravelTiming, heroParts, travelTimingCopy } from "./travel-timing";

export function HeroSection({ timing }: { timing: TravelTiming }) {
  const copy = travelTimingCopy(timing);
  const parts = heroParts(timing);
  return (
    <section data-testid="home-hero" data-surface="dark" aria-labelledby="timing-title" className="bg-surface px-4 pt-12 pb-10 text-center text-fg sm:px-8 sm:pt-16 sm:pb-[50px] lg:[@media(max-height:880px)]:pt-2 lg:[@media(max-height:880px)]:pb-2 lg:[@media(min-height:881px)_and_(max-height:1000px)]:pt-3 lg:[@media(min-height:881px)_and_(max-height:1000px)]:pb-4 lg:[@media(min-height:1001px)_and_(max-height:1180px)]:pt-5 lg:[@media(min-height:1001px)_and_(max-height:1180px)]:pb-8">
      <div className="mx-auto max-w-page">
        <Eyebrow className="text-fg-2! lg:[@media(max-height:880px)]:hidden">여행 타이밍</Eyebrow>
        {parts ? (
          <>
            <h1 id="timing-title" className="mt-5 font-display text-[clamp(3.5rem,11vw,9.4rem)] leading-[0.98] font-extrabold tracking-display text-fg lg:[@media(max-height:880px)]:mt-1 lg:[@media(max-height:880px)]:text-[clamp(2.75rem,min(11vw,7.5vh),9.4rem)] lg:[@media(min-height:881px)_and_(max-height:1000px)]:mt-2 lg:[@media(min-height:881px)_and_(max-height:1000px)]:text-[clamp(3.5rem,min(11vw,8vh),9.4rem)] lg:[@media(min-height:1001px)_and_(max-height:1180px)]:mt-3 lg:[@media(min-height:1001px)_and_(max-height:1180px)]:text-[clamp(3.5rem,min(11vw,10vh),9.4rem)]">
              <span data-testid="hero-month" className="text-sun">
                {parts.month}
              </span>
              에 <br />
              떠나세요
            </h1>
            <p className="mx-auto mt-7 max-w-[38em] text-body text-fg-2 sm:text-[1.125rem] lg:[@media(max-height:880px)]:mt-2 lg:[@media(min-height:881px)_and_(max-height:1000px)]:mt-3 lg:[@media(min-height:1001px)_and_(max-height:1180px)]:mt-4">{copy.message}</p>
            {/* 안내 문장 + 작은 줄 (작업 0347 · 시안 9-C) — 구간별로 위 여백만 줄임 · 서버 첫 그림에 들어감 */}
            <p data-testid="hero-guide" className="mx-auto mt-4 max-w-[40em] text-[1rem] font-bold text-fg sm:text-[1.0625rem] lg:[@media(max-height:880px)]:mt-1.5 lg:[@media(min-height:881px)_and_(max-height:1000px)]:mt-2">
              {HERO_GUIDE.lead}
            </p>
            <p data-testid="hero-free" className="mt-1 text-[0.8125rem] text-fg-2">
              {HERO_GUIDE.free}
            </p>
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
