// 여행 타이밍 페이지 — 밝은 섹션 · 국제항공료 · 해외단체여행비 물가지수로 언제가 싼지 (작업 0164) · 빌드 때 받은 값만 · 자료가 없으면 "준비 중"
import { SiteNav } from "@/shared/site-nav";
import { PageSection } from "@hav/ui/layout/page-section";
import type { IndexPoint } from "../lib/travel-index";
import { type TravelItem, TravelIndexSection } from "./travel-index-section";

export function FlightsPage({ travel, fxMonthly }: { travel: TravelItem[]; fxMonthly: IndexPoint[] }) {
  return (
    <>
      <SiteNav page="flights" />
      <PageSection
        surface="light"
        width="max-w-6xl"
        eyebrow="여행 타이밍"
        title={
          <>
            항공료는 언제가
            <br />
            싼 편인지 확인합니다.
          </>
        }
      >
        <div className="mt-10">
          <TravelIndexSection items={travel} fxMonthly={fxMonthly} />
        </div>
      </PageSection>
    </>
  );
}
