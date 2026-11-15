// 소개 · 판단 기준 (작업 0115 · 이슈 #117) — 작업 0170 Figma 08: 큰 제목 + 기준 카드 6개 (2열 × 3줄) · 규칙 숫자는 원본(API rule · rules.ts)에서 읽어 카드 아래에 따로 적음
import type { Fetched } from "@/shared/api";
import { REPO_URL } from "@/shared/site";
import { SiteNav } from "@/shared/site-nav";
import type { SignalList } from "@hav/shared/signal";
import { BAND_EDGE } from "@hav/shared/travel";
import { PageFooter } from "@hav/ui/layout/page-footer";
import { Eyebrow, Title } from "@hav/ui/text/heading";
import { TextLink } from "@hav/ui/text/text-link";
import { ABOUT_CARDS } from "../lib/criteria";

const pct = (n: number) => `${Math.round(n * 100)}%`;

/** 직구 판단 기준 — 기능 폴더끼리 직접 가져오지 않게 라우트에서 받음 */
export type DutyRules = { usList: number; other: number; source: { name: string; url: string; checked: string } };

export function AboutPage({ signals, duty }: { signals: Fetched<SignalList>; duty: DutyRules }) {
  const rule = signals.ok ? signals.data.rule : null;
  return (
    <>
      <SiteNav page="about" />
      <main className="bg-surface px-4 pt-14 pb-20 text-fg sm:px-8 sm:pt-20 sm:pb-28">
        <div className="mx-auto max-w-page">
          <Eyebrow>소개</Eyebrow>
          <Title as="h1" size="page" className="mt-3 text-cheap">
            어떤 자료를, 어떤 기준으로 보여 주나요
          </Title>
          <p className="mt-6 max-w-3xl text-body text-fg-2">tripfx 는 여행과 해외 직구를 앞둔 사람이 환율 · 여행지 물가 · 직구 세금을 한곳에서 확인하는 사이트입니다. 로그인 없이 쓸 수 있습니다.</p>

          <ul className="mt-12 grid gap-x-12 gap-y-10 sm:grid-cols-2">
            {ABOUT_CARDS.map((c) => (
              <li key={c.id} data-testid="criteria-card" className="border-t-2 border-cheap pt-4">
                <h2 className="font-display text-city font-normal">{c.title}</h2>
                <p className="mt-3 text-body text-fg-2">{c.body}</p>
              </li>
            ))}
          </ul>

          {/* 기준 숫자의 원본 — 카드의 글과 어긋나지 않게 빌드 때 받은 규칙 값 · 공용 상수를 그대로 적음 */}
          <section aria-labelledby="source-title" className="mt-16 border-t-2 border-line pt-6">
            <h2 id="source-title" className="text-lg font-semibold">
              기준 숫자의 원본
            </h2>
            <ul className="mt-4 space-y-2 text-small text-fg-2">
              {rule ? (
                <li>
                  신호: 최근 {rule.windowDays}일 중 오늘 값보다 낮았던 날의 비율 · {pct(rule.cheapAt)} 이하 쌈 · {pct(rule.expensiveAt)} 이상 비쌈 · 그 기간 평일의 {pct(rule.minCoverage)}보다 기록이 적으면 신호를 내지 않음
                </li>
              ) : (
                <li>신호 규칙 값을 받지 못했습니다 ({signals.ok ? "" : signals.reason})</li>
              )}
              <li>여행 물가: 한국 대비 {BAND_EDGE.cheap} 미만 싼 곳 · {BAND_EDGE.pricey} 초과 비싼 곳 · 그 사이는 비슷한 곳 (한국과 같은 연도끼리 비교)</li>
              <li>
                직구: 면세 한도 미국발 목록통관 {duty.usList}달러 · 그 밖 {duty.other}달러 · 근거 <TextLink href={duty.source.url}>{duty.source.name}</TextLink> (<time dateTime={duty.source.checked}>{duty.source.checked}</time> 확인) · 결과는 예상 금액이며 실제 세액은 통관 때 정해집니다
              </li>
              <li>
                방문 통계: AI 봇과 AI 서비스 유입은 이름 · 페이지별 횟수만 집계해 <TextLink href="/geo">GEO 측정</TextLink> 페이지에 공개합니다
              </li>
              <li>
                만드는 과정은 <TextLink href="/log">작업실</TextLink>에 공개 · 코드와 작업 기록은 <TextLink href={REPO_URL}>GitHub 저장소</TextLink>에 있고, 잘못된 내용은 <TextLink href={`${REPO_URL}/issues`}>이슈</TextLink>로 알려 주세요
              </li>
            </ul>
          </section>
        </div>
      </main>
      <PageFooter width="max-w-page">모든 숫자의 출처는 각 화면 아래에 적습니다</PageFooter>
    </>
  );
}
