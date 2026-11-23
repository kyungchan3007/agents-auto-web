"use client";

// 유입 화면 내용 — 받는 중 · 실패 · 빈 상태 · 표 세 개 (작업 0324)
import { Panel, Stamp } from "@/shared/ui/panel/panel";
import { countText } from "@/shared/format/count-text";
import { isEmptyTraffic } from "./traffic-view";
import { useGa4Report } from "./use-ga4-report";

export function TrafficBody() {
  const report = useGa4Report();
  if (report === null)
    return (
      <Panel id="traffic-loading" title="유입">
        <p className="adm-empty">유입 값을 받는 중입니다</p>
      </Panel>
    );
  if (!report.ok)
    return (
      <Panel id="traffic-failed" title="유입">
        <p data-testid="traffic-error" className="adm-empty">
          유입 값을 받지 못했습니다 ({report.reason})
        </p>
      </Panel>
    );
  const r = report.data;
  if (isEmptyTraffic(r))
    return (
      <Panel id="traffic-none" title="유입">
        <p data-testid="traffic-empty" className="adm-empty">
          아직 받은 유입 값이 없습니다
        </p>
      </Panel>
    );
  return (
    <>
      <Panel id="traffic-daily" testId="traffic-daily" title="날짜별" meta={<Stamp>최근 날부터</Stamp>}>
        <div className="adm-tw">
          <table>
            <thead>
              <tr>
                <th>날짜</th>
                <th className="n">사용자</th>
                <th className="n">세션</th>
                <th className="n">페이지뷰</th>
              </tr>
            </thead>
            <tbody>
              {r.daily.map((d) => (
                <tr key={d.day} data-testid="traffic-daily-row" data-day={d.day}>
                  <td data-col="day" className="mono">
                    {d.day}
                  </td>
                  <td data-col="users" className="n">
                    {countText(d.users)}
                  </td>
                  <td data-col="sessions" className="n">
                    {countText(d.sessions)}
                  </td>
                  <td data-col="pageViews" className="n">
                    {countText(d.pageViews)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel id="traffic-sources" testId="traffic-sources" title="유입 경로" meta={<Stamp>기간 합 · 세션 많은 순 · 위 20개</Stamp>}>
        <div className="adm-tw">
          <table>
            <thead>
              <tr>
                <th>출처</th>
                <th>매체</th>
                <th>캠페인</th>
                <th className="n">세션</th>
                <th className="n">사용자</th>
              </tr>
            </thead>
            <tbody>
              {r.sources.map((s) => (
                <tr key={`${s.source}/${s.medium}/${s.campaign}`} data-testid="traffic-source-row">
                  <td data-col="source" className="mono">
                    {s.source}
                  </td>
                  <td data-col="medium" className="mono">
                    {s.medium}
                  </td>
                  <td data-col="campaign" className="mono">
                    {s.campaign}
                  </td>
                  <td data-col="sessions" className="n">
                    {countText(s.sessions)}
                  </td>
                  <td data-col="users" className="n">
                    {countText(s.users)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel id="traffic-pages" testId="traffic-pages" title="많이 본 페이지" meta={<Stamp>기간 합 · 조회 많은 순 · 위 20개</Stamp>}>
        <div className="adm-tw">
          <table>
            <thead>
              <tr>
                <th>경로</th>
                <th className="n">페이지뷰</th>
              </tr>
            </thead>
            <tbody>
              {r.pages.map((p) => (
                <tr key={p.path} data-testid="traffic-page-row">
                  <td data-col="path" className="mono">
                    {p.path}
                  </td>
                  <td data-col="views" className="n">
                    {countText(p.views)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
