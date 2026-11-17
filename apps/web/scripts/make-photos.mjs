// 화면별 사진 변환 — 원본(1672×941 WebP)에서 폭별 WebP(640 · 1024 · 1672 · 품질 80)와 공유 미리보기용 JPEG(1200×630)를 한 번 만듦 (작업 0175)
// 쓰는 법: node apps/web/scripts/make-photos.mjs <원본 폴더>   (원본 폴더 = window-fjord.webp … plane-sunset.webp 가 있는 곳)
// sharp 는 이미 설치되어 있음 (새 의존성 없음) · 만든 파일만 커밋 — 이 스크립트는 사진을 바꿀 때만 다시 돌림
import { mkdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

// 나라 사진 20장 (작업 0201): node apps/web/scripts/make-photos.mjs --countries <한글 이름 PNG 폴더>
//   일본.png … 유럽.png(=유로 나라 기본) → country-<코드>-{640,1024,1672}.webp · 1672×941 이 아니면 cover 로 맞춤 · 크기 상한(90 · 200 · 360KB)을 넘으면 품질을 낮춤
const COUNTRY_FILES = { 일본: "jpn", 대만: "twn", 홍콩: "hkg", 중국: "chn", 태국: "tha", 베트남: "vnm", 캄보디아: "khm", 필리핀: "phl", 싱가포르: "sgp", 인도: "ind", 영국: "gbr", 스위스: "che", 스웨덴: "swe", 튀르키에: "tur", 미국: "usa", 캐나다: "can", 멕시코: "mex", 호주: "aus", 뉴질랜드: "nzl", 유럽: "eur" };
const CAP = { 640: 90_000, 1024: 200_000, 1672: 360_000 };

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, "../public/images/photos");
if (process.argv[2] === "--countries") {
  const dir = resolve(process.argv[3] ?? "");
  if (!process.argv[3]) throw new Error("나라 사진(PNG) 폴더를 인자로 주세요");
  await mkdir(OUT, { recursive: true });
  for (const [ko, code] of Object.entries(COUNTRY_FILES)) {
    for (const w of [640, 1024, 1672]) {
      for (let q = 80; q >= 40; q -= 5) {
        const info = await sharp(join(dir, `${ko}.png`)).resize({ width: w, height: Math.round((w * 941) / 1672), fit: "cover" }).webp({ quality: q }).toFile(join(OUT, `country-${code}-${w}.webp`));
        if (info.size <= CAP[w] * 0.95 || q === 40) {
          console.log(`country-${code}-${w}.webp ${info.width}x${info.height} ${info.size} q${q}`);
          break;
        }
      }
    }
  }
  process.exit(0);
}
const src = resolve(process.argv[2] ?? "");
if (!process.argv[2]) throw new Error("원본 폴더를 인자로 주세요");
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
