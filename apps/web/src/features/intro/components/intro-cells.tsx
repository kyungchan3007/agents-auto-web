// 인트로의 작은 출발 안내판 줄 — 한 글자 한 칸 · 글자가 바뀌면 그 칸이 한 번 넘어감 (그리기만 · 작업 0185)
// 홈 안내판(FlapBoard)과 같은 색(판 #16246E · 칸 #24337F · 이음선 · 노랑 글자) — 인트로는 글자가 입력마다 바뀌어 칸마다 key 로 다시 그림
import { motion } from "motion/react";

type Props = { text: string; cols: number; testId?: string; tone?: "yellow" | "white"; size?: "md" | "sm"; className?: string };

export function IntroCells({ text, cols, testId, tone = "yellow", size = "md", className = "" }: Props) {
  // 한 글자 한 칸 — 모자라면 빈 칸으로 채우고 넘치면 자름 (글은 보통 boardRows 가 이미 칸 수 안으로 맞춤)
  const chars = Array.from(text).slice(0, cols);
  const cells = [...chars, ...Array.from({ length: cols - chars.length }, () => " ")];
  const cell = size === "sm" ? "h-[34px] w-[26px] text-[18px]" : "aspect-[0.8] text-[18px]";
  return (
    <div data-testid={testId} data-text={text} aria-hidden className={`grid gap-[3px] ${className}`} style={{ gridTemplateColumns: size === "sm" ? `repeat(${cols}, 26px)` : `repeat(${cols}, minmax(0, 1fr))` }}>
      {cells.map((ch, i) => (
        <span key={i} className={`relative grid place-items-center overflow-hidden rounded-[4px] bg-flap-cell font-bold ${tone === "white" ? "text-foam" : "text-sun"} ${cell}`}>
          <motion.span key={ch} initial={{ rotateX: 80, opacity: 0.4 }} animate={{ rotateX: 0, opacity: 1 }} transition={{ duration: 0.16, delay: i * 0.02 }}>
            {ch === " " ? "" : ch}
          </motion.span>
          <span className="absolute inset-x-0 top-1/2 h-px bg-on-band/60" />
        </span>
      ))}
    </div>
  );
}
