// AI 서비스 유입 판 (작업 0214 → 0303 어드민)
import type { GeoReport } from "@hav/shared/geo";
import { Panel } from "@/shared/ui/panel/panel";
import { EMPTY, GeoTable } from "../common/geo-table";
import { geoDetail } from "../common/geo-view";

export function GeoReferrals({ report }: { report: GeoReport }) {
  const referrals = geoDetail(report).referrals;
  return (
    <Panel id="geo-referrals" testId="geo-referrals" title="AI 서비스 유입">
      {referrals.length === 0 ? <p className="adm-empty">{EMPTY}</p> : <GeoTable head={["서비스", "횟수", "최근"]} rows={referrals} />}
    </Panel>
  );
}
