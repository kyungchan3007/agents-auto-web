// 바닥 띠 — 자료 출처 · 비행기 모델 출처(CC-BY 4.0 은 출처 표시가 조건) · 인트로 모델 출처(Kenney · CC0) · 소개 · 작업실 링크 (작업 0169 · 0185)
import { PLANE_CREDIT } from "@hav/shared/travel";
import { PageFooter } from "@hav/ui/layout/page-footer";

export function HomeFooter() {
  return (
    <PageFooter width="max-w-page">
      <p>
        자료: 한국수출입은행 · 통계청 KOSIS · 관세청 · 한국은행 ECOS · 세계은행 · 3D 비행기:{" "}
        <a href={PLANE_CREDIT.sourceUrl} target="_blank" rel="noreferrer">
          Airplane
        </a>{" "}
        by Poly by Google (
        <a href={PLANE_CREDIT.licenseUrl} target="_blank" rel="noreferrer">
          CC-BY 4.0
        </a>
        ) · 차 · 사람 · 도시 모델:{" "}
        <a href="https://kenney.nl" target="_blank" rel="noreferrer">
          Kenney
        </a>{" "}
        (CC0) · <a href="/about">소개 · 판단 기준</a>
      </p>
    </PageFooter>
  );
}
