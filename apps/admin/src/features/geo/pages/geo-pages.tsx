// AI 봇이 읽은 페이지 판 (작업 0214 → 0303 어드민) — 일반 검색 엔진 제외
import type { GeoReport } from "@hav/shared/geo";
import { Bars } from "@/shared/ui/bars/bars";
import { Panel, Stamp } from "@/shared/ui/panel/panel";
import { pageRows } from "../common/geo-bars";
import { EMPTY } from "../common/geo-table";

export function GeoPages({ report }: { report: GeoReport }) {
  return (
    <Panel id="geo-pages" testId="geo-pages" title="AI 봇이 읽은 페이지" meta={<Stamp>일반 검색 엔진 제외</Stamp>}>
      {report.pages.length === 0 ? <p className="adm-empty">{EMPTY}</p> : <Bars rows={pageRows(report)} />}
    </Panel>
  );
}
