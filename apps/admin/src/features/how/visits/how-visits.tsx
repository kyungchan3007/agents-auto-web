"use client";

// 만드는 방식 — 접속 기록 (작업 0326 · 맨 아래 작은 표) · 지원 토큰 이름별 처음 · 마지막 접속 시각만 · IP · 기기 · 경로는 받지 않음
//   작업 0339: 본인(owner)에게만 보임 · 다른 토큰이면 표를 그리지 않고 /bff/admin-visits 도 부르지 않음(Worker 도 404)
import { useIsOwner } from "@/shared/gate/use-is-owner";
import { Panel } from "@/shared/ui/panel/panel";
import { useAdminVisits } from "./use-admin-visits";
import { visitRows } from "./visits-view";

export function HowVisits() {
  return useIsOwner() ? <VisitsTable /> : null;
}

function VisitsTable() {
  const r = useAdminVisits();
  const rows = r?.ok ? visitRows(r.data) : [];
  return (
    <Panel id="how-visits" title="접속 기록" testId="admin-visits">
      <div className="adm-pb">
        <p className="adm-note">지원 링크로 들어온 이름별로 처음 · 마지막에 접속한 시각(한국 시간)만 남깁니다.</p>
      </div>
      {r && !r.ok && (
        <p className="adm-pb adm-note" data-testid="admin-visits-error">
          접속 기록을 받지 못했습니다
        </p>
      )}
      {r?.ok && rows.length === 0 && (
        <p className="adm-pb adm-note" data-testid="admin-visits-empty">
          아직 접속 기록이 없습니다
        </p>
      )}
      {rows.length > 0 && (
        <div className="adm-visits">
          <div className="h" aria-hidden>
            <span>토큰 이름</span>
            <span>처음</span>
            <span>마지막</span>
          </div>
          {rows.map((v) => (
            <div key={v.name} className="r" data-testid="admin-visit-row" data-name={v.name}>
              <span data-col="name">{v.name}</span>
              <span data-col="firstAt">{v.firstAt}</span>
              <span data-col="lastAt">{v.lastAt}</span>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
