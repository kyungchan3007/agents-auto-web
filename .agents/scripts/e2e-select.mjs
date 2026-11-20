// 어떤 e2e 를 돌릴까 — 바뀐 파일 · PR 대상 브랜치 · 연결표(.agents/e2e-map.json)로 고름 (작업 0244)
//   조용한 파일뿐(e2eNeeded 가 false)  → none     (e2e 없음)
//   대상 main                          → full     (전부 · 넓은 화면 + 휴대폰)
//   대상 develop(그 밖)                → selected (연결표로 고른 spec · 넓은 화면만)
//     연결표 밖 화면 파일이 있으면      → smoke    (smoke ∪ 고른 spec + 경고 줄 — 전체는 하루 마무리 PR 에서)
//   파일마다 "가장 긴 접두어" 하나가 이김 · apps/web/e2e/<이름>.spec.ts 가 바뀌면 그 spec 자신
//   CLI: node .agents/scripts/e2e-select.mjs → 결과를 JSON 한 줄로 (대상은 GITHUB_BASE_REF · 없으면 develop)
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { e2eNeeded } from "./e2e-needed.mjs";
import { ROOT, changedFiles } from "./lib.mjs";

const WIDE = "넓은 화면";
const PHONE = "휴대폰";
const OWN_SPEC = /^apps\/web\/e2e\/[^/]+\.spec\.ts$/;

/** 이 파일이 가리키는 spec 목록 — 연결표 밖이면 null */
function specsFor(file, map) {
  if (OWN_SPEC.test(file)) return [file.slice(file.lastIndexOf("/") + 1)];
  let best = null;
  for (const prefix of Object.keys(map)) {
    if (prefix === "smoke" || !file.startsWith(prefix)) continue;
    if (best === null || prefix.length > best.length) best = prefix;
  }
  return best === null ? null : map[best];
}

/**
 * @param {string[]} files 저장소 루트 기준 바뀐 파일
 * @param {{ target: string, map: Record<string, string[]> }} opts
 * @returns {{ mode: "none"|"full"|"selected"|"smoke", specs: string[], projects: string[], warn?: string }}
 */
export function selectE2e(files, { target, map }) {
  if (!e2eNeeded(files)) return { mode: "none", specs: [], projects: [] };
  if (target === "main") return { mode: "full", specs: [], projects: [WIDE, PHONE] };
  const picked = new Set();
  const outside = [];
  for (const file of files) {
    if (!e2eNeeded([file])) continue; // 조용한 파일은 건너뜀
    const specs = specsFor(file, map);
    if (specs === null) outside.push(file);
    else specs.forEach((s) => picked.add(s));
  }
  if (outside.length === 0) return { mode: "selected", specs: [...picked].sort(), projects: [WIDE] };
  (map.smoke ?? []).forEach((s) => picked.add(s));
  return {
    mode: "smoke",
    specs: [...picked].sort(),
    projects: [WIDE],
    warn: `연결표(.agents/e2e-map.json) 밖 파일이 있어 주요 spec(smoke)을 더해 돌림 — 전체는 하루 마무리 PR 에서: ${outside.join(", ")}`,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const map = JSON.parse(readFileSync(join(ROOT, ".agents", "e2e-map.json"), "utf8"));
  const target = process.env.GITHUB_BASE_REF || "develop";
  console.log(JSON.stringify(selectE2e(changedFiles(), { target, map })));
}
