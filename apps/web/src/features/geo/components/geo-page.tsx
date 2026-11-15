// GEO 측정 페이지 — 작업 0170 Figma 07 시안과 같게: 작은 제목 → 큰 제목(시안 실측: 글자 약 56px · 줄 간격 75px) → 측정 수치 카드 4개 → 읽는 법 → 바닥 띠 (시안에 없는 표 · 설명 문단은 뺌)
import type { GeoReport as Report } from "@hav/shared/geo";
import { PageFooter } from "@hav/ui/layout/page-footer";
import type { Fetched } from "../../../shared/api";
import { SiteNav } from "../../../shared/site-nav";
import { GeoReport } from "./geo-report";

export function GeoPage({ build }: { build: Fetched<Report> }) {
  return (
    <>
      <SiteNav page="geo" />
      <main className="bg-surface px-4 pt-14 pb-10 text-fg sm:px-8 sm:pt-[3.3rem]">
        <div className="mx-auto max-w-6xl">
          <p className="text-base text-accent">GEO 측정</p>
          <h1 className="mt-3.5 mb-[22px] max-w-[42rem] font-display text-[clamp(2.25rem,4vw,3.5rem)] leading-[1.34] font-normal tracking-tight text-cheap">AI 검색에서 이 사이트가 어떻게 쓰이는지 잽니다</h1>
          <GeoReport build={build} />
        </div>
      </main>
      <PageFooter width="max-w-6xl">자료: 직접 검색 기록(apps/api/data/geo-answers) · Google Search Console · 방문 통계</PageFooter>
    </>
  );
}
