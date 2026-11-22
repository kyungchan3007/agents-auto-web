"use client";

// AI 답변 인용 — 측정한 날마다 (주 그래프 판 · 작업 0214 → 0303 어드민) · 질문별 결과 · 판 설명은 판 안에 접어 둠 · 보일 값은 answers-view.ts
import type { GeoReport } from "@hav/shared/geo";
import { Panel, Stamp } from "@/shared/ui/panel/panel";
import { EMPTY, GeoTable } from "../common/geo-table";
import { GEO_EDITION_NOTES } from "../common/geo-view";
import { DayChart } from "../days/day-chart";
import { answersView } from "./answers-view";

export function GeoAnswers({ report }: { report: GeoReport }) {
  const v = answersView(report);
  return (
    <Panel id="geo-answers" testId="geo-answers" title="AI 답변 인용 — 측정한 날마다" meta={<Stamp>{v.stamp}</Stamp>}>
      <div className="adm-pb">
        <p className="adm-note" style={{ marginBottom: 12, color: "var(--a-sub)" }}>
          정해 둔 질문 24개를 Claude 웹 검색으로 직접 묻고, 검색 결과와 답의 출처에 이 사이트가 나왔는지 기록합니다.
        </p>
        {v.columns.length === 0 ? <p className="adm-empty">{EMPTY}</p> : <DayChart columns={v.columns} />}
        <p className="adm-note" style={{ marginTop: 8 }}>
          측정한 날마다 기록 · 막대 = 그날 응답 받은 질문 수 · 파란 점 = 답에 인용 · 점선 = 측정 실패 (측정하지 않은 날은 비워 둠)
        </p>
        {v.engines.map((a) => (
          <p key={a.engine} className="adm-note" style={{ marginTop: 6, color: "var(--a-ink)", fontWeight: 500 }}>
            {a.summary}
          </p>
        ))}
        {v.unmeasured && (
          <p className="adm-note" style={{ marginTop: 4 }}>
            {v.unmeasured}
          </p>
        )}
      </div>
      {v.engines.map((a) => (
        <details key={a.engine} data-testid="geo-questions" className="adm-more" style={{ borderTop: "1px solid var(--a-line)" }}>
          <summary>{a.questionsTitle}</summary>
          <GeoTable head={["질문", "구분", "답에 인용", "검색 결과에 나옴", "상태"]} rows={a.results} numFrom={2} />
        </details>
      ))}
      <div className="adm-foot">
        <ul data-testid="geo-editions" className="adm-note" style={{ margin: 0, paddingLeft: 16 }}>
          {GEO_EDITION_NOTES.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>
    </Panel>
  );
}
