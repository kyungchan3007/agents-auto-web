"use client";
// 공항 시험 장면 — 스크롤하면 카메라가 공항을 따라 이동 · 설명 카드는 글자(HTML)로 위에 올림 (작업 0184)
//   three.js 는 장면 훅이 실행될 때만 불러옴 (홈 무게 그대로) · 움직임 줄이기면 고정 장면 하나
import { useScrollProgress } from "../hooks/use-scroll-progress";
import { AirportScene } from "./airport-scene";

const CARDS = [
  { place: "터미널", title: "출발 전에 오늘 환율부터", body: "Tripfx 는 평일 12시에 한국수출입은행 환율을 받아, 지금 싼 편인지 알려 줍니다." },
  { place: "관제탑", title: "최근 90일 중 어디쯤인지", body: "오늘 값이 최근 90일 가운데 낮은 편인지, 보통인지, 높은 편인지 판정합니다." },
  { place: "활주로", title: "떠날 달은 항공료 지수로", body: "통계청 국제항공료 물가지수로 1년 중 항공료가 싼 달을 보여 줍니다." },
  { place: "이륙", title: "다음 정류장은 환전소", body: "시험판이라 공항 장면만 만들었습니다. 환전소 · 세관 · 도착 도시는 아직 없습니다." },
];

export function AirportStory() {
  const { wrap, progress, stop } = useScrollProgress();

  return (
    <div ref={wrap} className="relative h-[500vh] motion-reduce:h-screen">
      <div className="sticky top-0 h-screen overflow-hidden">
        <AirportScene progress={progress} />
        <ol className="pointer-events-none absolute inset-x-4 bottom-6 sm:inset-x-auto sm:bottom-10 sm:left-10 sm:w-[22rem]">
          {CARDS.map((c, i) => (
            <li
              key={c.place}
              aria-current={i === stop ? "step" : undefined}
              className={`absolute bottom-0 w-full rounded-lg bg-white/95 p-5 shadow-[0_6px_0_#16246E] ring-2 ring-[#16246E] transition-[opacity,translate] duration-500 ${
                i === stop ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
              }`}
            >
              <p className="text-sm font-semibold text-[#D9452B]">
                {i + 1} / {CARDS.length} · {c.place}
              </p>
              <h2 className="mt-1 text-xl font-extrabold text-[#16246E]">{c.title}</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-[#4A5A8C]">{c.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
