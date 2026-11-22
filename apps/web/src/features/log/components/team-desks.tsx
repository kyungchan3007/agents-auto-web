// 팀 (작업 0170 → 작업 0303 어드민) — 이름(고정폭) · 맡은 일 · 다섯 자리(data 더함) · 역할 설명은 .agents/orchestration/team.md 와 같은 뜻
import { Panel } from "@hav/ui/admin/panel";
import { TEAM_DESKS } from "../lib/team";

export function TeamDesks() {
  return (
    <Panel id="log-team" title="팀">
      <ul data-testid="team-desks" className="adm-kv">
        {TEAM_DESKS.map((d) => (
          <li key={d.id}>
            <span className="name">{d.id}</span>
            <span className="role">{d.duty}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
