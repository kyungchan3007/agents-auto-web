"use client";

// 인스타 성과 (작업 0323 · 0324 에 알리기 탭에서 인스타 성과 화면으로) — 계정 지표 가장 최근 날 값 · 게시물 표 · 받지 못한 값은 빈 칸 · 그래프는 자료가 쌓인 뒤 따로
import { countText } from "@/shared/format/count-text";
import { Panel, Stamp } from "@/shared/ui/panel/panel";
import { ACCOUNT_CELLS, type IgAccountDay, type IgMediaLine, MEDIA_COLS, isEmptyReport, latestAccount, postedDay } from "./ig-view";
import { useIgReport } from "./use-ig-report";

export function IgSection() {
  const report = useIgReport();
  return (
    <Panel id="instagram-ig" testId="instagram-ig" title="인스타 성과" meta={<Stamp>매일 한 번 받은 값 · 받지 못한 값은 빈 칸</Stamp>}>
      {report === null ? (
        <p className="adm-empty">성과 값을 받는 중입니다</p>
      ) : !report.ok ? (
        <p data-testid="ig-error" className="adm-empty">
          성과 값을 받지 못했습니다 ({report.reason})
        </p>
      ) : isEmptyReport(report.data) ? (
        <p data-testid="ig-empty" className="adm-empty">
          아직 받은 성과 값이 없습니다
        </p>
      ) : (
        <IgBody account={latestAccount(report.data)} media={report.data.media} />
      )}
    </Panel>
  );
}

function IgBody({ account, media }: { account: IgAccountDay | null; media: IgMediaLine[] }) {
  return (
    <>
      {account && <Account day={account} />}
      <Media rows={media} />
    </>
  );
}

function Account({ day }: { day: IgAccountDay }) {
  return (
    <div data-testid="ig-account">
      <p className="adm-note" style={{ padding: "0 20px" }}>
        계정 · 받은 날짜 <span data-testid="ig-account-day">{day.day}</span>
      </p>
      <dl className="adm-stats">
        {ACCOUNT_CELLS.map((c) => (
          <div key={c.key} className="adm-stat">
            <dt>{c.label}</dt>
            <dd data-testid="ig-account-metric" data-metric={c.key} className="v">
              {countText(day[c.key])}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Media({ rows }: { rows: IgMediaLine[] }) {
  return (
    <div data-testid="ig-media" className="adm-tw">
      <table>
        <thead>
          <tr>
            <th>게시 날짜</th>
            <th>게시물</th>
            {MEDIA_COLS.map((c) => (
              <th key={c.col} className="n">
                {c.label}
              </th>
            ))}
            <th className="n">받은 날짜</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((m) => (
            <tr key={m.mediaId} data-testid="ig-media-row" data-media-id={m.mediaId}>
              <td data-col="postedAt" className="mono">
                {postedDay(m.postedAt)}
              </td>
              <td data-col="link">
                <a className="adm-link" href={m.permalink} target="_blank" rel="noreferrer">
                  게시물 ↗
                </a>
              </td>
              {MEDIA_COLS.map((c) => (
                <td key={c.col} data-col={c.col} className="n">
                  {countText(m[c.col])}
                </td>
              ))}
              <td data-col="day" className="n mono">
                {m.day ?? ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
