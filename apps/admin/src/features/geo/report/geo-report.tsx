"use client";

// GEO 수치 (작업 0303 어드민 · 시안 Version 6) — 요약 숫자 4(안내판) → 주 그래프 · 봇 방문 → 이름 바꾼 날 전후 → 일반 질문 · 검색 노출 · 읽은 페이지 · 유입 → 봇별 읽은 페이지 → 측정 방법 · 읽는 법 · 한계
import type { GeoReport as Report } from "@hav/shared/geo";
import { Flap } from "@/shared/ui/flap/flap";
import { Panel } from "@/shared/ui/panel/panel";
import type { Fetched } from "@hav/shared/api";
import { REPO_URL } from "@/shared/site";
import { GEO_LIMITS, GEO_UNLINKED, geoReading, methodLinkText } from "../common/geo-view";
import { cardsView, methodHref } from "./report-view";
import { useGeoReport } from "./use-geo-report";
import { GeoAnswers } from "../answers/geo-answers";
import { GeoBotPages } from "../bots/geo-bot-pages";
import { GeoBots } from "../bots/geo-bots";
import { GeoPages } from "../pages/geo-pages";
import { GeoReferrals } from "../referrals/geo-referrals";
import { GeoSearch } from "../search/geo-search";
import { RenameCompare } from "../rename/rename-compare";
import { RenameQuestions } from "../rename/rename-questions";

export function GeoReport({ build, asOf }: { build: Fetched<Report>; asOf: string }) {
  const report = useGeoReport(build);
  if (!report.ok)
    return (
      <section className="adm-panel">
        <p className="adm-empty">측정 자료를 받지 못했습니다 ({report.reason})</p>
      </section>
    );
  const r = report.data;
  return (
    <>
      <section className="adm-panel" aria-label="요약">
        <dl data-testid="geo-cards" className="adm-stats">
          {cardsView(r).map((c, i) => (
            <div key={c.label} className="adm-stat">
              <dt>{c.label}</dt>
              <dd className="v">
                <Flap text={c.big} order={i} />
                {c.rest && <small>{c.rest}</small>}
              </dd>
              {c.note && <dd className="s">{c.note}</dd>}
            </div>
          ))}
        </dl>
      </section>
      <div className="adm-grid">
        <GeoAnswers report={r} />
        <GeoBots report={r} />
      </div>
      <RenameCompare report={r} asOf={asOf} />
      <div className="adm-grid">
        <RenameQuestions report={r} asOf={asOf} />
        <div className="adm-col">
          <GeoSearch report={r} />
          <GeoPages report={r} />
          <GeoReferrals report={r} />
        </div>
      </div>
      <div data-testid="geo-grid">
        <GeoBotPages report={r} />
      </div>
      <Panel id="geo-method" testId="geo-method" title="측정 방법 · 읽는 법" meta={<a className="adm-link" href={methodHref(REPO_URL)} target="_blank" rel="noreferrer">{methodLinkText(r)} ↗</a>}>
        <div className="adm-story" style={{ paddingTop: 0 }}>
          <section data-testid="geo-reading" aria-labelledby="geo-reading-title" style={{ paddingTop: 16 }}>
            <h3 id="geo-reading-title">이 수치를 읽는 법</h3>
            <ul>
              {geoReading(r).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <h3 style={{ marginTop: 16 }}>아직 연결하지 않은 자료</h3>
            <ul>
              <li>{GEO_UNLINKED}</li>
            </ul>
          </section>
          <section style={{ paddingTop: 16 }}>
            <h3>측정의 한계</h3>
            <ul>
              {GEO_LIMITS.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
        </div>
      </Panel>
    </>
  );
}
