// 디자인 PR 판정 — design 라벨 그리고 바뀐 파일이 모두 화면 쪽(허용 목록)일 때만 디자인 PR (작업 0246)
//   디자인 PR 이면 checks.sh 가 @design 테스트 실패를 막지 않고 목록으로만 남김 (기능 테스트는 늘 막음 · verdict.md "디자인 PR 판정")
//   허용 목록 방식: 목록에 없으면 평소 PR (lib · hooks · API · 공용 도메인 · 설정 · 워크플로 · 하네스 · 보호 파일 AGENTS.md · CLAUDE.md 는 밖)
//   가려내지 못하면(빈 파일 목록 · 라벨 읽기 실패) 평소 PR = 막는 쪽
//   CLI: node .agents/scripts/design-pr.mjs → { design, reason, warn?, offending? } JSON 한 줄 (대상은 GITHUB_BASE_REF · 없으면 develop · 라벨은 GITHUB_EVENT_PATH)
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { changedFiles } from "./lib.mjs";

const LABEL = "design";

/** 화면 쪽 = 허용 목록 (정규식 · 저장소 루트 기준 · 앞뒤를 모두 고정해 비슷한 폴더 이름에 속지 않음) */
const SCREEN = [
  /^apps\/web\/src\/features\/[^/]+\/components\/.+/, // 화면 부품
  /^apps\/web\/src\/app\/(?:(?!api\/).)+\.(?:tsx|css|svg)$/, // app 폴더의 화면 코드(page · layout · 부품) · 스타일 · 아이콘 (api 폴더 · route · robots · sitemap 같은 .ts 는 밖)
  /^packages\/ui\/src\/components\/.+/, // 공용 화면 부품
  /^(?:apps\/web\/src|packages\/ui\/src)\/.+\.css$/, // 스타일 (tokens.css 포함)
  /^(?:apps\/web|packages\/ui)\/src\/.+\.test\.tsx?$/, // 소스 옆 테스트
  /^apps\/web\/e2e(?:-responsive)?\/.+/, // e2e
  /^\.agents\/specs\/.+/, // 작업 기록
  /^docs\/.+/, // 문서
  /^(?!AGENTS\.md$|CLAUDE\.md$).+\.md$/, // 마크다운 (보호 파일 AGENTS.md · CLAUDE.md 는 밖)
];

const isScreenSide = (file) => SCREEN.some((re) => re.test(file));

/**
 * @param {string[]} files 저장소 루트 기준 바뀐 파일
 * @param {{ labels: string[], target?: string }} opts target 이 main 이면 하루 마무리 PR — 같은 규칙(그 구간 바뀐 파일이 모두 허용 목록 안인지)
 * @returns {{ design: boolean, reason: string, warn?: string, offending?: string[] }}
 */
export function designPr(files, { labels, target = "develop" }) {
  const day = target === "main" ? "하루 마무리 PR · " : "";
  if (!labels.includes(LABEL)) return { design: false, reason: `${day}design 라벨 없음` };
  if (files.length === 0) return { design: false, reason: `${day}바뀐 파일을 가려내지 못함` };
  const offending = files.filter((f) => !isScreenSide(f));
  if (offending.length > 0) {
    return {
      design: false,
      reason: `${day}화면 쪽 밖 파일 ${offending.length}개 섞임`,
      warn: `design 라벨인데 이 파일이 섞였다: ${offending.join(", ")}`,
      offending,
    };
  }
  return { design: true, reason: `${day}design 라벨 + 바뀐 파일 ${files.length}개 모두 화면 쪽` };
}

/** GITHUB_EVENT_PATH 의 pull_request.labels[].name — 경로 없음 · 파일 없음 · 깨진 JSON · 라벨 칸 없음은 [] (평소 PR 로 떨어짐) */
export function readLabels(eventPath) {
  if (!eventPath) return [];
  try {
    const labels = JSON.parse(readFileSync(eventPath, "utf8"))?.pull_request?.labels;
    return Array.isArray(labels) ? labels.map((l) => l?.name).filter((n) => typeof n === "string") : [];
  } catch {
    return [];
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const target = process.env.GITHUB_BASE_REF || "develop";
  console.log(JSON.stringify(designPr(changedFiles(), { labels: readLabels(process.env.GITHUB_EVENT_PATH), target })));
}
