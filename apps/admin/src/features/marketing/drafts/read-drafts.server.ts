// 알리기 초안을 빌드 때 저장소 docs/marketing 에서 읽음 (작업 0307 · 0310 · 0312 · 0327)
//   파일 읽기만 여기 — 나누기 · 주소 고르기 · 순서는 drafts.ts 의 collectDrafts · 못 읽으면 빈 목록(빈 상태)
import { listRepoDir, readRepoText, repoHas, repoRoot } from "@/shared/repo/repo-root.server";
import { MARKETING_IMAGE_BASE, REPO_URL } from "@/shared/site";
import { type Draft, collectDrafts, rawBase } from "./drafts";

const DIR = "docs/marketing";

export function readDrafts(): Draft[] {
  const root = repoRoot();
  if (!root) return [];
  const at = (rel: string) => (rel ? `${DIR}/${rel}` : DIR);
  return collectDrafts(
    { list: (rel) => listRepoDir(root, at(rel)), read: (rel) => readRepoText(root, at(rel)), has: (rel) => repoHas(root, at(rel)) },
    { r2Base: MARKETING_IMAGE_BASE, rawBase: rawBase(REPO_URL) },
  );
}
