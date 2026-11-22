// 알리기 초안을 빌드 때 저장소 docs/marketing 에서 읽음 (작업 0307 · 0310 · 0312 에 app/marketing/page.tsx 에서 옮김)
//   읽기는 shared/repo · 나누기 · 주소 고르기는 drafts.ts · 못 읽으면 빈 목록(빈 상태)
import { listRepoDir, readRepoText, repoHas, repoRoot } from "@/shared/repo/repo-root.server";
import { MARKETING_IMAGE_BASE, REPO_URL } from "@/shared/site";
import { type Draft, draftDays, imageSources, parseDraft, rawBase } from "./drafts";

const DIR = "docs/marketing";

export function readDrafts(): Draft[] {
  const root = repoRoot();
  if (!root) return [];
  const days = listRepoDir(root, DIR);
  if (!days) return [];
  return draftDays(days).flatMap((day) => {
    const md = readRepoText(root, `${DIR}/${day}/문구.md`);
    if (md === null) return [];
    const { image, imageFallback } = imageSources(day, MARKETING_IMAGE_BASE, rawBase(REPO_URL), repoHas(root, `${DIR}/${day}/image.png`));
    return [parseDraft(day, md, image, imageFallback)];
  });
}
