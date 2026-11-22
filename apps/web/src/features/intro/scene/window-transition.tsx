// 끝 장면 — 파랑 면 → 로고가 홈 메뉴 로고 자리로 (그리기만 · 작업 0223 · 예전 작업 0185 창문 전환을 바꿈)
// 단계(phase)는 use-intro 가 시간 순서로 올림: 1 파랑 면이 덮음 · 2 로고가 옮겨 감 · 3 층이 사라짐(intro.tsx) · 파랑은 메뉴 띠와 같은 토큰(bg-pin-cheap)이라 새 홈 첫 면과 이어 붙어 경계가 안 보임
// 로고는 홈 메뉴 로고의 실제 자리 · 글 모양에 도착해 있고, 출발 자리에서 옮겨 오는 것처럼 translate · scale 로 시작 (끝 값은 변형 없음 = 정확히 그 자리) · 흰 flap + 노랑 fx
import { motion } from "motion/react";
import type { IntroView } from "../state/use-intro";
import { logoFrom } from "./logo-move";

const EASE = [0.65, 0, 0.3, 1] as const;

export function WindowTransition({ s }: { s: IntroView }) {
  const { phase, logo, still } = s;
  if (phase === 0) return null;
  const d = (sec: number) => (still ? 0 : sec);
  const from = logoFrom(logo);
  return (
    <>
      {/* 파랑 면 — 메뉴 띠 · 새 홈 첫 면과 같은 값 */}
      <motion.div
        data-testid="intro-end-tint"
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: d(1.1), ease: "easeInOut" }}
        className="pointer-events-none fixed inset-0 z-[6] bg-pin-cheap"
      />
      {/* 로고 — 파랑 면 위 (인트로 로고 자리 → 홈 메뉴 로고 자리) */}
      {logo && from && (
        <motion.div
          data-testid="intro-end-logo"
          aria-hidden
          initial={from}
          animate={phase >= 2 ? { x: 0, y: 0, scale: 1 } : from}
          transition={{ duration: d(1), ease: EASE }}
          className="pointer-events-none fixed z-[7] font-display whitespace-nowrap text-foam"
          style={{ left: logo.to.left, top: logo.to.top, width: logo.to.width, height: logo.to.height, fontSize: logo.fontSize, letterSpacing: logo.letterSpacing, fontWeight: logo.fontWeight, lineHeight: `${logo.to.height}px`, transformOrigin: "0 0" }}
        >
          <span>
            flap<b className="font-[inherit] text-sun">fx</b>
          </span>
        </motion.div>
      )}
    </>
  );
}
