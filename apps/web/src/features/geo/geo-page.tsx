// GEO 측정 페이지 — AI 봇 방문 · AI 서비스 유입 · AI 검색 인용 측정 기록을 공개 (작업 0129 · 이슈 #117)
import type { GeoReport as Report } from "@hav/shared/geo";
import { Eyebrow, Title } from "@hav/ui/heading";
import { PageFooter } from "@hav/ui/page-footer";
import { TextLink } from "@hav/ui/text-link";
import type { Fetched } from "../../shared/api";
import { REPO_URL } from "../../shared/site";
import { SiteNav } from "../../shared/site-nav";
import { GeoReport } from "./geo-report";
import { MEASUREMENTS } from "./geo-view";

export function GeoPage({ build }: { build: Fetched<Report> }) {
  return (
    <>
      <SiteNav page="geo" />
      <main data-surface="dark" className="bg-surface px-4 pt-14 pb-24 text-fg sm:px-8 sm:pt-20">
        <div className="mx-auto max-w-4xl">
          <Eyebrow>GEO 측정</Eyebrow>
          <Title as="h1" className="mt-3">
            AI 검색에서 이 사이트가 어떻게 쓰이는지 측정합니다.
          </Title>
          <p className="mt-6 text-lead text-fg-2">GEO(AI 검색 노출)를 확인하기 위한 공개 기록입니다. 측정 결과가 낮아도 그대로 공개합니다.</p>

          <div className="mt-12">
            <GeoReport build={build} />
          </div>

          <section className="mt-10">
            <h2 className="text-lg font-semibold tracking-tight">AI 검색 인용 측정</h2>
            <p className="mt-2 text-sm text-fg-2">같은 질문 24개를 질문마다 1회 검색해 이 사이트가 결과에 나오는지 확인합니다. 한 번 측정한 표본이며 특정 AI 서비스의 순위가 아닙니다.</p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-fg-2">
                  <tr>
                    <th scope="col" className="py-1.5 pr-3 font-normal">측정일</th>
                    <th scope="col" className="py-1.5 pr-3 font-normal">사이트 이름 질문</th>
                    <th scope="col" className="py-1.5 pr-3 font-normal">일반 질문</th>
                    <th scope="col" className="py-1.5 font-normal">비고</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line border-t border-line text-fg">
                  {MEASUREMENTS.map((m) => (
                    <tr key={m.date}>
                      <td className="py-2 pr-3 whitespace-nowrap">{m.date}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">{m.brand} / {m.brandTotal}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">{m.general} / {m.generalTotal}</td>
                      <td className="py-2 whitespace-nowrap">{m.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-sm">
              <TextLink href={`${REPO_URL}/blob/main/docs/geo-measurement.md`}>질문 목록과 측정 방법</TextLink>
            </p>
          </section>

          <section className="mt-10">
            <h2 className="text-lg font-semibold tracking-tight">아직 연결하지 않은 자료</h2>
            <p className="mt-2 text-sm text-fg-2">Bing Webmaster Tools에 등록했습니다 (2026-11-05). Bing 검색 · Copilot 인용 수치와 구글 AI 답변 전용 수치는 아직 이 페이지에 연결하지 않았습니다.</p>
          </section>

          <section className="mt-10 border-t border-line pt-6 text-xs leading-relaxed text-fg-2">
            <h2 className="font-semibold text-fg">이 수치를 읽는 법</h2>
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
      <PageFooter>
        <TextLink href="/about">소개 · 판단 기준</TextLink> · <TextLink href="/log">작업실</TextLink>
      </PageFooter>
    </>
  );
}
