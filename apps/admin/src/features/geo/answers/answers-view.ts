// AI 답변 인용 판에 보일 값 (작업 0214 · 0303 · 0312 에 geo-detail.tsx 에서 옮김) · 순수 함수
import type { GeoReport } from "@hav/shared/geo";
import { dayColumns } from "../common/geo-bars";
import { answerLines } from "../common/geo-view";

export function answersView(report: GeoReport) {
  const lines = answerLines(report);
  const measured = lines.flatMap((a) => (a.measured ? [a] : []));
  const columns = dayColumns(report.answers?.history ?? []);
  const latest = measured[0];
  const unmeasured = lines.filter((a) => !a.measured).map((a) => a.name);
  return {
    columns,
    stamp: latest ? `${latest.name} · ${columns.length}일 · 최근 ${latest.day.slice(5)}` : "측정 전",
    engines: measured.map((a) => ({
      engine: a.engine,
      summary: `${a.name} · ${columns.length}일 측정 · 인용 ${a.cited} · 검색 결과 ${a.found} · 최근 ${a.day}${a.failed > 0 ? ` · 실패 ${a.failed}` : ""}`,
      questionsTitle: `${a.name} 질문별 결과 (${a.day}) · ${a.results.length}개`,
      results: a.results,
    })),
    unmeasured: unmeasured.length > 0 ? `${unmeasured.join(" · ")} 는 키가 없어 측정 안 함` : null,
  };
}
