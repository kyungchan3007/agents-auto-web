// GEO 측정 페이지 — AI 봇 방문 · AI 서비스 유입 · AI 검색 인용 측정 기록을 공개 (작업 0129 · 이슈 #117) — 작업 0170 Figma 07: 큰 제목 → 측정 수치 카드 4개 → 읽는 법 → 자세한 기록
import type { GeoReport as Report } from "@hav/shared/geo";
import { PageFooter } from "@hav/ui/layout/page-footer";
import { Eyebrow, SubTitle, Title } from "@hav/ui/text/heading";
import { TextLink } from "@hav/ui/text/text-link";
import type { Fetched } from "../../../shared/api";
import { REPO_URL } from "../../../shared/site";
import { SiteNav } from "../../../shared/site-nav";
import { GeoReport } from "./geo-report";

export function GeoPage({ build }: { build: Fetched<Report> }) {
  return (
    <>
      <SiteNav page="geo" />
      <main className="bg-surface px-4 pt-14 pb-20 text-fg sm:px-8 sm:pt-20 sm:pb-28">
        <div className="mx-auto max-w-6xl">
          <Eyebrow>GEO 측정</Eyebrow>
          <Title as="h1" size="poster" className="mt-3 text-cheap">
            AI 검색에서 이 사이트가 어떻게 쓰이는지 잽니다
          </Title>
          <p className="mt-6 max-w-3xl text-body text-fg-2">GEO(AI 검색 노출)를 확인하기 위한 공개 기록입니다.</p>

          <div className="mt-12">
            <GeoReport build={build} />
          </div>

          <p className="mt-10 text-small">
            <TextLink href={`${REPO_URL}/blob/main/docs/geo-measurement.md`}>질문 목록과 측정 방법</TextLink>
          </p>

          <section className="mt-10">
            <SubTitle>아직 연결하지 않은 자료</SubTitle>
            <p className="mt-2 text-small text-fg-2">Bing Webmaster Tools에 등록했습니다 (2026-11-05). Bing 검색 · Copilot 인용 수치와 구글 AI 답변 전용 수치는 아직 이 페이지에 연결하지 않았습니다.</p>
          </section>

          <section className="mt-10 border-t-2 border-line pt-6 text-small leading-relaxed text-fg-2">
            <h2 className="font-semibold text-fg">측정의 한계</h2>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>봇 방문은 요청에 적힌 봇 이름을 기준으로 센 추정치입니다. 이름은 위조될 수 있습니다.</li>
              <li>유입은 브라우저가 유입 주소를 보낸 방문만 잡힙니다. 앱에서 넘어온 방문은 빠질 수 있습니다.</li>
              <li>방문은 하루 · 봇 이름 · 페이지별 횟수로만 저장합니다. IP 주소 · 전체 User-Agent · 쿼리는 저장하지 않으며, 일반 방문은 이 집계에 넣지 않습니다.</li>
              <li>봇이 읽었다는 것이 AI 답변에 인용되었다는 뜻은 아닙니다.</li>
              <li>검색어는 노출 2회 이상인 것만 표시합니다.</li>
            </ul>
          </section>
        </div>
      </main>
      <PageFooter width="max-w-6xl">자료: 직접 검색 기록(apps/api/data/geo-answers) · Google Search Console · 방문 통계</PageFooter>
    </>
  );
}
