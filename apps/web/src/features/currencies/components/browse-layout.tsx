// 통화 둘러보기 — 왼쪽 `+ 통화` 목록 → 오른쪽 상세 (docs/design.md 페이지 패턴 "둘러보기")
// 목록은 레이아웃이라 통화를 바꿔도 남고, 상세(children)만 바뀜 (작업 0168: 동전을 뺌)
import type { Fetched } from "@/shared/api";
import { SiteNav } from "@/shared/site-nav";
import { SOURCE_NOTE } from "@hav/shared/currency";
import type { FxChanges, FxLatest } from "@hav/shared/fx";
import type { SignalList } from "@hav/shared/signal";
import type { ReactNode } from "react";
import { CurrencyList } from "./currency-list";
import { CurrencySearch } from "./currency-search";
import { Eyebrow } from "@hav/ui/text/heading";
import { TextLink } from "@hav/ui/text/text-link";
import { PageFooter } from "@hav/ui/layout/page-footer";

export function BrowseLayout({ latest, signals, changes, children }: { latest: Fetched<FxLatest>; signals: Fetched<SignalList>; changes: Fetched<FxChanges>; children: ReactNode }) {
  const tones = Object.fromEntries((signals.ok ? signals.data.signals : []).map((s) => [s.currency, s.signal]));
  // 지난 1개월 변화 — 못 받으면 정렬 단추 · 숫자를 뺌 (작업 0099)
  const percentile = Object.fromEntries((signals.ok ? signals.data.signals : []).map((s) => [s.currency, s.percentile]));
  const pct = Object.fromEntries((changes.ok ? changes.data.changes : []).map((c) => [c.currency, c.pct]));
  const items = (latest.ok ? latest.data.rates : []).map((r) => ({ currency: r.currency, signal: tones[r.currency] ?? null, change: pct[r.currency] ?? null, percentile: percentile[r.currency] ?? null, unit: r.unit }));
  const windowDays = signals.ok ? signals.data.rule.windowDays : 90;

  return (
    <>
      <SiteNav page="currencies" />
      <section data-surface="light" className="bg-surface px-4 pt-8 pb-24 text-fg sm:px-8 sm:pt-10">
        <div className="mx-auto max-w-page">
          <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-10">
            <div data-testid="currency-list" className="min-w-0 lg:sticky lg:top-(--hav-nav-h) lg:self-start">
              <Eyebrow>둘러보기</Eyebrow>
              <div className="mt-4">
                <CurrencySearch codes={items.map((i) => i.currency)} />
              </div>
              <div className="mt-4">
                <CurrencyList items={items} />
              </div>
            </div>
            {/* 본문 표시 — 코드 순서는 목록 먼저 그대로 (바꾸면 키보드 이동 순서가 화면과 어긋남 · 작업 0114) */}
            <main id="main" tabIndex={-1} data-testid="currency-detail" className="min-w-0">
              {children}
            </main>
          </div>
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
