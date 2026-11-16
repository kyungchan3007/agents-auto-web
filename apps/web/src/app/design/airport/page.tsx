import type { Metadata } from "next";
import { AirportStory } from "@/features/home/components/airport-story";

// 시험판 — 스크롤하면 3D 공항을 따라 카메라가 이동 (작업 0184) · 개발용이라 검색에 내보내지 않음 (robots 가 /design 을 막음)
export const metadata: Metadata = { title: "공항 장면 시험판 · Tripfx", robots: { index: false, follow: false } };

export default function AirportPage() {
  return (
    <main>
      <header className="mx-auto max-w-3xl px-4 pt-16 pb-10 sm:px-6">
        <p className="text-sm font-semibold text-[#D9452B]">시험판 · 공항 장면</p>
        <h1 className="mt-2 text-4xl font-extrabold text-[#16246E] sm:text-5xl">스크롤하면 공항을 지나 이륙합니다</h1>
        <p className="mt-4 text-[#4A5A8C]">three.js 로 만든 미니어처 공항입니다. 아래로 내려 보세요.</p>
      </header>
      <AirportStory />
      <footer className="mx-auto max-w-3xl px-4 py-16 text-[#4A5A8C] sm:px-6">
        <p>공항 장면 끝 — 다음 정류장(환전소 · 세관 · 도착 도시)은 이 장면을 보고 정합니다.</p>
      </footer>
    </main>
  );
}
