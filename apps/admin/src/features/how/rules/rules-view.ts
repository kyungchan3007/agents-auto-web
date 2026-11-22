// 규칙 묶음 단추 (작업 0303 · 0312 에 how-page.tsx 에서 옮김) · 순수 함수
import { countIn } from "@/shared/fold/fold";
import { HOW_RULES, RULE_CAT, type RuleCat } from "../common/how";

export const ruleSegments = (): { id: RuleCat | "all"; label: string }[] => [
  { id: "all", label: `전체 ${HOW_RULES.length}` },
  ...(Object.keys(RULE_CAT) as RuleCat[]).map((c) => ({ id: c, label: `${RULE_CAT[c]} ${countIn(HOW_RULES, (r) => r.cat, c)}` })),
];
