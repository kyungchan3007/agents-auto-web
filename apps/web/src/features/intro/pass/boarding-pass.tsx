// 3단계 탑승권 — 말풍선 아래 출구에서 한 줄씩 나오고(출력) 왼쪽 아래 탑승권 판으로 접혀 들어감 (그리기만 · 작업 0185)
// 내용은 ticketOf(경로 · 여섯 줄 · 바코드 글) — 값이 없으면 "환율 없음" · "판정 없음" · "데이터 없음"
import { motion } from "motion/react";
import type { IntroView } from "../state/use-intro";

/** 바코드 글 → 막대 (같은 글이면 같은 막대) */
const bars = (code: string) =>
  Array.from(code).flatMap((ch, i) => {
    const v = Number.isNaN(Number(ch)) ? ch.charCodeAt(0) % 4 : Number(ch) % 4;
    return [{ key: `b${i}`, grow: 1 + v, ink: true }, { key: `g${i}`, grow: 1 + ((v + i) % 3), ink: false }];
  });

export function BoardingPass({ s }: { s: IntroView }) {
  const t = s.ticket;
  if (!t || s.boardingPrinting === "off") return null;
  const fold = s.boardingPrinting === "fold";
  return (
    <div data-intro-ticket className="pointer-events-none fixed z-[3] h-[340px] overflow-hidden" aria-hidden>
      <motion.div
        initial={{ y: "-102%" }}
        animate={fold ? { x: "-40%", y: "60%", scale: 0.3, opacity: 0 } : { y: 0 }}
        transition={{ duration: s.still ? 0 : fold ? 0.8 : 2.2, ease: fold ? [0.6, 0, 0.2, 1] : "easeOut" }}
        className="rounded-b-[0.875rem] bg-card px-5 pt-[18px] pb-3.5 shadow-ticket"
      >
        <div className="flex justify-between text-[12px] font-bold tracking-wider text-fg-2">
          <span>FLAPFX · BOARDING PASS</span>
          <span>TFX 1116</span>
        </div>
        <div className="my-2 flex items-baseline gap-3">
          <b className="text-[36px] font-bold tracking-tight">{t.route[0]}</b>
          <i className="text-[22px] font-bold text-cheap not-italic">→</i>
          <b className="text-[36px] font-bold tracking-tight">{t.route[1]}</b>
        </div>
        <dl className="m-0 grid grid-cols-2 gap-x-3.5 gap-y-2">
          {t.rows.map((r) => (
            <div key={r.label}>
              <dt className="text-[12px] font-semibold text-fg-2">{r.label}</dt>
              <dd className="m-0 mt-px text-[13px] font-bold tabular-nums">{r.value}</dd>
            </div>
          ))}
        </dl>
        <div className="-mx-5 my-3 border-t-2 border-dashed border-line" />
        <div className="flex h-7 gap-0.5">
          {bars(t.code).map((b) => (
            <span key={b.key} className={b.ink ? "bg-fg" : ""} style={{ flex: b.grow }} />
          ))}
        </div>
        <div className="mt-1.5 flex justify-between text-[12px] text-fg-2">
          <span>{t.footer[0]}</span>
          <span>{t.footer[1]}</span>
        </div>
      </motion.div>
    </div>
  );
}
