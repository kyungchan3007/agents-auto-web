// 공유 미리보기 이미지 글꼴 — 빌드 때 Pretendard 파일을 읽음 (작업 0216 · 0312 에 app/opengraph-image.tsx 에서 옮김)
//   빌드는 apps/web 에서 돌고 패키지는 저장소 맨 위 node_modules 로 올라가 있을 수 있음 — 번들러가 require.resolve 를 모듈 번호로 바꿔서 경로로 찾음
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const FONT_DIRS = ["node_modules/pretendard/dist/public/static", "../../node_modules/pretendard/dist/public/static"].map((d) => join(process.cwd(), d));

export function ogFont(weight: "Black" | "ExtraBold" | "Medium") {
  const dir = FONT_DIRS.find((d) => existsSync(d));
  if (!dir) throw new Error("Pretendard 글꼴 파일을 찾지 못함 (pretendard 패키지)");
  return readFile(join(dir, `Pretendard-${weight}.otf`));
}
