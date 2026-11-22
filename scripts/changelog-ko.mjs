// 변경 기록 제목을 한국어로 (작업 0313) — `changeset version` 이 쓰는 "### Minor Changes" 같은 제목을 바꿈
//   npm run release:version 이 changeset version 뒤에 부름 · 운영 사이트 변경 기록(apps/web/CHANGELOG.md)만
import { readFileSync, writeFileSync } from "node:fs";

const FILE = new URL("../apps/web/CHANGELOG.md", import.meta.url);
const TITLES = { "### Major Changes": "### 크게 바뀜", "### Minor Changes": "### 기능", "### Patch Changes": "### 수정" };

let text = readFileSync(FILE, "utf8");
for (const [en, ko] of Object.entries(TITLES)) text = text.split(en).join(ko);
writeFileSync(FILE, text);
console.log("변경 기록 제목을 한국어로 바꿈 — apps/web/CHANGELOG.md");
