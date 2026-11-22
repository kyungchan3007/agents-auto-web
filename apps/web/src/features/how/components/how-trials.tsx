"use client";

// 만드는 방식 — 시행착오 (작업 0306 · 궁금한 것 뒤) · 날짜순 · 종류로 골라 보기 · 펼치면 무슨 일 · 원인 · 바꾼 것 · 결과 · 근거 · 해결 중 표시
import { Panel } from "@hav/ui/admin/panel";
import { useTrials } from "../hooks/use-trials";
import { HOW_TRIALS, TRIAL_CATS } from "../lib/story";

export function HowTrials() {
  const { cat, setCat, open, toggle, toggleAll, allOpen, shown, list } = useTrials();
  const count = (c: string) => HOW_TRIALS.filter((x) => x.cat === c).length;
  const seg = (id: (typeof TRIAL_CATS)[number] | "all", label: string) => (
    <button key={id} type="button" aria-pressed={cat === id} onClick={() => setCat(id)}>
      {label}
    </button>
  );
  return (
    <Panel
      id="how-trials"
      testId="how-trials"
      title="시행착오"
      meta={
        <div className="adm-topr">
          <div className="adm-seg" role="group" aria-label="시행착오 종류">
            {seg("all", `전체 ${HOW_TRIALS.length}`)}
            {TRIAL_CATS.filter((c) => count(c) > 0).map((c) => seg(c, `${c} ${count(c)}`))}
          </div>
          <button type="button" className="adm-btn" onClick={toggleAll}>
            {allOpen ? "모두 접기" : "모두 펼치기"}
          </button>
        </div>
      }
    >
      <div className="adm-pb" style={{ paddingBottom: 4 }}>
        <p className="adm-note">무슨 일이 있었고, 왜 그랬고, 무엇을 바꿨는지 · 작업 문서와 PR 로 확인한 것만 적었습니다. 줄을 누르면 펼쳐집니다.</p>
      </div>
      <ol ref={list} className="adm-trials">
        {shown.map(({ t: x, i }) => (
          <li key={x.title} data-trial={i} data-cmd="시행착오" data-cmd-label={x.title}>
            <button type="button" className="adm-trial-h" aria-expanded={open.has(i)} aria-controls={`trial-${i}`} onClick={() => toggle(i)}>
              <span className="d">{x.day}</span>
              <span className="tt">
                <span className="ct">{x.cat}</span>
                {x.title}
                {!x.done && <span className="open">해결 중</span>}
              </span>
              <svg className="adm-chev" viewBox="0 0 24 24" aria-hidden style={{ transform: open.has(i) ? "rotate(180deg)" : undefined }}>
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            {open.has(i) && (
              <dl id={`trial-${i}`} className="adm-trial-b">
                <div>
                  <dt>무슨 일</dt>
                  <dd>{x.what}</dd>
                </div>
                <div>
                  <dt>원인</dt>
                  <dd>{x.why}</dd>
                </div>
                <div>
                  <dt>바꾼 것</dt>
                  <dd>{x.fix}</dd>
                </div>
                {x.result && (
                  <div>
                    <dt>결과</dt>
                    <dd>{x.result}</dd>
                  </div>
                )}
                <div>
                  <dt>근거</dt>
                  <dd className="src">
                    {x.refs.map((r, k) => (
                      <span key={r.href}>
                        {k > 0 && " · "}
                        <a href={r.href} target="_blank" rel="noreferrer">
                          {r.label}
                        </a>
                      </span>
                    ))}
                  </dd>
                </div>
              </dl>
            )}
          </li>
        ))}
      </ol>
    </Panel>
  );
}
