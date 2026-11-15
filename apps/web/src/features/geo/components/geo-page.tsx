// GEO 측정 페이지 — 작업 0170 Figma 07 시안과 같게: 작은 제목 → 큰 제목(공통 Title page) → 측정 수치 카드 4개 → 읽는 법 → 바닥 띠 (시안에 없는 표 · 설명 문단은 뺌)
import type { GeoReport as Report } from "@hav/shared/geo";
import { PageFooter } from "@hav/ui/layout/page-footer";
import { Eyebrow, Title } from "@hav/ui/text/heading";
import type { Fetched } from "../../../shared/api";
import { SiteNav } from "../../../shared/site-nav";
import { GeoReport } from "./geo-report";

export function GeoPage({ build }: { build: Fetched<Report> }) {
  return (
    <>
      <SiteNav page="geo" />
      <main className="bg-surface px-4 pt-14 pb-10 text-fg sm:px-8 sm:pt-[3.3rem]">
        <div className="mx-auto max-w-page">
          <Eyebrow>GEO 측정</Eyebrow>
          <Title as="h1" size="page" className="mt-3.5 mb-[22px] max-w-[42rem] text-cheap">
            AI 검색에서 이 사이트가 어떻게 쓰이는지 잽니다
          </Title>
          <GeoReport build={build} />
        </div>
      </main>
      <PageFooter width="max-w-page">자료: 직접 검색 기록(apps/api/data/geo-answers) · Google Search Console · 방문 통계</PageFooter>
    </>
  );
}
