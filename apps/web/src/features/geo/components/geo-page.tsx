// GEO 측정 페이지 — 작업 0170 Figma 07 시안과 같게: 작은 제목 → 큰 제목(공통 Title page) → 측정 수치 카드 4개 → 읽는 법 → 바닥 띠 → 자세한 기록 카드 → 측정 방법 · 한계 (작업 0180: 0170 에서 뺀 표를 되살림)
import type { GeoReport as Report } from "@hav/shared/geo";
import { PageFooter } from "@hav/ui/layout/page-footer";
import { Eyebrow, Title } from "@hav/ui/text/heading";
import { TextLink } from "@hav/ui/text/text-link";
import type { Fetched } from "../../../shared/api";
import { REPO_URL } from "../../../shared/site";
import { SiteNav } from "../../../shared/site-nav";
import { GEO_LIMITS, GEO_UNLINKED, methodLinkText } from "../lib/geo-view";
import { GeoReport } from "./geo-report";

export function GeoPage({ build, asOf }: { build: Fetched<Report>; asOf: string }) {
  return (
    <>
      <SiteNav page="geo" />
      <main className="bg-surface px-4 pt-14 pb-10 text-fg sm:px-8 sm:pt-[3.3rem]">
        <div className="mx-auto max-w-page">
          <Eyebrow>GEO 측정</Eyebrow>
          <Title as="h1" size="page" className="mt-3.5 mb-[22px] text-cheap">
            AI 검색에서 이 사이트가 어떻게 쓰이는지 잽니다
          </Title>
          <GeoReport build={build} asOf={asOf} />

          <section data-testid="geo-method" className="mt-6 rounded-card bg-foam px-6 pt-[22px] pb-[25px]">
            <h2 className="text-lg font-semibold">측정 방법</h2>
            <p className="mt-1 text-small">
              <TextLink href={`${REPO_URL}/blob/main/docs/geo-measurement.md`}>{methodLinkText(build.ok ? build.data : null)}</TextLink>
            </p>
            <h3 className="mt-5 text-small font-semibold">아직 연결하지 않은 자료</h3>
            <p className="mt-1 text-small text-fg-2">{GEO_UNLINKED}</p>
            <h3 className="mt-5 text-small font-semibold">측정의 한계</h3>
            <ul className="mt-1 list-disc space-y-1 pl-4 text-small text-fg-2">
              {GEO_LIMITS.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
        </div>
      </main>
      <PageFooter width="max-w-page">자료: 직접 검색 기록(apps/api/data/geo-answers) · Google Search Console · 방문 통계</PageFooter>
    </>
  );
}
