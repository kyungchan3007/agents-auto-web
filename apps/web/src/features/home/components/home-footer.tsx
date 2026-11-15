// 바닥 띠 — 자료 출처 · 비행기 모델 출처(CC-BY 4.0 은 출처 표시가 조건) · 소개 · 작업실 링크 (작업 0169)
import { PLANE_CREDIT } from "@hav/shared/travel";
import { PageFooter } from "@hav/ui/layout/page-footer";

export function HomeFooter() {
  return (
    <PageFooter width="max-w-6xl" className="space-y-2">
      <p>자료: 한국수출입은행 환율 · 통계청 KOSIS 국제항공료 · 관세청 과세환율 · 한국은행 ECOS 수입물가지수 · 세계은행 물가 수준 · 화면에 보이는 값은 사이트를 만든 시점의 자료입니다</p>
      <p>
        3D 비행기:{" "}
        <a href={PLANE_CREDIT.sourceUrl} target="_blank" rel="noreferrer">
          Airplane
        </a>{" "}
        by Poly by Google (
        <a href={PLANE_CREDIT.licenseUrl} target="_blank" rel="noreferrer">
          CC-BY 4.0
        </a>
        ) · <a href="/about">소개 · 판단 기준</a> · <a href="/log">이 사이트는 AI 코딩 에이전트가 만들고 있습니다</a>
      </p>
    </PageFooter>
  );
}
