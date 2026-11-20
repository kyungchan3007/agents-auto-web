// e2e 가 필요한가 — 바뀐 파일 목록으로 판정하는 순수 함수 (작업 0243)
//   화면 · 빌드에 영향이 없는 것 뿐이면 false: .agents/** · docs/** · *.md(어느 폴더든) · apps/api/data/** · rigs/** (rigs/ 는 작업 0244)
//   그 밖이 하나라도 있으면 true (.github/** · package.json · apps/** 소스 · packages/** 포함) · 빈 목록은 false
//   폴더 이름은 "폴더 경계(/)"까지 맞아야 함 — .agentsx/ · docsx/ · apps/api/data-loader.ts 는 그 밖(true)
const NO_E2E_PREFIXES = [".agents/", "docs/", "apps/api/data/", "rigs/"];

function isQuietFile(file) {
  return file.endsWith(".md") || NO_E2E_PREFIXES.some((p) => file.startsWith(p));
}

/** @param {string[]} files 저장소 루트 기준 바뀐 파일 경로 */
export function e2eNeeded(files) {
  return files.some((f) => !isQuietFile(f));
}
