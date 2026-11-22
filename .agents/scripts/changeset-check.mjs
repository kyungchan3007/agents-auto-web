// 변경 기록 검사 (경고만 · 작업 0313) — 운영 화면 코드가 바뀌었는데 .changeset 파일이 없으면 알림
//   운영 화면 코드: apps/web/src · apps/web/worker · packages/ui/src · packages/shared/src (테스트 파일 제외)
//   자료(geo · 알리기) · 문서 · 어드민 · API · 테스트만 바뀌면 조용함 · 화면이 안 바뀌는 리팩터링이면 경고를 무시해도 됨
//   변경 기록이 운영(@hav/web) 말고 다른 패키지를 적었으면 알림 (어드민 · API 는 버전 관리 대상이 아님)
//   늘 0 으로 끝남 — 막지 않음
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { ROOT, changedFiles } from "./lib.mjs";

const SCREEN = /^(apps\/web\/(src|worker)|packages\/(ui|shared)\/src)\/.+\.(tsx?|css)$/;
const TEST = /\.test\.tsx?$/;
const CHANGESET = /^\.changeset\/(?!README\.md$)[^/]+\.md$/;

/** @returns {{ warn: string[] }} */
export function checkChangesets(files, read = (f) => readFileSync(join(ROOT, f), "utf8")) {
  const warn = [];
  const screen = files.filter((f) => SCREEN.test(f) && !TEST.test(f));
  const sets = files.filter((f) => CHANGESET.test(f) && existsSync(join(ROOT, f)));
  if (screen.length > 0 && sets.length === 0) warn.push(`운영 화면 코드가 바뀌었는데 변경 기록(.changeset/*.md)이 없습니다 — 기능 · 디자인이 바뀌면 \`npx changeset\` 으로 한 줄 (바뀐 곳: ${screen.slice(0, 3).join(", ")}${screen.length > 3 ? ` 외 ${screen.length - 3}개` : ""})`);
  for (const f of sets) {
    const names = [...read(f).matchAll(/^"([^"]+)":\s*(major|minor|patch)\s*$/gm)].map((m) => m[1]);
    const other = names.filter((n) => n !== "@hav/web");
    if (other.length > 0) warn.push(`${f}: 운영(@hav/web)만 버전을 관리합니다 — ${other.join(", ")} 는 빼 주세요`);
  }
  return { warn };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const { warn } = checkChangesets(changedFiles());
  if (warn.length === 0) console.log("  변경 기록: 알릴 것 없음");
  for (const w of warn) console.log(`  ⚠️  ${w}`);
}
