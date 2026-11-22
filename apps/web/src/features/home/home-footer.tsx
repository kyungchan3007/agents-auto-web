// 바닥 띠 — 자료 출처 · 인트로 모델 출처(Kenney · CC0 · 3D 비행기 출처는 인트로 화면에 표시 — 홈은 3D 경로를 쓰지 않음 · 작업 0217 그래프 2D) · 소개 · 작업실 링크 (작업 0169 · 0185)
import { RATE_SOURCE_LABEL } from "@hav/shared/currency";
import { PageFooter } from "@hav/ui/layout/page-footer";

export function HomeFooter() {
  return (
    <PageFooter width="max-w-page">
      <p>
        자료: {RATE_SOURCE_LABEL} · 통계청 KOSIS · 관세청 · 한국은행 ECOS · 세계은행 · 차 · 사람 · 도시 모델:{" "}
        <a href="https://kenney.nl" target="_blank" rel="noreferrer">
          Kenney
        </a>{" "}
        (CC0) · <a href="/about">소개 · 판단 기준</a>
      </p>
    </PageFooter>
  );
}
