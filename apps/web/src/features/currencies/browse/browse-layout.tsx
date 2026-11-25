// 통화 둘러보기 — 새 디자인(작업 0219): 위쪽 검색 + 국기 칩 줄 → 상세(children) → 맨 아래 다른 통화 목록 (docs/design.md 페이지 패턴 "둘러보기")
// 검색 · 칩 · 목록은 레이아웃이라 통화를 바꿔도 남고, 상세(children)만 바뀜 (작업 0168: 동전을 뺌)
import type { Fetched } from "@hav/shared/api";
import { SiteNav } from "@/shared/nav/site-nav";
import { SOURCE_NOTE } from "@hav/shared/currency";
import type { FxChanges, FxLatest } from "@hav/shared/fx";
import type { SignalList } from "@hav/shared/signal";
import type { ReactNode } from "react";
import { CurrencyChips } from "../chips/currency-chips";
import { CurrencyTable } from "./currency-table";
import { CurrencySearch } from "../search/currency-search";
import { FadeUpGroup } from "@hav/ui/motion/fade-up";
import { Eyebrow } from "@hav/ui/text/heading";
import { TextLink } from "@hav/ui/text/text-link";
import { PageFooter } from "@hav/ui/layout/page-footer";
import { signalMaps } from "@/shared/signal/signal-maps";
import { browseItems } from "./list";
import { MoreProvider } from "../more/more-provider";
import { ratesDate } from "../more/more-view";

export function BrowseLayout({ latest, signals, changes, children }: { latest: Fetched<FxLatest>; signals: Fetched<SignalList>; changes: Fetched<FxChanges>; children: ReactNode }) {
  // 지난 1개월 변화 — 못 받으면 정렬 단추 · 숫자를 뺌 (작업 0099) · 표의 "90일 최고보다" — /signal 이 준 오늘 값 · 90일 최고 (browseItems)
  const items = browseItems(latest, signalMaps(signals), changes);
  const windowDays = signals.ok ? signals.data.rule.windowDays : 90;

  return (
    <>
      <SiteNav page="currencies" />
      <section data-surface="light" className="bg-surface px-4 pt-8 pb-24 text-fg sm:px-8 sm:pt-10">
        <div className="mx-auto max-w-page">
          {/* 위쪽 — 통화 검색(자동완성) + 국기 칩 줄 (작업 0219) */}
          <div data-testid="currency-jump" className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
            <div className="lg:w-80 lg:shrink-0">
              <CurrencySearch codes={items.map((i) => i.currency)} />
            </div>
            <CurrencyChips codes={items.map((i) => i.currency)} />
          </div>
          {/* 본문 표시 — 위쪽 검색 · 칩 다음에 두어 키보드 이동 순서가 화면과 같음 (작업 0114 · 0219) */}
          {/* 상세의 "다른 나라 통화 보기"(작업 0356)가 둘러보기 표와 같은 자료(items)를 쓰도록 한 번 감쌈 */}
          <MoreProvider items={items} date={ratesDate(latest.ok ? latest.data.rates : [])}>
            <main id="main" tabIndex={-1} data-testid="currency-detail" className="mt-8 min-w-0">
              {children}
            </main>
            {/* 맨 아래 — 다른 통화 목록 (지금 목록 부품 · 격자) · id 는 자바스크립트 없을 때 버튼 링크가 가리킴 */}
            <FadeUpGroup id="currency-list" data-testid="currency-list" className="mt-[4.5rem] min-w-0 sm:mt-24">
              <Eyebrow data-fu={0}>둘러보기</Eyebrow>
              <div data-fu={3} className="mt-4">
                <CurrencyTable items={items} />
              </div>
            </FadeUpGroup>
          </MoreProvider>
        </div>
      </section>
      <PageFooter width="max-w-page">신호는 최근 {windowDays}일 중 오늘 값의 위치입니다. 앞으로를 예측하지 않으며, 투자 · 금융 조언이 아닙니다 · {SOURCE_NOTE} ·{" "}
          <TextLink href="/about">
            소개 · 판단 기준
          </TextLink>
      </PageFooter>
    </>
  );
}
