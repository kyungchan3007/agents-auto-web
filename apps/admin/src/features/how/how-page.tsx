"use client";

// 만드는 방식 (작업 0303 · 시안 Version 6) — 리뷰어가 한 화면에서 이해하도록: 소개 · 숫자 → 작업 하나가 지나가는 길(자리 누르면 설명 · 따라가기)
//   → 도구 3(명령 보기) → Herdr 모습 → 규칙 12(묶음 · 펼치기 · 원본 링크) → 궁금한 것(골라 보기 · 화살표)
//   글은 lib/how.ts 하나에서 · 숫자는 빌드 때 저장소에서 센 값만(못 세면 칸을 뺌)
import { useFaq } from "./faq/use-faq";
import { useFlowPlay } from "./flow/use-flow-play";
import { useRules } from "./rules/use-rules";
import { HowFocus } from "./focus/how-focus";
import { HowSearch } from "./search/how-search";
import { HowTrials } from "./trials/how-trials";
import { HOW_FAQ, HOW_NODES, HOW_PANES, HOW_RULES, HOW_STEPS, HOW_TOOLS, type NodeId, REPO_BLOB, RULE_CAT, type RuleCat } from "./common/how";
import { AdminNav } from "@/shared/nav/admin-nav";
import { Flap } from "../../shared/ui/flap/flap";
import { Panel, Stamp } from "../../shared/ui/panel/panel";
import "./how.css";

export type HowCounts = { tasks: number | null; protectedRules: number | null; hooks: number | null };

const node = (id: NodeId) => HOW_NODES.find((n) => n.id === id) ?? HOW_NODES[0];
const Src = ({ path, label }: { path: string; label?: string }) => (
  <a className="adm-link src" href={`${REPO_BLOB}${path}`} target="_blank" rel="noreferrer">
    {label ?? path} ↗
  </a>
);

function NodeBtn({ id, picked, lit, onPick }: { id: NodeId; picked: NodeId | null; lit: NodeId | null; onPick: (id: NodeId) => void }) {
  const n = node(id);
  return (
    <button type="button" className={`adm-node${lit === id ? " lit" : ""}`} aria-pressed={picked === id} onClick={() => onPick(id)} data-node={id}>
      <b>{n.name}</b>
      <span>{n.kind}</span>
      {n.model && <span className="nm">{n.model}</span>}
    </button>
  );
}

