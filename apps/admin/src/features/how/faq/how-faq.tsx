"use client";

// 궁금한 것 (작업 0303 · 0312 에 how-page.tsx 에서 나눔) — 골라 보기 · 화살표 · 상태는 use-faq
import { Panel, Stamp } from "@/shared/ui/panel/panel";
import { HOW_FAQ } from "../common/how";
import { useFaq } from "./use-faq";

export function HowFaq() {
  const { cur, setCur, btns, onKey, f } = useFaq();
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
