"use client";

// 공항 인트로 — 홈 위를 덮는 층 (작업 0185): 3D 공항 도시 · 위에 로고 · 단계 · 건너뛰기 · 직원 머리 위 말풍선 · 왼쪽 아래 탑승권 판 · 끝 장면(작업 0223: 파랑 면 → 로고 이동 → 사라짐)
// 그리기만 — 단계 · 입력 · 스크롤 · 창문 전환 순서는 hooks/use-intro.ts · 3D 는 use-intro-scene 이 열릴 때 불러옴 · 늘 건너뛸 수 있음
import { PLANE_CREDIT } from "@hav/shared/travel";
import { motion } from "motion/react";
import { type IntroData, useIntro } from "../hooks/use-intro";
import { BoardingPass } from "./boarding-pass";
import { BubbleBudget } from "./bubble-budget";
import { BubbleGate } from "./bubble-gate";
import { BubbleSearch } from "./bubble-search";
import { FlightHint } from "./flight-hint";
import { IntroLoading } from "./intro-loading";
import { PassBoard } from "./pass-board";
import { WindowTransition } from "./window-transition";

export function Intro({ data }: { data: IntroData }) {
  const { view: s } = useIntro(data);
  if (s.closed) return null;
  const bubbleOn = s.revealed && s.step <= 3;
  const dots = [1, 2, 3, 4, 5];
  return (
    <motion.div
      data-testid="intro"
      role="dialog"
      aria-modal="true"
      aria-label="Flapfx 공항 인트로"
      initial={false}
      animate={{ y: s.lifting ? "-104%" : 0, opacity: s.phase >= 3 ? 0 : 1 }}
      transition={{ y: { duration: s.still ? 0 : 0.8, ease: [0.7, 0, 0.25, 1] }, opacity: { duration: s.still ? 0 : 0.4, ease: "easeOut" } }}
      className={`fixed inset-0 z-[100] overflow-hidden text-fg ${s.phase === 0 ? "bg-surface" : ""}`}
    >
      {/* 3D 장면 — 장면을 못 불러와도 흐름은 계속 */}
      <div data-intro-stage aria-hidden className="absolute inset-0 z-[2]" style={{ ...(s.lite ? { background: "linear-gradient(var(--hav-sky-top), var(--hav-sky-mid) 45%, var(--hav-surface))" } : null), visibility: s.stageOff ? "hidden" : "visible" }} />
      {/* 로딩 화면 — 출발 안내판 · 열리면 1단계 (작업 0194) · 아래 위 띠(건너뛰기)가 이 층 위에 있어 로딩 중에도 건너뛸 수 있음 */}
      <IntroLoading s={s} />

      {/* 상단 띠 — 홈 메뉴처럼 로고 · 단계 · 건너뛰기 */}
      <div className={`pointer-events-none fixed inset-x-0 top-0 z-[5] flex items-center justify-between gap-3 px-6 pt-4 transition-opacity duration-300 ${s.phase === 0 ? "opacity-100" : "opacity-0"}`}>
        <div data-intro-logo className={`text-[22px] font-bold tracking-tight text-cheap transition-opacity duration-500 ${s.revealed ? "opacity-100" : "opacity-0"}`}>flapfx</div>
        <div className={`pointer-events-auto flex items-center gap-2.5 rounded-pill border border-line bg-card/90 px-3.5 py-1.5 text-[13px] font-bold transition-opacity duration-500 ${s.revealed ? "opacity-100" : "opacity-0"}`}>
          <span data-testid="intro-step">{s.stepLabel}</span>
          <span aria-hidden className="flex gap-1">
            {dots.map((n) => (
              <i key={n} className={`h-1 w-3.5 rounded-sm ${n <= s.step ? "bg-cheap" : "bg-line"}`} />
            ))}
          </span>
        </div>
        <button type="button" data-testid="intro-skip" onClick={s.skip} tabIndex={s.phase === 0 ? 0 : -1} className="pointer-events-auto rounded-pill border border-line bg-card px-5 py-2 text-[0.9375rem] font-semibold text-fg hover:bg-surface-2">
          건너뛰기
        </button>
      </div>

      {/* 말풍선 — 안내 직원 머리 위 (위치는 장면이 매 프레임 갱신) */}
      <section
        data-intro-bubble
        aria-live="polite"
        className={`absolute z-[4] w-[440px] rounded-[1.5rem] border border-line bg-card px-6 pt-[22px] pb-5 shadow-panel transition-[opacity,transform] duration-300 after:absolute after:-bottom-2.5 after:left-[var(--tail,50%)] after:size-[18px] after:-translate-x-1/2 after:rotate-45 after:border-r after:border-b after:border-line after:bg-card after:content-[''] ${bubbleOn ? "opacity-100" : "pointer-events-none translate-y-2.5 opacity-0"}`}
        style={s.lite ? { left: "50%", top: "16%", transform: "translateX(-50%)" } : { left: 16, top: 84 }}
      >
        {s.step === 1 && <BubbleSearch s={s} />}
        {s.step === 2 && <BubbleBudget s={s} />}
        {s.step === 3 && <BubbleGate s={s} />}
      </section>
      <BoardingPass s={s} />
      <PassBoard s={s} />
      <FlightHint s={s} />
      <WindowTransition s={s} />

      <p className={`fixed right-4 bottom-2 z-[3] m-0 text-[12px] text-fg-2 transition-opacity duration-300 [text-shadow:0_0_6px_var(--hav-card)] ${s.phase === 0 ? "opacity-100" : "opacity-0"}`}>
        환율 한국수출입은행 · 물가 세계은행 · 항공료 통계청 · {PLANE_CREDIT.text.replace("3D 비행기: ", "비행기 ")} · 차 · 사람 · 도시 Kenney (CC0)
      </p>
    </motion.div>
  );
}
