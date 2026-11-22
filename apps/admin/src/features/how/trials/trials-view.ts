// 시행착오 묶음 단추 (작업 0306 · 0312 에 how-trials.tsx 에서 옮김) · 순수 함수 — 항목이 없는 종류는 뺌
import { countIn } from "@/shared/fold/fold";
import { HOW_TRIALS, TRIAL_CATS, type TrialCat } from "./trials-data";

export const trialSegments = (): { id: TrialCat | "all"; label: string }[] => [
  { id: "all", label: `전체 ${HOW_TRIALS.length}` },
  ...TRIAL_CATS.map((c) => ({ c, n: countIn(HOW_TRIALS, (t) => t.cat, c) }))
    .filter(({ n }) => n > 0)
    .map(({ c, n }) => ({ id: c, label: `${c} ${n}` })),
];
