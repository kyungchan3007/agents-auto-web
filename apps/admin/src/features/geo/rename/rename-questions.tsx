"use client";

// 일반 질문 판 (작업 0205 → 0303 어드민) — 같은 질문끼리 앞뒤로 · 브랜드 질문은 시기별로 따로
import type { GeoReport } from "@hav/shared/geo";
import { Panel, Stamp } from "@/shared/ui/panel/panel";
import { QuestionsTable } from "./questions-table";
import { NONE, brandText } from "./rename-text";
import { useRenameCompare } from "./use-rename-compare";

export function RenameQuestions({ report, asOf }: { report: GeoReport; asOf: string }) {
  const c = useRenameCompare(report, asOf);
  return (
    <Panel id="geo-questions-compare" testId="rename-questions" title={`AI 답변 — 일반 질문${c.answers ? ` ${c.answers.general.length}개` : ""}`} meta={<Stamp>찾음 · 인용 / 측정 횟수</Stamp>}>
      {c.answers && c.answers.general.length > 0 ? <QuestionsTable rows={c.answers.general} before="바꾸기 전" after="바꾼 뒤" /> : <p className="adm-empty">{NONE}</p>}
      <div className="adm-foot">
        <ul data-testid="rename-brand" className="adm-note" style={{ margin: 0, paddingLeft: 16 }}>
          <li>Tripfx 시기(1 · 2판): {c.answers ? brandText(c.answers.brand.tripfx) : NONE}</li>
          <li>Flapfx 시기(3판): {c.answers ? brandText(c.answers.brand.flapfx) : NONE}</li>
          <li>브랜드 질문은 이름이 달라 이어 비교하지 않고 시기별로 따로 봅니다.</li>
        </ul>
      </div>
    </Panel>
  );
}
