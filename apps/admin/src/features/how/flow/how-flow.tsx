"use client";

// 작업 하나가 지나가는 길 (작업 0303 · 0312 에 how-page.tsx 에서 나눔) — 자리 누르면 설명 · 따라가기 · 상태는 use-flow-play · 글은 common/how.ts
import { Panel } from "@/shared/ui/panel/panel";
import { HOW_STEPS, type NodeId } from "../common/how";
import { nodeOf, playLabel, stepClass } from "./flow-view";
import { useFlowPlay } from "./use-flow-play";

function NodeBtn({ id, picked, lit, onPick }: { id: NodeId; picked: NodeId | null; lit: NodeId | null; onPick: (id: NodeId) => void }) {
  const n = nodeOf(id);
  return (
    <button type="button" className={`adm-node${lit === id ? " lit" : ""}`} aria-pressed={picked === id} onClick={() => onPick(id)} data-node={id}>
      <b>{n.name}</b>
      <span>{n.kind}</span>
      {n.model && <span className="nm">{n.model}</span>}
    </button>
  );
}

export function HowFlow() {
  const { picked, at, playing, lit, play, pick, step } = useFlowPlay();
  const n = picked ? nodeOf(picked) : null;
  const props = { picked, lit, onPick: pick };
  return (
    <Panel
      id="how-flow"
      testId="how-flow"
      title="작업 하나가 지나가는 길"
      meta={
        <button type="button" className="adm-btn" onClick={play} aria-pressed={playing}>
          {playLabel(playing, at)}
        </button>
      }
    >
      <div className="adm-pb">
        <div className="adm-flow2">
          <div className="adm-lane">
            <NodeBtn id="human" {...props} />
          </div>
          <span className="adm-arr" aria-hidden />
          <div className="adm-lane">
            <NodeBtn id="desk" {...props} />
          </div>
          <span className="adm-arr" aria-hidden />
          <div className="adm-lane team">
            <span className="adm-teamlbl">OpenRig 팀 hav · Herdr 한 화면</span>
            <NodeBtn id="lead" {...props} />
            <div className="adm-crew">
              <NodeBtn id="builder" {...props} />
              <NodeBtn id="test" {...props} />
              <NodeBtn id="geo" {...props} />
              <NodeBtn id="data" {...props} />
            </div>
          </div>
          <span className="adm-arr" aria-hidden />
          <div className="adm-lane">
            <NodeBtn id="gate" {...props} />
          </div>
          <span className="adm-arr" aria-hidden />
          <div className="adm-lane">
            <NodeBtn id="ship" {...props} />
          </div>
        </div>
        <ol className="adm-steps" aria-live="polite">
          {HOW_STEPS.map((s, i) => (
            // biome-ignore lint/a11y/useKeyWithClickEvents: 같은 동작을 위 그림의 단추 · 따라가기로도 함
            <li
              key={`${s.node}-${i}`}
              className={stepClass(i, at)}
              onClick={() => step(i)}
            >
              {s.text}
            </li>
          ))}
        </ol>
        <div className="adm-nd" data-testid="how-node-detail">
          {!n ? (
            <p className="adm-note">그림의 자리를 누르면 그 자리가 하는 일과 하지 않는 일이 보입니다</p>
          ) : (
            <div key={n.id}>
              <div className="adm-ndh">
                <b>{n.name}</b>
                <span>
                  {n.kind}
                  {n.model && ` · 모델 ${n.model}`}
                </span>
              </div>
              <div className="adm-ndb">
                <div>
                  <h3>하는 일</h3>
                  <ul>
                    {n.does.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3>하지 않는 일</h3>
                  <ul className="no">
                    {n.not.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                  {n.files.length > 0 && (
                    <>
                      <h3>고칠 수 있는 곳</h3>
                      <p className="adm-paths">
                        {n.files.map((f) => (
                          <code key={f}>{f}</code>
                        ))}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}
