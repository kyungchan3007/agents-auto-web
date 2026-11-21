// 소개 · 판단 기준 (작업 0115 · 이슈 #117) — 작업 0170 Figma 08: 큰 제목 + 기준 카드 6개 · 작업 0222: 사진 머리 → 사진 없는 머리(메뉴 아래 흰 면 · 라벨 · 큰 제목 · 새 디자인 시안 A 페이지 머리 모양) (2열 × 3줄) · 규칙 숫자는 원본(API rule · rules.ts)에서 읽어 카드 아래에 따로 적음
import type { Fetched } from "@/shared/api";
import { SiteNav } from "@/shared/site-nav";
import type { SignalList } from "@hav/shared/signal";
import { FadeUpGroup } from "@hav/ui/motion/fade-up";
import { PageFooter } from "@hav/ui/layout/page-footer";
import { SectionTitle, Title } from "@hav/ui/text/heading";
import Link from "next/link";
import { ABOUT_CARDS, type AboutCard } from "../lib/criteria";

/** 직구 판단 기준 — 기능 폴더끼리 직접 가져오지 않게 라우트에서 받음 */
export type DutyRules = { usList: number; other: number; source: { name: string; url: string; checked: string } };

/** 본문 — 링크가 있으면 그 낱말만 링크로 */
function bodyOf(c: AboutCard) {
  if (!c.link) return c.body;
  const [before, ...rest] = c.body.split(c.link.word);
  return (
    <>
      {before}
      <Link href={c.link.href} className="font-semibold text-cheap underline underline-offset-2 hover:text-fg">
        {c.link.word}
      </Link>
      {rest.join(c.link.word)}
    </>
  );
}

// 시안에는 규칙 숫자 영역이 없어 받은 값은 쓰지 않음 (라우트가 넘기는 모양은 그대로 둠)
export function AboutPage(_props: { signals: Fetched<SignalList>; duty: DutyRules }) {
  return (
    <>
      <SiteNav page="about" />
      <main id="main" tabIndex={-1} className="bg-surface text-fg">
        <section aria-label="소개 머리" data-testid="about-head" className="px-4 pt-10 sm:px-8 sm:pt-14">
          <div className="mx-auto max-w-page">
            <Title as="h1" size="page" aria-label="어떤 자료를, 어떤 기준으로 보여 주나요" className="text-cheap">
              <span aria-hidden className="block">어떤 자료를,</span> <span aria-hidden className="block">어떤 기준으로 보여 주나요</span>
            </Title>
          </div>
        </section>
        <div className="px-4 pt-[4.5rem] pb-10 sm:px-8 sm:pt-24">
        <FadeUpGroup className="mx-auto max-w-page">
          <ul className="grid gap-4 sm:grid-cols-2">
            {ABOUT_CARDS.map((c, i) => (
              <li key={c.id} data-testid="criteria-card" data-fu={Math.floor(i / 2)} className="rounded-card bg-card px-5 py-5">
                <SectionTitle className="text-[1.375rem] leading-tight text-cheap">{c.title}</SectionTitle>
                <p className="mt-3 text-body text-fg-2">{bodyOf(c)}</p>
              </li>
            ))}
          </ul>
        </FadeUpGroup>
        </div>
      </main>
      <PageFooter width="max-w-page">모든 숫자의 출처는 각 화면 아래에 적습니다</PageFooter>
    </>
  );
}
