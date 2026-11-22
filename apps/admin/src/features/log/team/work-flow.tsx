// 작업 흐름 (작업 0170 → 작업 0303 어드민) — 한 줄 여섯 칸 · 완료 기준인 "자동 검사 통과"만 위 파란 선 + 표시 · 휴대폰은 두 칸씩
import { Panel, Stamp } from "@/shared/ui/panel/panel";
import { workFlowSteps } from "./team";

const STEPS = workFlowSteps();

export function WorkFlow() {
  return (
    <Panel id="log-flow" title="작업 흐름" meta={<Stamp>모든 작업이 이 순서로</Stamp>}>
      <ol data-testid="work-flow" className="adm-flow">
        {STEPS.map(({ step, key }) => (
          <li key={step} className={key ? "key" : undefined}>
            {step}
            {key && <span className="adm-tag">완료 기준</span>}
          </li>
        ))}
      </ol>
    </Panel>
  );
}