function Flow() {
  const { picked, at, playing, lit, play, pick, step } = useFlowPlay();
  const n = picked ? node(picked) : null;
  const props = { picked, lit, onPick: pick };
  return (
    <Panel
      id="how-flow"
      testId="how-flow"
      title="작업 하나가 지나가는 길"
      meta={
        <button type="button" className="adm-btn" onClick={play} aria-pressed={playing}>
          {playing ? "멈추기" : at >= 0 ? "처음부터" : "따라가기"}
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
              className={i === at ? "on" : i < at ? "done" : undefined}
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

function Rules() {
  const { cat, setCat, open, toggle, toggleAll, allOpen, shown, list } = useRules();
  const count = (c: RuleCat) => HOW_RULES.filter((r) => r.cat === c).length;
  const seg = (id: RuleCat | "all", label: string) => (
    <button type="button" aria-pressed={cat === id} onClick={() => setCat(id)}>
      {label}
    </button>
  );
  return (
    <Panel
      id="how-rules"
      testId="how-rules"
      title="규칙"
      meta={
        <div className="adm-topr">
          <div className="adm-seg" role="group" aria-label="규칙 묶음">
            {seg("all", `전체 ${HOW_RULES.length}`)}
            {(Object.keys(RULE_CAT) as RuleCat[]).map((c) => seg(c, `${RULE_CAT[c]} ${count(c)}`))}
          </div>
          <button type="button" className="adm-btn" onClick={toggleAll}>
            {allOpen ? "모두 접기" : "모두 펼치기"}
          </button>
        </div>
      }
    >
      <div ref={list}>
        {shown.map(({ r, i }) => (
          <div key={r.title} className="adm-rule" data-rule={i} data-cmd="규칙" data-cmd-label={r.title}>
            <button
              type="button"
              className="adm-rule-h"
              aria-expanded={open.has(i)}
              aria-controls={`rule-${i}`}
              onClick={() => toggle(i)}
              style={{ all: "unset", boxSizing: "border-box", width: "100%", cursor: "pointer", display: "grid", gridTemplateColumns: "44px minmax(0,1fr) 16px", gap: 12, alignItems: "center", padding: "12px 20px" }}
            >
              <span className={`adm-rc ${r.cat}`}>{RULE_CAT[r.cat]}</span>
              <span className="rt" style={{ fontWeight: 500 }}>
                {r.title}
              </span>
              <svg className="adm-chev" viewBox="0 0 24 24" aria-hidden style={{ transform: open.has(i) ? "rotate(180deg)" : undefined }}>
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            {open.has(i) && (
              <div id={`rule-${i}`} className="adm-rb" style={{ animation: "adm-fade .2s ease both" }}>
                <p>{r.body}</p>
                {r.why && (
                  <p className="why">
                    <b>왜 생겼나</b>
                    {r.why}
                  </p>
                )}
                <p>
                  <Src path={r.source} label={`원본: ${r.source}`} />
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </Panel>
  );
}

function Faq() {
  const { cur, setCur, btns, onKey } = useFaq();
  const f = HOW_FAQ[cur] ?? HOW_FAQ[0];
  return (
    <Panel id="how-faq" testId="how-faq" title="궁금한 것" meta={<Stamp>골라서 보기</Stamp>}>
      <div className="adm-faq">
        <div
          className="adm-qs"
          role="group"
          aria-label="질문"
          onKeyDown={onKey}
        >
          {HOW_FAQ.map((x, i) => (
            <button
              key={x.q}
              ref={(el) => {
                btns.current[i] = el;
              }}
              type="button"
              className="adm-q"
              aria-pressed={i === cur}
              aria-controls="how-ans"
              onClick={() => setCur(i)}
              data-cmd="궁금한 것"
              data-cmd-label={x.q}
              data-pick="click"
            >
              {x.q}
            </button>
          ))}
        </div>
        <div className="adm-ans" id="how-ans" key={cur} aria-live="polite">
          <h3>{f?.q}</h3>
          <p>{f?.a}</p>
        </div>
      </div>
    </Panel>
  );
}

export function HowPage({ counts }: { counts: HowCounts }) {
  const stats = [
    { k: "작업", v: counts.tasks, unit: "개", s: "작업마다 요청 원문 · 계획 보관" },
    { k: "에이전트 자리", v: 5, unit: "자리", s: "lead · builder · test · geo · data" },
    { k: "보호 파일 규칙", v: counts.protectedRules, unit: "줄", s: "바뀌면 사람 승인 없이 CI 통과 안 됨" },
    { k: "훅", v: counts.hooks, unit: "개", s: "실행 전 · 응답 끝에 자동으로 검사" },
  ].filter((x): x is { k: string; v: number; unit: string; s: string } => x.v !== null);
  return (
    <AdminNav page="how">
      <div className="adm-top">
        <div>
          <p className="adm-eyebrow">만드는 방식</p>
          <h1>사람 한 명과 에이전트 다섯이 이 사이트를 만듭니다</h1>
          <p className="adm-lede">사람은 기획 · 설계와 디자인 방향 · 레퍼런스를 정하고, 시안을 고르고, 머지를 결정합니다. 계획 · 구현 · 테스트 · 측정 · 점검은 OpenRig 로 묶은 에이전트 팀이 맡고, 규칙과 자동 검사가 그 사이를 지킵니다.</p>
        </div>
        <Stamp>빌드 때 저장소에서 센 값</Stamp>
      </div>
      <section className="adm-panel" aria-label="숫자">
        <dl className="adm-stats" style={{ ["--n" as string]: stats.length }}>
          {stats.map((x, i) => (
            <div key={x.k} className="adm-stat">
              <dt>{x.k}</dt>
              <dd className="v">
                <Flap text={x.v.toLocaleString("ko-KR")} order={i} />
                <small>{x.unit}</small>
              </dd>
              <dd className="s">{x.s}</dd>
            </div>
          ))}
        </dl>
      </section>
      <HowFocus />
      <HowSearch />
      <Flow />
      <div className="adm-tools3">
        {HOW_TOOLS.map((t) => (
          <Panel key={t.name} id={`how-tool-${t.name.toLowerCase().replace(/\s+/g, "-")}`} title={t.name} meta={<Stamp>{t.kind}</Stamp>} className="adm-tool">
            <div className="adm-pb">
              <p>{t.text}</p>
              <details className="adm-cmd">
                <summary>명령 보기</summary>
                <pre>{t.commands.join("\n")}</pre>
              </details>
              <Src path={t.source} label="설정 보기" />
            </div>
          </Panel>
        ))}
      </div>
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
      <Rules />
      <Faq />
      <HowTrials />
    </AdminNav>
  );
}
