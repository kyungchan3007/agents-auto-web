"use client";

// 인트로 로딩 화면 (작업 0194 · 시안 A "출발 안내판이 열림") — 하늘 종이 바탕 · 로고 · 안내판 두 줄 · 노란 점 · 진행률 % 없음
// 3D 가 준비되면 첫 줄이 "어디로 떠나시나요?" 로 넘어가고, 안내판이 아래로 내려가며 흐려지고, 바탕이 위 · 아래 두 장으로 열려 터미널 입구(1단계)가 나타남
// 열림이 끝나면(done) 그리지 않음 · 움직임 줄이기면 넘김 · 열림 없이 페이드만 · 건너뛰기는 위 띠가 이 층 위에 있어 로딩 중에도 눌림 (그리기만 — 시계는 hooks/use-intro-loading.ts)
import { FlapRows } from "@hav/ui/data/flap-rows";
import type { IntroView } from "../hooks/use-intro";
import { LOADING, OPEN_MS, STILL_FADE_MS } from "../lib/loading";

const EASE = "cubic-bezier(.7,0,.25,1)";

export function IntroLoading({ s }: { s: IntroView }) {
  const { stage, rows } = s.loading;
  if (stage === "done") return null;
  const open = stage === "open";
  const slide = (to: string) => ({ transform: open && !s.still ? to : "translateY(0)", transition: s.still ? "none" : `transform ${OPEN_MS}ms ${EASE}` });
  return (
    <div
      data-testid="intro-loading"
      data-stage={stage}
      data-still={s.still ? "true" : "false"}
      className={`absolute inset-0 z-[5] overflow-hidden ${open ? "pointer-events-none" : ""}`}
      style={{ opacity: s.still && open ? 0 : 1, transition: s.still ? `opacity ${STILL_FADE_MS}ms ease` : "none" }}
    >
      <span className="sr-only" role="status">
        Flapfx 인트로를 준비하는 중입니다
      </span>
      {/* 바탕 두 장 — 열리면 위는 위로 · 아래는 아래로 */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-1/2 border-b border-line/60 bg-surface" style={slide("translateY(-101%)")} />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-surface" style={slide("translateY(101%)")} />
      <div
        className="relative flex h-full flex-col items-center justify-center gap-4 pb-10"
        style={{ opacity: open ? 0 : 1, transform: open && !s.still ? "translateY(120px)" : "translateY(0)", transition: s.still ? "none" : `transform ${OPEN_MS}ms ${EASE}, opacity 500ms ease` }}
      >
        <p className="m-0 text-[72px] leading-none font-extrabold tracking-display text-cheap">{LOADING.brand}</p>
        <p className="m-0 mb-4 text-[18px] font-bold text-fg-2">{LOADING.sub}</p>
        <FlapRows rows={rows} cols={LOADING.cols} label="출발 안내판 — 탑승 준비 중" still={s.still} testId="intro-loading-board" rowTestId="intro-loading-row" className="shadow-[0_10px_24px_rgba(22,36,110,0.25)]" />
        <div aria-hidden className="mt-3 flex gap-2.5">
          {[0, 1, 2].map((i) => (
            <i key={i} className="size-2.5 rounded-full bg-sun motion-safe:animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
