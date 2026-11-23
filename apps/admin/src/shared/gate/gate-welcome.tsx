"use client";

// 처음 들어왔을 때 안내 창 (작업 0326 · 시안 ②) — 사실 그대로: 쿠키 · 접속 시각을 남김 · "추적하지 않는다" 같은 말은 쓰지 않음
import { SITE_URL } from "@/shared/site";
import { hello } from "./session-view";
import { useGateWelcome } from "./use-gate-welcome";
import "./gate.css";

export function GateWelcome() {
  const { name, dismiss } = useGateWelcome();
  if (name === null) return null;
  const greeting = hello(name);
  return (
    <div className="adm-welcome-scrim">
      <div className="adm-welcome" role="dialog" aria-modal="true" aria-labelledby="gate-welcome-t" data-testid="gate-welcome">
        <p className="eyebrow">
          <i aria-hidden />
          <span id="gate-welcome-t">전용 링크로 들어오셨습니다</span>
        </p>
        {greeting && <h2>{greeting}</h2>}
        <p className="lede">
          토큰 이름 <span className="tok">{name}</span>
        </p>
        <ul>
          <li>
            <b>열람 권한이 부여된 분께만 제공되는 전용 링크입니다.</b> 유효 기간은 발급일로부터 7일입니다.
          </li>
          <li>
            7일 동안 다시 넣지 않도록 <b>브라우저에 로그인 쿠키</b>를 저장합니다.
          </li>
          <li>
            이 토큰으로 <b>처음 · 마지막에 접속한 시각만</b> 기록합니다. 이름 · 이메일 등 개인 정보는 받지 않습니다.
          </li>
          <li>검색 엔진에는 막아 두었습니다.</li>
        </ul>
        <div className="row">
          <button type="button" className="go" autoFocus onClick={dismiss}>
            둘러보기
          </button>
          <a className="out" href={SITE_URL}>
            나가기
          </a>
        </div>
      </div>
    </div>
  );
}
