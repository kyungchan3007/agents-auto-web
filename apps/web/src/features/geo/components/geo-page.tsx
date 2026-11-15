// GEO 측정 페이지 — 작업 0170 Figma 07 시안과 같게: 작은 제목 → 큰 제목(약 72px) → 측정 수치 카드 4개 → 읽는 법 → 바닥 띠 (시안에 없는 표 · 설명 문단은 뺌)
import type { GeoReport as Report } from "@hav/shared/geo";
import { PageFooter } from "@hav/ui/layout/page-footer";
import { Eyebrow } from "@hav/ui/text/heading";
import type { Fetched } from "../../../shared/api";
import { SiteNav } from "../../../shared/site-nav";
import { GeoReport } from "./geo-report";

export function GeoPage({ build }: { build: Fetched<Report> }) {
  return (
    <>
      <SiteNav page="geo" />
      <main className="bg-surface px-4 pt-14 pb-10 text-fg sm:px-8 sm:pt-20">
        <div className="mx-auto max-w-6xl">
          <Eyebrow>GEO 측정</Eyebrow>
          <h1 className="mt-3 mb-6 font-display text-[clamp(2.5rem,5vw,4.5rem)] leading-[1.04] font-normal tracking-tight text-cheap">AI 검색에서 이 사이트가 어떻게 쓰이는지 잽니다</h1>
          <GeoReport build={build} />
        </div>
      </main>
      <PageFooter width="max-w-6xl">자료: 직접 검색 기록(apps/api/data/geo-answers) · Google Search Console · 방문 통계</PageFooter>
    </>
  );
}
