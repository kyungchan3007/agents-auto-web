// 페이지별 머무름 표 (작업 0349 · 시안 4) — 그리기만 (계산은 engagement-view) · 오늘 값이 없으면 "자료 없음" · 기준값 대비 오르내림은 기준값이 있을 때만
import type { Ga4Report } from "@hav/shared/ga4";
import { Panel, Stamp } from "@/shared/ui/panel/panel";
import { type Delta, baselineNote, engagementViews } from "./engagement-view";

const DeltaText = ({ d }: { d: Delta | null }) =>
  d && (
    <span data-testid="delta" data-dir={d.dir} className="adm-rel">
      {d.text}
    </span>
  );

export function EngagementTable({ report }: { report: Ga4Report }) {
  const rows = engagementViews(report.engagement, report.baseline);
  if (rows === null)
    return (
      <Panel id="traffic-engagement" title="페이지별 머무름" meta={<Stamp>최근 28일</Stamp>}>
        <p data-testid="traffic-engagement-empty" className="adm-empty">
          자료 없음 · 다음 수집 매일 04:50
        </p>
      </Panel>
    );
  return (
    <Panel id="traffic-engagement" testId="traffic-engagement" title="페이지별 머무름" meta={<Stamp>최근 28일</Stamp>}>
      <div className="adm-tw">
        <table>
          <thead>
            <tr>
              <th>페이지</th>
              <th className="n">페이지뷰</th>
              <th className="n">참여율</th>
              <th className="n">이탈률</th>
              <th className="n">다른 페이지로 넘어감</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.path} data-testid="traffic-engagement-row">
                <td data-col="path" className="mono">
                  {r.path}
                </td>
                <td data-col="views" className="n">
                  {r.viewsText}
                </td>
                <td data-col="engagementRate" className="n">
                  {r.engagement.text}
                  <DeltaText d={r.engagement.delta} />
                </td>
                <td data-col="bounceRate" className="n">
                  {r.bounce.text}
                  <DeltaText d={r.bounce.delta} />
                </td>
                <td data-col="perSession" className="n">
                  {r.perSession.text}
                  <DeltaText d={r.perSession.delta} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="adm-foot">
        <p data-testid="traffic-engagement-baseline" className="adm-note">
          {baselineNote(report.baseline)} · 참여율 = 참여한 세션 ÷ 세션 · 이탈률 = 100% − 참여율 · 넘어감 = 세션당 페이지뷰
        </p>
      </div>
    </Panel>
  );
}
