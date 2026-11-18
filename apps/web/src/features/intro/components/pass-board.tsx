// 왼쪽 아래 탑승권 판 — 4 · 5단계에서 보임: ICN → 도시 · 예산 · 환율 · 물가 · 출발 (그리기만 · 작업 0185)
import { motion } from "motion/react";
import type { IntroView } from "../hooks/use-intro";
import { IntroCells } from "./intro-cells";

export function PassBoard({ s }: { s: IntroView }) {
  const p = s.pass;
  return (
    <motion.aside
      aria-label="탑승권"
      initial={false}
      animate={{ y: s.passVisible ? 0 : "120%", opacity: s.passVisible ? 1 : 0 }}
      transition={{ duration: s.still ? 0 : 0.5, ease: [0.2, 0.8, 0.2, 1] }}
      className="fixed bottom-6 left-6 z-[3] w-[380px] rounded-2xl bg-pin-ink px-[18px] pt-4 pb-3.5 text-foam shadow-pass"
    >
      <header className="flex justify-between text-xs font-bold tracking-wider text-foam/70">
        <span>BOARDING PASS · 탑승권</span>
        <span>{p?.month}</span>
      </header>
      <IntroCells key={p?.route} text={p?.route ?? ""} cols={12} size="sm" className="my-2.5" />
      <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-3.5 gap-y-1 text-[13px]">
        <dt className="text-foam/70">예산</dt>
        <dd className="m-0 font-semibold">{p?.budget ?? "—"}</dd>
        <dt className="text-foam/70">환율</dt>
        <dd className="m-0 font-semibold">{p?.signal ?? "—"}</dd>
        <dt className="text-foam/70">물가</dt>
        <dd className="m-0 font-semibold">{p?.price ?? "—"}</dd>
        <dt className="text-foam/70">출발</dt>
        <dd className="m-0 font-semibold">{p?.when ?? "—"}</dd>
      </dl>
    </motion.aside>
  );
}
