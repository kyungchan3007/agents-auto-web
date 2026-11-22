// AI 봇 · 검색 엔진 봇 방문 판 (오른쪽 좁은 칸 · 작업 0214 → 0303 어드민) — 보일 값은 bots-view.ts
import type { GeoReport } from "@hav/shared/geo";
import { Bars } from "@/shared/ui/bars/bars";
import { Panel, Stamp } from "@/shared/ui/panel/panel";
import { EMPTY, GeoSub } from "../common/geo-table";
import { botBarGroups } from "./bots-view";

export function GeoBots({ report }: { report: GeoReport }) {
  const v = botBarGroups(report);
  return (
    <Panel id="geo-bots" testId="geo-bots" title="AI 봇 · 검색 엔진 봇 방문" meta={<Stamp>지난 30일</Stamp>}>
      <GeoSub title="AI 봇별 방문">{v.ai.length === 0 ? <p className="adm-empty">{EMPTY}</p> : <Bars rows={v.ai} />}</GeoSub>
      <GeoSub title="일반 검색 엔진">{v.engines.length === 0 ? <p className="adm-empty">{EMPTY}</p> : <Bars rows={v.engines} />}</GeoSub>
      <div className="adm-foot">
        <p className="adm-note">{v.foot}</p>
      </div>
    </Panel>
  );
}
