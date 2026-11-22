// 작업 흐름 (작업 0170 → 작업 0303 어드민) — 한 줄 여섯 칸 · 완료 기준인 "자동 검사 통과"만 위 파란 선 + 표시 · 휴대폰은 두 칸씩
import { Panel, Stamp } from "@hav/ui/admin/panel";
import { WORK_FLOW } from "../lib/team";

const KEY = "자동 검사 통과";

export function WorkFlow() {
  return (
    <Panel id="log-flow" title="작업 흐름" meta={<Stamp>모든 작업이 이 순서로</Stamp>}>
      <ol data-testid="work-flow" className="adm-flow">
        {WORK_FLOW.map((step) => (
          <li key={step} className={step === KEY ? "key" : undefined}>
            {step}
            {step === KEY && <span className="adm-tag">완료 기준</span>}
          </li>
        ))}
      </ol>
    </Panel>
  );
}
