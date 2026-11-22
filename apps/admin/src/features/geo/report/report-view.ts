// GEO 요약 숫자 칸 · 측정 방법 링크 (작업 0303 · 0312 에 geo-report.tsx 에서 옮김) · 순수 함수
import type { GeoReport } from "@hav/shared/geo";
import { splitNumber } from "@/shared/text/split-big";
import { geoCards } from "../common/geo-view";

/** 요약 칸 — "536회" 를 큰 글자 536 · 작은 글자 회로 */
export const cardsView = (r: GeoReport) => geoCards(r).map((c) => ({ ...c, ...splitNumber(c.value) }));

export const methodHref = (repoUrl: string) => `${repoUrl}/blob/main/docs/geo-measurement.md`;
