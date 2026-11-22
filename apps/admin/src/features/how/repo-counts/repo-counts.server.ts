// 만드는 방식 숫자를 빌드 때 저장소에서 읽음 (작업 0303 · 0312) — 읽기는 shared/repo · 세기는 repo-counts.ts
import { listRepoDir, readRepoText, repoRoot, safe } from "@/shared/repo/repo-root.server";
import { type HowCounts, NO_COUNTS, countHookScripts, countRules, countSpecs } from "./repo-counts";

export function readHowCounts(): HowCounts {
  const root = repoRoot();
  if (!root) return NO_COUNTS;
  const specs = listRepoDir(root, ".agents/specs");
  const rules = readRepoText(root, ".agents/protected.txt");
  const settings = readRepoText(root, ".claude/settings.json");
  return {
    tasks: specs === null ? null : countSpecs(specs),
    protectedRules: rules === null ? null : countRules(rules),
    hooks: settings === null ? null : safe(() => countHookScripts(settings)),
  };
}
