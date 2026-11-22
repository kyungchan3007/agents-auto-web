"use client";

// 이름 바꾼 날 전후 비교 (작업 0205 · #243 → 작업 0303 어드민) — 봇 방문 하루 평균(날짜별 작은 막대 · 점선 = 이름 바꾼 날) · AI 서비스 유입 · 검색 노출
//   일반 질문은 따로 판(rename-questions.tsx · 걸러 보기 · 정렬) · 문구는 rename-text.ts · 하루 평균 = 합계 ÷ 그 기간의 달력 날짜 수 (방문 없는 날 포함) · 자료가 없는 칸은 "아직 없음"
import type { GeoReport } from "@hav/shared/geo";
import { Panel, Stamp } from "@/shared/ui/panel/panel";
import { useRenameCompare } from "./use-rename-compare";
import { DayBars } from "./day-bars";
import { NONE, oldSearchText, periodLabels, periodText, referralRows } from "./rename-text";

export function RenameCompare({ report, asOf }: { report: GeoReport; asOf: string }) {
  const c = useRenameCompare(report, asOf);
  const { before, after } = periodLabels(c);
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
              {referralRows(c.referrals).map((x) => (
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
        <li>옛 속성(tripfx.pages.dev): {oldSearchText(c.search.old)}</li>
        <li>새 속성(flapfx.com): 아직 없음 (Search Console 새 속성 등록 대기 #214)</li>
      </ul>
    </Panel>
  );
}
