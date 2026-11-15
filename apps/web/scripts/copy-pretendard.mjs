// 큰 제목 · 큰 숫자 글꼴 Pretendard 굵기 800 자체 호스팅 — pretendard 패키지(이미 의존성)의 동적 서브셋 woff2 92개를 사이트 정적 파일로 복사하고,
// 패키지 CSS 의 @font-face(unicode-range 그대로)를 경로만 바꿔 apps/web/src/app/pretendard.css 로 만든다 (작업 0176)
// 쓰는 법: node apps/web/scripts/copy-pretendard.mjs   (패키지 버전을 올렸을 때만 다시 돌림 · 만든 파일만 커밋)
// woff 대체 파일은 쓰지 않음 — woff2 를 못 읽는 브라우저는 대체 글꼴(IBM Plex Sans KR)로 보임
import { existsSync } from "node:fs";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const web = join(here, "..");
const PKG = [join(web, "../../node_modules/pretendard/dist/web/static"), join(web, "node_modules/pretendard/dist/web/static")].find((d) => existsSync(d));
if (!PKG) throw new Error("pretendard 패키지를 찾지 못함");
const OUT = join(web, "public/fonts/pretendard");
await mkdir(OUT, { recursive: true });

const css = await readFile(join(PKG, "Pretendard-ExtraBold.css"), "utf8");
const names = [...css.matchAll(/url\(\.\/woff2-dynamic-subset\/(Pretendard-ExtraBold\.subset\.\d+\.woff2)\)/g)].map((m) => m[1]);
if (names.length !== 92) throw new Error(`조각 수가 92 가 아님: ${names.length}`);
for (const n of names) await copyFile(join(PKG, "woff2-dynamic-subset", n), join(OUT, n));

// src 는 woff2 만 · 경로는 /fonts/pretendard/ (public)
const site = css.replace(/src:\s*url\(\.\/woff2-dynamic-subset\/([^)]+)\) format\('woff2'\),\s*url\([^)]*\) format\('woff'\);/g, "src: url(/fonts/pretendard/$1) format('woff2');");
const head = "/* Pretendard ExtraBold(800) 동적 서브셋 — pretendard 패키지에서 apps/web/scripts/copy-pretendard.mjs 가 만든 파일 (직접 고치지 않음 · 작업 0176) */\n";
await writeFile(join(web, "src/app/pretendard.css"), head + site);
console.log(`복사 ${names.length}개 · CSS ${join("src/app/pretendard.css")}`);
