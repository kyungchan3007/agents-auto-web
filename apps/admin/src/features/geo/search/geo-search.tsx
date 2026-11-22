// 구글 검색 노출 판 (Search Console · 작업 0214 → 0303 어드민) — 값은 geoDetail(report).search 그대로
import type { GeoReport } from "@hav/shared/geo";
import { Panel, Stamp } from "@/shared/ui/panel/panel";
import { EMPTY, GeoSub, GeoTable } from "../common/geo-table";
import { geoDetail } from "../common/geo-view";
import { searchStats } from "./search-view";

export function GeoSearch({ report }: { report: GeoReport }) {
  const s = geoDetail(report).search;
  return (
    <Panel id="geo-search" testId="geo-search" title="구글 검색 노출 (Search Console)" meta={s ? <Stamp>{s.range}</Stamp> : undefined}>
      {!s ? (
        <p className="adm-empty">아직 가져온 자료가 없습니다.</p>
      ) : (
        <>
          <dl className="adm-stats" style={{ ["--n" as string]: 3, borderBottom: "1px solid var(--a-line)" }}>
            {searchStats(s).map(({ label, value }) => (
              <div key={label} className="adm-stat">
                <dt>{label}</dt>
                <dd className="v" style={{ fontSize: 20 }}>
                  {value}
                </dd>
              </div>
            ))}
          </dl>
          <GeoSub title="상위 검색어">{s.queries.length === 0 ? <p className="adm-empty">{EMPTY}</p> : <GeoTable head={["검색어", "노출", "클릭", "순위"]} rows={s.queries} />}</GeoSub>
          <GeoSub title="검색에 나온 페이지">{s.pages.length === 0 ? <p className="adm-empty">{EMPTY}</p> : <GeoTable head={["페이지", "노출", "클릭", "순위"]} rows={s.pages} />}</GeoSub>
          <div className="adm-foot">
            <p className="adm-note">기간 {s.range} · Google Search Console 기준 · 구글 검색 전체 수치이며 AI 답변만 구분한 값이 아닙니다 · 며칠 늦게 반영됩니다</p>
          </div>
        </>
      )}
    </Panel>
  );
}
