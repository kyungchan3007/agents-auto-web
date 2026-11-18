// 5단계 창문 전환 — 비행기로 다가감(3D) → 기내 창문 · 덧문이 올라감 → 창밖이 화면 가득 → 창밖 사진이 홈 첫 화면 사진의 실제 자리로 줄어들어 들어가며 홈이 나타남 (그리기만 · 작업 0185)
// 단계(phase)는 use-intro 가 시간 순서로 올림 · 사진은 홈 첫 화면과 같은 window-fjord · 줄어들어 갈 자리(target)는 홈 사진 요소의 실제 getBoundingClientRect 값
import { motion } from "motion/react";
import type { IntroView } from "../hooks/use-intro";

const EASE = [0.65, 0, 0.3, 1] as const;

export function WindowTransition({ s }: { s: IntroView }) {
  const { phase, target, still, photo: PHOTO } = s;
  if (phase === 0) return null;
  const d = (sec: number) => (still ? 0 : sec);
  const full = { left: 0, top: 0, width: typeof window === "undefined" ? 1440 : window.innerWidth, height: typeof window === "undefined" ? 900 : window.innerHeight };
  const to = phase >= 6 && target ? target : full;
  return (
    <>
      {/* 기내 — 창문 · 덧문 */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: phase >= 7 ? 0 : phase >= 6 ? 0 : 1 }}
        transition={{ duration: d(phase >= 6 ? 1.1 : 0.65), ease: "easeOut" }}
        className="pointer-events-none fixed inset-0 z-[4] grid place-items-center overflow-hidden"
        style={{ background: phase >= 6 ? "var(--hav-surface)" : "radial-gradient(120% 95% at 50% 45%, #F6F8FA 0%, #E6EBF0 58%, #D6DDE4 100%)" }}
      >
        <motion.div
          initial={{ scale: 1.35, filter: "blur(4px)" }}
          animate={{ scale: phase >= 4 ? 6 : 1, filter: "blur(0px)", visibility: phase >= 6 ? "hidden" : "visible" }}
          transition={{ duration: d(phase >= 4 ? 1.1 : 0.8), ease: phase >= 4 ? [0.6, 0, 0.9, 0.4] : EASE }}
          className="relative aspect-[0.7] rounded-[48%/34%] shadow-window"
          style={{ width: "min(27vw, 360px)", background: "linear-gradient(160deg, var(--hav-card), #E4E9EE)" }}
        >
          <div className="absolute inset-[9%] overflow-hidden rounded-[46%/33%] shadow-glass" style={{ background: `center / cover url(${PHOTO})` }}>
            <motion.div
              initial={false}
              animate={{ y: phase >= 3 ? "-100%" : 0 }}
              transition={{ duration: d(1.7), ease: [0.45, 0, 0.2, 1] }}
              className="absolute inset-0 z-[1]"
              style={{ background: "repeating-linear-gradient(180deg, var(--hav-window-shade) 0 10px, #E5E9ED 10px 11px)" }}
            />
          </div>
        </motion.div>
      </motion.div>
      {/* 창밖 사진 — 화면 가득 → 홈 사진 자리로 */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0, ...full }}
        animate={{ opacity: phase >= 7 ? 0 : phase >= 5 ? 1 : 0, ...to }}
        transition={{ opacity: { duration: d(phase >= 7 ? 0.6 : 0.45) }, left: { duration: d(1.1), ease: EASE }, top: { duration: d(1.1), ease: EASE }, width: { duration: d(1.1), ease: EASE }, height: { duration: d(1.1), ease: EASE } }}
        className="pointer-events-none fixed z-[5] bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${PHOTO})` }}
      >
        <motion.i
          initial={false}
          animate={{ opacity: phase >= 6 ? 1 : 0 }}
          transition={{ duration: d(1.1) }}
          className="absolute inset-0"
          style={{ background: "linear-gradient(90deg, var(--hav-surface) 18%, color-mix(in srgb, var(--hav-surface) 75%, transparent) 34%, color-mix(in srgb, var(--hav-surface) 0%, transparent) 55%), linear-gradient(0deg, var(--hav-surface) 0%, color-mix(in srgb, var(--hav-surface) 0%, transparent) 22%)" }}
        />
      </motion.div>
    </>
  );
}
