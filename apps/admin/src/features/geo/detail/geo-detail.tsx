"use client";

// GEO 자세한 기록 (작업 0214 → 작업 0303 어드민) — 날마다 측정 그래프(주) · 봇 방문 · 검색 노출 · AI 봇이 읽은 페이지 · AI 서비스 유입 · 봇별 읽은 페이지
//   질문별 결과 · 판 설명은 그래프 판 안에 접어 둠 · 값이 없으면 빈 상태 글자 · 자료 가공은 lib/geo-view.ts · lib/geo-bars.ts 그대로
import type { GeoReport } from "@hav/shared/geo";
import type { ReactNode } from "react";
import { Bars } from "../../../shared/ui/bars/bars";
import { Panel, Stamp } from "../../../shared/ui/panel/panel";
import { barRows, botPagesView, dayColumns } from "../common/geo-bars";
import { GEO_EDITION_NOTES, KIND_TEXT, geoDetail } from "../common/geo-view";
import { BotPages } from "../bots/bot-pages";
import { DayChart } from "../days/day-chart";

const EMPTY = "아직 기록이 없습니다";

function Table({ head, rows, numFrom = 1 }: { head: string[]; rows: (string | number)[][]; numFrom?: number }) {
  return (
    <div className="adm-tw">
      <table>
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={h} className={i >= numFrom ? "n" : undefined}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={String(r[0])}>
              {r.map((v, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: 칸 순서가 곧 키
                <td key={i} className={i >= numFrom ? "n" : i === 0 && String(v).startsWith("/") ? "mono" : undefined}>
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const Sub = ({ title, children }: { title: string; children: ReactNode }) => (
  <>
    <h3 className="adm-subh">{title}</h3>
    {children}
  </>
);

/** 주 그래프 판 */
export function GeoAnswers({ report }: { report: GeoReport }) {
  const d = geoDetail(report);
  const measured = d.answers.filter((a) => a.measured);
  const columns = dayColumns(report.answers?.history ?? []);
  const latest = measured[0];
  return (
    <Panel
      id="geo-answers"
      testId="geo-answers"
      title="AI 답변 인용 — 측정한 날마다"
      meta={<Stamp>{latest?.measured ? `${latest.name} · ${columns.length}일 · 최근 ${latest.day.slice(5)}` : "측정 전"}</Stamp>}
    >
      <div className="adm-pb">
        <p className="adm-note" style={{ marginBottom: 12, color: "var(--a-sub)" }}>
          정해 둔 질문 24개를 Claude 웹 검색으로 직접 묻고, 검색 결과와 답의 출처에 이 사이트가 나왔는지 기록합니다.
        </p>
        {columns.length === 0 ? <p className="adm-empty">{EMPTY}</p> : <DayChart columns={columns} />}
        <p className="adm-note" style={{ marginTop: 8 }}>
          측정한 날마다 기록 · 막대 = 그날 응답 받은 질문 수 · 파란 점 = 답에 인용 · 점선 = 측정 실패 (측정하지 않은 날은 비워 둠)
        </p>
        {measured.map((a) =>
          a.measured ? (
            <p key={a.engine} className="adm-note" style={{ marginTop: 6, color: "var(--a-ink)", fontWeight: 500 }}>
              {a.name} · {columns.length}일 측정 · 인용 {a.cited} · 검색 결과 {a.found} · 최근 {a.day}
              {a.failed > 0 ? ` · 실패 ${a.failed}` : ""}
            </p>
          ) : null,
        )}
        {d.answers.some((a) => !a.measured) && (
          <p className="adm-note" style={{ marginTop: 4 }}>
            {d.answers
              .filter((a) => !a.measured)
              .map((a) => a.name)
              .join(" · ")}{" "}
            는 키가 없어 측정 안 함
          </p>
        )}
      </div>
      {measured.map((a) =>
        a.measured ? (
          <details key={a.engine} data-testid="geo-questions" className="adm-more" style={{ borderTop: "1px solid var(--a-line)" }}>
            <summary>
              {a.name} 질문별 결과 ({a.day}) · {a.results.length}개
            </summary>
            <Table head={["질문", "구분", "답에 인용", "검색 결과에 나옴", "상태"]} rows={a.results} numFrom={2} />
          </details>
        ) : null,
      )}
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

/** 봇 방문 판 (오른쪽 좁은 칸) */
export function GeoBots({ report }: { report: GeoReport }) {
  const d = geoDetail(report);
  const byHits = <T extends { hits: number }>(list: T[]) => [...list].sort((a, b) => b.hits - a.hits);
  const ai = byHits(report.bots.filter((b) => b.kind !== "engine"));
  const engines = byHits(report.bots.filter((b) => b.kind === "engine"));
  const max = Math.max(0, ...report.bots.map((b) => b.hits));
  // 두 묶음을 같은 잣대로 (가장 많은 봇 = 끝)
  const rows = (list: typeof ai) => barRows([...list.map((b) => ({ label: b.name, value: b.hits })), { label: "\u0000", value: max }]).slice(0, -1);
  return (
    <Panel id="geo-bots" testId="geo-bots" title="AI 봇 · 검색 엔진 봇 방문" meta={<Stamp>지난 30일</Stamp>}>
      <Sub title="AI 봇별 방문">{ai.length === 0 ? <p className="adm-empty">{EMPTY}</p> : <Bars rows={rows(ai)} />}</Sub>
      <Sub title="일반 검색 엔진">{engines.length === 0 ? <p className="adm-empty">{EMPTY}</p> : <Bars rows={rows(engines)} />}</Sub>
      <div className="adm-foot">
        <p className="adm-note">
          {ai.map((b) => `${b.name} ${KIND_TEXT[b.kind]}`).join(" · ")}
          {ai.length > 0 && ` (최근 방문 ${ai.map((b) => b.lastDay).sort().at(-1)})`} · {d.period}
        </p>
      </div>
    </Panel>
  );
}

export function GeoSearch({ report }: { report: GeoReport }) {
  const d = geoDetail(report);
  return (
    <Panel id="geo-search" testId="geo-search" title="구글 검색 노출 (Search Console)" meta={d.search ? <Stamp>{d.search.range}</Stamp> : undefined}>
      {!d.search ? (
        <p className="adm-empty">아직 가져온 자료가 없습니다.</p>
      ) : (
        <>
          <dl className="adm-stats" style={{ ["--n" as string]: 3, borderBottom: "1px solid var(--a-line)" }}>
            {[
              ["노출", d.search.impressions],
              ["클릭", d.search.clicks],
              ["평균 순위", d.search.position],
            ].map(([label, value]) => (
              <div key={label} className="adm-stat">
                <dt>{label}</dt>
                <dd className="v" style={{ fontSize: 20 }}>
                  {value}
                </dd>
              </div>
            ))}
          </dl>
          <Sub title="상위 검색어">{d.search.queries.length === 0 ? <p className="adm-empty">{EMPTY}</p> : <Table head={["검색어", "노출", "클릭", "순위"]} rows={d.search.queries} />}</Sub>
          <Sub title="검색에 나온 페이지">{d.search.pages.length === 0 ? <p className="adm-empty">{EMPTY}</p> : <Table head={["페이지", "노출", "클릭", "순위"]} rows={d.search.pages} />}</Sub>
          <div className="adm-foot">
            <p className="adm-note">기간 {d.search.range} · Google Search Console 기준 · 구글 검색 전체 수치이며 AI 답변만 구분한 값이 아닙니다 · 며칠 늦게 반영됩니다</p>
          </div>
        </>
      )}
    </Panel>
  );
}

export function GeoPages({ report }: { report: GeoReport }) {
  return (
    <Panel id="geo-pages" testId="geo-pages" title="AI 봇이 읽은 페이지" meta={<Stamp>일반 검색 엔진 제외</Stamp>}>
      {report.pages.length === 0 ? <p className="adm-empty">{EMPTY}</p> : <Bars rows={barRows(report.pages.map((p) => ({ label: p.path, value: p.hits })))} />}
    </Panel>
  );
}

export function GeoReferrals({ report }: { report: GeoReport }) {
  const d = geoDetail(report);
  return (
    <Panel id="geo-referrals" testId="geo-referrals" title="AI 서비스 유입">
      {d.referrals.length === 0 ? <p className="adm-empty">{EMPTY}</p> : <Table head={["서비스", "횟수", "최근"]} rows={d.referrals} />}
    </Panel>
  );
}

export function GeoBotPages({ report }: { report: GeoReport }) {
  const bots = botPagesView(report.botPages);
  return (
    <Panel id="geo-bot-pages" testId="geo-bot-pages" title="봇별 읽은 페이지" meta={<Stamp>많이 읽은 상위 5곳 · 사람 유입 · 운영 확인 제외</Stamp>}>
      <div className="adm-pb">
        <p className="adm-note" style={{ marginBottom: 12 }}>
          봇마다 어떤 페이지를 몇 번 읽었는지 (Googlebot · bingbot 같은 검색 엔진 봇 포함)
        </p>
        {bots.length === 0 ? <p className="adm-empty" style={{ padding: 0 }}>{EMPTY}</p> : <BotPages bots={bots} />}
      </div>
    </Panel>
  );
}
