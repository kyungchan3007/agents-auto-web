import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/shared/site-nav";
import { Eyebrow, Title } from "@hav/ui/text/heading";
import { PageFooter } from "@hav/ui/layout/page-footer";

// 없는 주소 — 기본 화면은 영어("This page could not be found")라 한국어로 (사용자에게 보이는 글은 모두 한국어)
export const metadata: Metadata = { title: "없는 페이지 · Flapfx", robots: { index: false } };

const LINKS = [
  { href: "/flights", label: "여행 타이밍" },
  { href: "/", label: "오늘 환율" },
  { href: "/currencies", label: "통화" },
  { href: "/prices", label: "여행 물가" },
  { href: "/calc", label: "직구 계산" },
];

// 세부 정리(작업 0249 · 14번): 제목 마침표 빼고 · 링크는 다른 페이지와 같은 밑줄 + › · 첫 메뉴 "여행 타이밍" 추가 · 공통 바닥 띠
export default function NotFound() {
  return (
    <>
      <SiteNav page="home" />
      <main id="main" tabIndex={-1} className="bg-surface px-4 pt-24 pb-16 text-fg sm:px-8">
        <div className="mx-auto max-w-page">
          <Eyebrow>404</Eyebrow>
          <Title as="h1" size="page" className="mt-3">
            찾는 페이지가
            <br />
            없습니다
          </Title>
          <p className="mt-6 text-lead text-fg-2">주소가 바뀌었거나 잘못 입력되었을 수 있습니다.</p>
          <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="border-b-2 border-cheap pb-0.5 text-body font-semibold text-cheap hover:text-fg">
                {l.label} ›
              </Link>
            ))}
          </div>
        </div>
      </main>
      <PageFooter width="max-w-page">
        모든 숫자의 출처는 각 화면 아래에 적습니다 · <Link href="/about">소개 · 판단 기준</Link>
      </PageFooter>
    </>
  );
}
