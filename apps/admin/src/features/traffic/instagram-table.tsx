// 인스타 유입 표 (작업 0374) — 그리기만 (계산은 human-view) · 받지 못했으면(null) 표를 그리지 않음
import type { Ga4Report } from "@hav/shared/ga4";
import { Panel, Stamp } from "@/shared/ui/panel/panel";
import { instagramViews } from "./human-view";

export function InstagramTable({ report }: { report: Ga4Report }) {
  const rows = instagramViews(report.instagram);
  if (rows === null) return null;
  return (
    <Panel
      id="traffic-instagram"
      testId="traffic-instagram"
      title="인스타 유입"
      meta={<Stamp>기간 합 · 링크 = 리퍼러 · utm = utm_source=instagram</Stamp>}
    >
      <div className="adm-tw">
        <table>
          <thead>
            <tr>
              <th>구분</th>
              <th className="n">세션</th>
              <th className="n">사용자</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.kind}
                data-testid="traffic-instagram-row"
                data-kind={r.kind}
              >
                <td data-col="label">{r.label}</td>
                <td data-col="sessions" className="n">
                  {r.sessionsText}
                </td>
                <td data-col="users" className="n">
                  {r.usersText}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
