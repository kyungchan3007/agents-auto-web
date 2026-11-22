"use client";

// 직구 계산 페이지 — 새 디자인(작업 0221 · 시안 A + 사용자 결정 파랑 머리): 메뉴와 이어지는 파랑 면(라벨 · 큰 문장 · 설명)에 입력 · 결과 카드가 경계에 걸침 → 입력 · 세관 꼬리표 결과 2단 → 수입물가와 환율(왼쪽 숫자 카드 · 오른쪽 그래프 + 이번 주 과세환율) (작업 0200 · 시안 B 배치 유지)
// 환율은 빌드 때 받은 값 · 계산은 브라우저에서 (IMP-01) · 모바일은 입력 → 결과 → 수입물가 → 과세환율 순서로 쌓임
import type { Fetched } from "@/shared/api";
import { SiteNav } from "@/shared/site-nav";
import type { FxLatest } from "@hav/shared/fx";
import { EmptyState } from "@hav/ui/feedback/empty-state";
import { FadeUpGroup } from "@hav/ui/motion/fade-up";
import { PageFooter } from "@hav/ui/layout/page-footer";
import { TextLink } from "@hav/ui/text/text-link";
import { EmphText } from "@hav/ui/text/emph";
import { Eyebrow, Title } from "@hav/ui/text/heading";
import { calcHeadline } from "../lib/calc-copy";
import { useCalcForm } from "../hooks/use-calc-form";
import type { CustomsRate, Point } from "../lib/customs-rate";
import type { FxDay, MonthPoint } from "../lib/import-price";
import { CalcForm } from "./calc-form";
import { CustomsSection } from "./customs-section";
import { ImportPriceSection } from "./import-price-section";

export function CalcPage({ latest, customs, trend, usdDays, importPrice }: { latest: Fetched<FxLatest>; customs: Record<string, CustomsRate>; trend: Point[] | null; usdDays: FxDay[] | null; importPrice: MonthPoint[] | null }) {
  const hasRates = latest.ok && latest.data.rates.length > 0;
  // 입력 상태는 여기서 한 번 — 파랑 면 큰 문장 · 아래 입력 · 결과가 같이 씀 (작업 0175)
  const form = useCalcForm(latest.ok ? latest.data.rates : [], customs);
  // 큰 문장 — 입력으로 결과를 한 문장으로 ("세금 없이 받습니다" / "관세 · 부가세 약 ○원이 붙습니다") · 숫자 강조는 EmphText (파랑 면 안에서는 해 노랑 글자)
  return (
    <>
      <SiteNav page="calc" />
      <main id="main" tabIndex={-1} className="bg-surface text-fg">
        {/* 첫 면 — 메뉴와 이어지는 파랑 면(작업 0221 사용자 결정 · 0220 /prices 와 같은 방식): 파랑 띠는 그리드 첫 줄 높이만큼만 깔리고 입력 카드 · 결과 꼬리표는 그 경계에 걸침 (그라데이션 · 음수 여백 대신 칸 나눔 · 카드 줄만 위로 끌어올림) */}
        <div className="grid grid-cols-[minmax(1rem,1fr)_minmax(0,var(--container-page))_minmax(1rem,1fr)] sm:grid-cols-[minmax(2rem,1fr)_minmax(0,var(--container-page))_minmax(2rem,1fr)]">
          <div data-testid="calc-band" aria-hidden className="col-span-3 col-start-1 row-start-1 bg-pin-cheap" />
          <section aria-labelledby="calc-title" data-surface="dark" className="col-start-2 row-start-1 pt-10 pb-[12.875rem] sm:pt-14 sm:pb-[12.25rem]">
            <Eyebrow className="text-fg!">직구 계산</Eyebrow>
            {/* 큰 문장은 입력에 따라 2~3줄 — 제목 + 설명 덩어리의 높이를 미리 잡아(휴대폰은 가장 긴 문장이 세 줄이라 세 줄 + 설명 두 줄 · 640~767 은 두 줄 · 768 이상은 한 줄(작업 0221 사용자 지적: 문장을 짧게 해 한 줄 · 실측으로 정함) — 제목 글자 크기와 같은 clamp 로 계산) 값을 바꿔도 아래 칸이 밀리지 않게(작업 0245: 휴대폰 639 이하는 미리 잡지 않음 — 설명 ↔ 요약 띠 약 30px · 640 이상만 이 규칙) · 남는 자리는 파랑 면 안 설명 아래로 (제목 ~ 설명 사이는 바짝) */}
            <div className="sm:min-h-[calc(2.68*clamp(2.25rem,4.5vw,3.5rem)+3.4rem)] md:min-h-[calc(1.34*clamp(2.25rem,4.5vw,3.5rem)+3.4rem)]">
              <Title as="h1" size="page" id="calc-title" className="mt-3 max-w-none! text-fg">
                <EmphText bg="sea" text={hasRates ? calcHeadline(form.result, form.input) : "환율을 받지 못했습니다"} />
              </Title>
              <p className="mt-4 max-w-[36em] text-body text-fg-2">물건 값을 넣으면 면세 한도 안인지 바로 알려 드립니다.</p>
            </div>
          </section>
          <div className="relative z-10 col-start-2 row-start-2 -mt-44 sm:-mt-[9.5rem]">
            {hasRates ? (
              <CalcForm form={form} />
            ) : (
              <EmptyState>환율을 받지 못해 계산할 수 없습니다 ({latest.ok ? "통화 없음" : latest.reason})</EmptyState>
            )}
          </div>
        </div>
        <div className="px-4 pt-0 pb-10 sm:px-8 sm:pt-12">
        <div className="mx-auto max-w-page">
          {/* 가로 전체 두 칸 — 수입물가와 환율 → 이번 주 과세환율 (작업 0200 · 시안 B) */}
          <FadeUpGroup className="mt-[4.5rem] sm:mt-12">
            <ImportPriceSection fxRows={usdDays} price={importPrice}>
              <CustomsSection points={trend} bank={latest.ok ? latest.data.rates.find((r) => r.currency === "USD") : undefined} />
            </ImportPriceSection>
          </FadeUpGroup>
        </div>
        </div>
      </main>
      <PageFooter width="max-w-page">자료: 관세청 과세환율 · 한국은행 ECOS 수입물가지수 · 한국수출입은행 · 면세 한도 관세법 기준 · <TextLink href="/about">소개 · 판단 기준</TextLink></PageFooter>
    </>
  );
}
