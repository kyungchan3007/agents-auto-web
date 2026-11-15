// 소개 · 판단 기준 (작업 0115 · 이슈 #117) — 작업 0170 Figma 08: 큰 제목 + 기준 카드 6개 (2열 × 3줄) · 규칙 숫자는 원본(API rule · rules.ts)에서 읽어 카드 아래에 따로 적음
import type { Fetched } from "@/shared/api";
import { SiteNav } from "@/shared/site-nav";
import type { SignalList } from "@hav/shared/signal";
import { PageFooter } from "@hav/ui/layout/page-footer";
import { PhotoHeader } from "@hav/ui/layout/photo-header";
import { Eyebrow, SectionTitle, Title } from "@hav/ui/text/heading";
import { ABOUT_CARDS } from "../lib/criteria";

/** 직구 판단 기준 — 기능 폴더끼리 직접 가져오지 않게 라우트에서 받음 */
export type DutyRules = { usList: number; other: number; source: { name: string; url: string; checked: string } };

// 시안에는 규칙 숫자 영역이 없어 받은 값은 쓰지 않음 (라우트가 넘기는 모양은 그대로 둠)
export function AboutPage(_props: { signals: Fetched<SignalList>; duty: DutyRules }) {
  return (
    <>
      <SiteNav page="about" />
      <main className="bg-surface text-fg">
        <PhotoHeader name="plane-sunset" alt="노을 속을 나는 비행기" veil="light" priority position="70% center">
          <Eyebrow>소개</Eyebrow>
          <Title as="h1" size="page" aria-label="어떤 자료를, 어떤 기준으로 보여 주나요" className="mt-6 text-cheap">
            <span aria-hidden className="block">어떤 자료를,</span> <span aria-hidden className="block">어떤 기준으로 보여 주나요</span>
          </Title>
        </PhotoHeader>
        <div className="mx-auto max-w-page px-4 pt-6 pb-10 sm:px-8">
          <ul className="grid gap-4 sm:grid-cols-2">
            {ABOUT_CARDS.map((c) => (
              <li key={c.id} data-testid="criteria-card" className="rounded-card bg-card px-5 py-5">
                <SectionTitle className="text-[1.375rem] leading-tight text-cheap">{c.title}</SectionTitle>
                <p className="mt-3 text-body text-fg-2">{c.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </main>
      <PageFooter width="max-w-page">모든 숫자의 출처는 각 화면 아래에 적습니다</PageFooter>
    </>
  );
}
