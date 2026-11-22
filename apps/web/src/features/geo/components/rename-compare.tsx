"use client";

// 이름 바꾼 날 전후 비교 (작업 0205 · #243 → 작업 0303 어드민) — 봇 방문 하루 평균(날짜별 작은 막대 · 점선 = 이름 바꾼 날) · AI 서비스 유입 · 검색 노출
//   일반 질문은 따로 판(RenameQuestions · 걸러 보기 · 정렬) · 하루 평균 = 합계 ÷ 그 기간의 달력 날짜 수 (방문 없는 날 포함) · 자료가 없는 칸은 "아직 없음"
import { numberText } from "@hav/shared/format";
import type { GeoReport } from "@hav/shared/geo";
import { Panel, Stamp } from "@hav/ui/admin/panel";
import { useRenameCompare } from "../hooks/use-rename-compare";
import { type BrandSummary, type DayHits, type Period, perDayText } from "../lib/rename-compare";
import { QuestionsTable } from "./questions-table";

const NONE = "아직 없음";
const periodText = (p: Period | null) => (p ? `하루 ${perDayText(p.perDay)}회 (합계 ${numberText(p.total)}회)` : "기록 없음");

/** 날짜별 작은 막대 — 기준일 위치에 세로 점선 · 같은 숫자를 aria-label 글로 */
function DayBars({ name, daily, dayMark }: { name: string; daily: DayHits[]; dayMark: string }) {
  const n = daily.length;
  if (n === 0) return <span className="m">{NONE}</span>;
  const max = Math.max(1, ...daily.map((d) => d.hits));
  const w = 100 / n;
  const at = daily.findIndex((d) => d.day === dayMark);
  const label = `${name} 날짜별 방문: ${daily.map((d) => `${d.day.slice(5)} ${d.hits}회`).join(", ")}${at >= 0 ? ` (${dayMark} 이름 바꾼 날)` : ""}`;
  return (
    <svg role="img" aria-label={label} data-testid="rename-bars" viewBox="0 0 100 30" preserveAspectRatio="none" style={{ display: "block", height: 24, width: 140 }}>
      <line x1="0" x2="100" y1="29.5" y2="29.5" stroke="var(--a-line2)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
      {daily.map((d) => (
        <rect key={d.day} x={daily.indexOf(d) * w + w * 0.15} width={w * 0.7} y={29 - (d.hits / max) * 27} height={(d.hits / max) * 27} fill={d.day >= dayMark ? "var(--a-blue)" : "var(--a-bar2)"} />
      ))}
      {at >= 0 && <line x1={at * w} x2={at * w} y1="0" y2="30" stroke="var(--a-mute)" strokeWidth={1} strokeDasharray="3 2" vectorEffect="non-scaling-stroke" />}
    </svg>
  );
}

function brandText(b: BrandSummary | null): string {
  if (!b) return "측정 기록 없음";
  return `${b.days}일 측정 (${b.first} ~ ${b.last}) · ${b.measured === 0 ? "측정 기록 없음" : `찾음 ${b.found} · 인용 ${b.cited} / ${b.measured}회`}`;
}

