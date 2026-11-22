"use client";

// 규칙 (작업 0303 · 0312 에 how-page.tsx 에서 나눔) — 묶음 · 펼치기 · 원본 링크 · 상태는 use-rules · 묶음 단추는 rules-view
import { foldAllText } from "@/shared/fold/fold";
import { Panel } from "@/shared/ui/panel/panel";
import { RULE_CAT } from "../common/how";
import { SrcLink } from "../common/src-link";
import { ruleSegments } from "./rules-view";
import { useRules } from "./use-rules";

const SEGMENTS = ruleSegments();

export function HowRules() {
  const { cat, setCat, open, toggle, toggleAll, allOpen, shown, list } = useRules();
  return (
    <Panel
      id="how-rules"
      testId="how-rules"
      title="규칙"
      meta={
        <div className="adm-topr">
          <div className="adm-seg" role="group" aria-label="규칙 묶음">
            {SEGMENTS.map(({ id, label }) => (
              <button key={id} type="button" aria-pressed={cat === id} onClick={() => setCat(id)}>
                {label}
              </button>
            ))}
          </div>
          <button type="button" className="adm-btn" onClick={toggleAll}>
            {foldAllText(allOpen)}
          </button>
        </div>
      }
    >
      <div ref={list}>
        {shown.map(({ x: r, i }) => (
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
                  <SrcLink path={r.source} label={`원본: ${r.source}`} />
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </Panel>
  );
}
