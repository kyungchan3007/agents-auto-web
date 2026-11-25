// 버튼 클릭 표 (작업 0359) — 그리기만 (계산은 click-view) · 자료가 없으면 "자료 없음" · 그 전 날짜는 0 이 아니라 "기록 전"
import type { Ga4Report } from "@hav/shared/ga4";
import { Panel, Stamp } from "@/shared/ui/panel/panel";
import { clickViews, sinceText } from "./click-view";

export function ClickTable({ report }: { report: Ga4Report }) {
  const rows = clickViews(report.clicks);
  if (rows === null || report.clicks === null)
    return (
      <Panel id="traffic-clicks-none" title="버튼 클릭" meta={<Stamp>최근 28일</Stamp>}>
        <p data-testid="traffic-clicks-empty" className="adm-empty">
          자료 없음 · 이벤트를 보내기 시작한 뒤 다음 수집(매일 04:50)부터 들어옵니다
        </p>
      </Panel>
    );
  return (
    <Panel id="traffic-clicks" testId="traffic-clicks" title="버튼 클릭" meta={<Stamp>최근 28일</Stamp>}>
      <div className="adm-empty">
        <p data-testid="traffic-clicks-since" className="adm-note">
          {sinceText(report.clicks.since)}
        </p>
      </div>
      <div className="adm-tw">
        <table>
          <thead>
            <tr>
              <th>버튼</th>
              <th>있는 페이지</th>
              <th className="n">클릭 수</th>
              <th className="n">누른 사람(일별 합)</th>
              <th className="n">하루 평균</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} data-testid="traffic-clicks-row">
                <td data-col="label">{r.label}</td>
                <td data-col="page" className="mono">
                  {r.page}
                </td>
                <td data-col="count" className="n">
                  {r.countText}
                </td>
                <td data-col="users" className="n">
                  {r.usersText}
                </td>
                <td data-col="perDay" className="n">
                  {r.perDayText}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="adm-foot">
        <p className="adm-note">누른 사람은 날짜별 수의 합이라 여러 날 누른 같은 사람은 겹쳐 셉니다 · 하루 평균은 보내기 시작한 날부터 어제까지로 나눕니다</p>
      </div>
    </Panel>
  );
}
