// 공항 인트로 3D 모델 자산 — Kenney(CC0) 키트에서 시안이 쓰는 모델만 apps/web/public/models/intro/ 로 복사하고 차 색상표를 흰색 계열로 바꿈 (작업 0185)
// 쓰는 법: node apps/web/scripts/make-intro-assets.mjs <Kenney 폴더>   (폴더 안에 kenney_car-kit_3.1 · kenney_mini-characters_2.0 · city-kit-commercial 이 있어야 함)
// 만든 파일만 커밋 — 모델을 바꿀 때만 다시 돌림 · sharp 는 이미 설치되어 있음 (새 의존성 없음)
//   car/    흰색 계열 색상표(차는 하늘 종이 도시에 어울리게 밝기만 남김) · taxi/ 원래 노랑 색상표(노랑 포인트 하나) · people/ 사람 + 짐 + 걷기 · 서 있기 동작 · city/ 도시 건물
// 각 폴더에 Kenney License.txt(CC0)도 함께 — 모델이 Textures/colormap.png 를 상대 경로로 읽음
import { copyFile, mkdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = dirname(fileURLToPath(import.meta.url));
if (!process.argv[2]) throw new Error("Kenney 폴더를 인자로 주세요");
const K = resolve(process.argv[2]);
const OUT = join(here, "../public/models/intro");
const GLB = "Models/GLB format";

const CAR = join(K, "kenney_car-kit_3.1");
const PEOPLE = join(K, "kenney_mini-characters_2.0");
const CITY = join(K, "city-kit-commercial");

const KITS = [
  { dir: "car", from: CAR, models: ["sedan", "suv", "van", "delivery", "truck"], mono: true },
  { dir: "taxi", from: CAR, models: ["taxi"], mono: false },
  { dir: "people", from: PEOPLE, models: ["character-male-a", "character-female-b", "character-male-f", "character-female-e", "character-male-b", "character-female-c", "character-female-d", "character-worker", "item-luggage"], mono: false },
  {
    dir: "city",
    from: CITY,
    models: [
      ...["a", "b", "c", "d", "e", "f", "g", "h"].map((x) => `building-${x}`),
      ...["a", "b", "c", "d", "e"].map((x) => `building-skyscraper-${x}`),
      ...["a", "b", "c", "d", "e", "f", "g", "h"].map((x) => `low-detail-building-${x}`),
      "low-detail-building-wide-a",
      "low-detail-building-wide-b",
    ],
    mono: false,
  },
];

/** 색상표를 흰색 계열로 — 밝기만 남기고 하늘 종이색 쪽으로 (색은 조금만 남김 · 시안 build3.py 의 mono 와 같은 식) */
async function monoColormap(src, dest, keep = 0.18) {
  const { data, info } = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(data.length);
  const tint = [0.985, 1.0, 0.995];
  for (let i = 0; i < data.length; i += 3) {
    const l = 0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2];
    const v = 150 + l * 0.42;
    for (let c = 0; c < 3; c++) out[i + c] = Math.min(255, Math.trunc((v * (1 - keep) + data[i + c] * keep) * tint[c]));
  }
  await sharp(out, { raw: { width: info.width, height: info.height, channels: 3 } }).png().toFile(dest);
}

for (const kit of KITS) {
  const dir = join(OUT, kit.dir);
  await mkdir(join(dir, "Textures"), { recursive: true });
  for (const m of kit.models) await copyFile(join(kit.from, GLB, `${m}.glb`), join(dir, `${m}.glb`));
  const map = join(kit.from, GLB, "Textures/colormap.png");
  if (kit.mono) await monoColormap(map, join(dir, "Textures/colormap.png"));
  else await copyFile(map, join(dir, "Textures/colormap.png"));
  await copyFile(join(kit.from, "License.txt"), join(dir, "License.txt"));
  console.log(`${kit.dir}: 모델 ${kit.models.length}개`);
}
