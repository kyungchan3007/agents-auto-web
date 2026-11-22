// Herdr 로 보는 팀 — 자리마다 처음 받는 지시 (작업 0303 · 0312 에 how-page.tsx 에서 나눔)
import { Panel, Stamp } from "@/shared/ui/panel/panel";
import { HOW_PANES } from "../common/how";

export function HowHerdr() {
  return (
    <Panel id="how-herdr" title="Herdr 로 보는 팀" meta={<Stamp>자리마다 처음 받는 지시 (rig.template.yaml 그대로)</Stamp>}>
      <div className="adm-pb">
        <div className="adm-herdr">
          {HOW_PANES.map((p, i) => (
            <div key={p.seat} className={`adm-pane${i === 0 ? " big" : ""}`}>
              <div className="adm-pt">
                <i aria-hidden />
                <b>dev-{p.seat}@hav</b>
                <span>{p.model}</span>
              </div>
              <p>
                <span className="pr" aria-hidden>
                  ›
                </span>
                {p.first}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}
