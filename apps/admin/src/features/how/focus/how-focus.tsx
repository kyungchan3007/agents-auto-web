// 만드는 방식 — 세 칸: 데이터 흐름 · 상태 관리 · 에이전트 최적화 (작업 0306) · 칸마다 근거 파일 링크
import { Panel } from "../../../shared/ui/panel/panel";
import { REPO_BLOB } from "../common/how";
import { HOW_FOCUS } from "../trials/story";

export function HowFocus() {
  return (
    <div className="adm-tools3" data-testid="how-focus">
      {HOW_FOCUS.map((f, i) => (
        <Panel key={f.title} id={`how-focus-${i + 1}`} title={f.title} className="adm-tool">
          <div className="adm-pb">
            <p className="adm-fc-lead">{f.lead}</p>
            <ul className="adm-fc">
              {f.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <a className="adm-link src" href={`${REPO_BLOB}${f.source}`} target="_blank" rel="noreferrer">
              근거 보기 ↗
            </a>
          </div>
        </Panel>
      ))}
    </div>
  );
}
