// 화면별 사진 변환 — 원본(1672×941 WebP)에서 폭별 WebP(640 · 1024 · 1672 · 품질 80)와 공유 미리보기용 JPEG(1200×630)를 한 번 만듦 (작업 0175)
// 쓰는 법: node apps/web/scripts/make-photos.mjs <원본 폴더>   (원본 폴더 = window-fjord.webp … plane-sunset.webp 가 있는 곳)
// sharp 는 이미 설치되어 있음 (새 의존성 없음) · 만든 파일만 커밋 — 이 스크립트는 사진을 바꿀 때만 다시 돌림
import { mkdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(process.argv[2] ?? "");
if (!process.argv[2]) throw new Error("원본 폴더를 인자로 주세요");
const OUT = join(here, "../public/images/photos");
const OG = join(here, "../src/app/_assets/plane-sunset-og.jpg");
const NAMES = ["window-fjord", "window-sunrise", "swiss-traveler", "plane-below", "plane-sunset"];
const WIDTHS = [640, 1024, 1672];

await mkdir(OUT, { recursive: true });
await mkdir(dirname(OG), { recursive: true });
for (const n of NAMES) {
  for (const w of WIDTHS) {
    const info = await sharp(join(src, `${n}.webp`)).resize({ width: w }).webp({ quality: 80 }).toFile(join(OUT, `${n}-${w}.webp`));
    console.log(`${n}-${w}.webp ${info.width}x${info.height} ${info.size}`);
  }
}
// 공유 미리보기(OG)는 next/og 가 WebP 를 못 그려서 미리 만든 JPEG 를 읽음
const og = await sharp(join(src, "plane-sunset.webp")).resize(1200, 630, { fit: "cover", position: "center" }).jpeg({ quality: 82, mozjpeg: true }).toFile(OG);
console.log(`plane-sunset-og.jpg ${og.width}x${og.height} ${og.size}`);
