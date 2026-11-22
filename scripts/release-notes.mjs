// 운영 릴리스 글 — apps/web/CHANGELOG.md 에서 "## <버전>" 칸만 꺼냄 (작업 0313 · release-web.yml 이 부름)
//   node scripts/release-notes.mjs 1.1.0 → 표준 출력 · 그 버전 칸이 없으면 실패(버전과 변경 기록이 어긋난 것)
import { readFileSync } from "node:fs";

export function notesFor(changelog, version) {
  const lines = changelog.split("\n");
  const start = lines.findIndex((l) => l.trim() === `## ${version}`);
  if (start < 0) return null;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => /^## /.test(l));
  return (end < 0 ? rest : rest.slice(0, end)).join("\n").trim();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const version = process.argv[2];
  const notes = notesFor(readFileSync(new URL("../apps/web/CHANGELOG.md", import.meta.url), "utf8"), version ?? "");
  if (!notes) {
    console.error(`apps/web/CHANGELOG.md 에 "## ${version}" 칸이 없습니다`);
    process.exit(1);
  }
  console.log(notes);
}