export function RenameCompare({ report, asOf }: { report: GeoReport; asOf: string }) {
  const c = useRenameCompare(report, asOf);
  const before = `바꾸기 전 ${c.beforeDays}일`;
  const after = `바꾼 뒤 ${c.afterDays}일`;
  return (
    <Panel id="geo-rename" testId="rename-compare" title="이름 바꾼 날 전후 비교" meta={<Stamp>기준 {c.day}</Stamp>}>
      <div className="adm-pb" style={{ paddingBottom: 8 }}>
        <p data-testid="rename-day" className="adm-note" style={{ color: "var(--a-sub)", fontSize: 13 }}>
          이름 바꾼 날 {c.day} (Tripfx → Flapfx · tripfx.pages.dev → flapfx.com) · 하루 평균은 방문 없는 날을 포함한 달력 날짜 수로 나눕니다 ({before} · {after}).
        </p>
        <p data-testid="rename-asof" className="adm-note" style={{ marginTop: 4 }}>
          자료 기준일 {c.asOf} · 바꾸기 전 = {c.beforeRange ?? "기록 없음"} (응답에 남은 첫 기록일부터) · 바꾼 뒤 = {c.day} ~ {c.asOf}
        </p>
        {c.beforeShort && (
          <p data-testid="rename-before-short" className="adm-note" style={{ marginTop: 4 }}>
            전 기간이 {c.beforeDays}일로 짧아 비교는 참고용입니다.
          </p>
        )}
        {c.short && (
          <p data-testid="rename-short" className="adm-note" style={{ marginTop: 4 }}>
            후 기간이 {c.afterDays}일로 짧아 비교는 참고용입니다.
          </p>
        )}
      </div>
      <h3 className="adm-subh">봇 방문 (하루 평균)</h3>
      {c.bots && c.bots.length > 0 ? (
        <div className="adm-tw">
          <table>
            <caption className="sr-only">일반 검색 엔진 · AI 봇 모두 · 운영 확인 방문 제외</caption>
            <thead>
              <tr>
                <th>봇</th>
                <th>날짜별 (점선 = 이름 바꾼 날)</th>
                <th className="n">{before}</th>
                <th className="n">{after}</th>
              </tr>
            </thead>
            <tbody>
              {c.bots.map((b) => (
                <tr key={b.name}>
                  <td className="mono">{b.name}</td>
                  <td>
                    <DayBars name={b.name} daily={b.daily} dayMark={c.day} />
                  </td>
                  <td className="n">{periodText(b.before)}</td>
                  <td className="n">{periodText(b.after)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="adm-empty">{NONE}</p>
      )}
      <h3 className="adm-subh" style={{ paddingTop: 20 }}>
        AI 서비스 유입
      </h3>
      {c.referrals && c.referrals.rows.length > 0 ? (
        <div className="adm-tw">
          <table>
            <thead>
              <tr>
                <th>서비스</th>
                <th className="n">{before}</th>
                <th className="n">{after}</th>
              </tr>
            </thead>
            <tbody>
              {[...c.referrals.rows.map((x) => ({ name: x.name, before: x.before, after: x.after })), { name: "합계", before: c.referrals.sum.before, after: c.referrals.sum.after }].map((x) => (
                <tr key={x.name}>
                  <td>{x.name}</td>
                  <td className="n">{periodText(x.before)}</td>
                  <td className="n">{periodText(x.after)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="adm-empty">{NONE}</p>
      )}
      <h3 className="adm-subh" style={{ paddingTop: 20 }}>
        검색 노출 (Search Console)
      </h3>
      <ul data-testid="rename-search" className="adm-pb adm-note" style={{ margin: 0, paddingLeft: 36, color: "var(--a-sub)" }}>
        <li>옛 속성(tripfx.pages.dev): {c.search.old ? `노출 ${numberText(c.search.old.impressions)}회 · 클릭 ${numberText(c.search.old.clicks)}회 (${c.search.old.range})` : NONE}</li>
        <li>새 속성(flapfx.com): 아직 없음 (Search Console 새 속성 등록 대기 #214)</li>
      </ul>
    </Panel>
  );
}

/** 일반 질문 — 같은 질문끼리 앞뒤로 · 브랜드 질문은 시기별로 따로 */
export function RenameQuestions({ report, asOf }: { report: GeoReport; asOf: string }) {
  const c = useRenameCompare(report, asOf);
  return (
    <Panel id="geo-questions-compare" testId="rename-questions" title={`AI 답변 — 일반 질문${c.answers ? ` ${c.answers.general.length}개` : ""}`} meta={<Stamp>찾음 · 인용 / 측정 횟수</Stamp>}>
      {c.answers && c.answers.general.length > 0 ? (
        <QuestionsTable rows={c.answers.general} before={`바꾸기 전`} after={`바꾼 뒤`} />
      ) : (
        <p className="adm-empty">{NONE}</p>
      )}
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
