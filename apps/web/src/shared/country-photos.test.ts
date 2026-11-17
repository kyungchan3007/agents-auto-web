// 작업 0201 — 나라 사진 20장 파일 규칙 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   파일: apps/web/public/images/photos/country-<코드>-{640,1024,1672}.webp — 20장 × 3폭 = 60개 · 진짜 WebP · 폭 = 파일 이름의 폭 · 비율 1672:941 · 크기 상한은 화면 사진과 같음
//   원본 PNG(55MB)는 사이트 폴더에 두지 않음 · 사진은 사용자가 만든 것이라 출처 표시 없음
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { COUNTRY_PHOTO_NAMES } from "../../../../packages/ui/src/lib/photo";

const WEB = resolve(__dirname, "../..");
const PHOTOS = join(WEB, "public/images/photos");
const WIDTHS = [640, 1024, 1672];
const CAP: Record<number, number> = { 640: 90_000, 1024: 200_000, 1672: 360_000 };

function webpSize(b: Buffer): { w: number; h: number } | null {
  if (b.length < 30 || b.toString("ascii", 0, 4) !== "RIFF" || b.toString("ascii", 8, 12) !== "WEBP") return null;
  const kind = b.toString("ascii", 12, 16);
  if (kind === "VP8X") return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
  if (kind === "VP8 ") return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
  if (kind === "VP8L") {
    const bits = b.readUInt32LE(21);
    return { w: (bits & 0x3fff) + 1, h: ((bits >> 14) & 0x3fff) + 1 };
  }
  return null;
}

describe("나라 사진 파일 — 20장 × 3폭", () => {
  it("예순 개가 모두 있고 그 밖의 country-* 파일은 없음", () => {
    for (const n of COUNTRY_PHOTO_NAMES) for (const w of WIDTHS) expect(existsSync(join(PHOTOS, `${n}-${w}.webp`)), `${n}-${w}.webp`).toBe(true);
    const extra = readdirSync(PHOTOS).filter((f) => f.startsWith("country-") && !COUNTRY_PHOTO_NAMES.some((n) => WIDTHS.some((w) => f === `${n}-${w}.webp`)));
    expect(extra).toEqual([]);
  });

  it("진짜 WebP · 폭은 파일 이름의 폭 · 비율은 1672:941", () => {
    for (const n of COUNTRY_PHOTO_NAMES) {
      for (const w of WIDTHS) {
        const f = join(PHOTOS, `${n}-${w}.webp`);
        if (!existsSync(f)) continue;
        const size = webpSize(readFileSync(f));
        expect(size, `${n}-${w} WebP 머리`).not.toBeNull();
        expect(size?.w, `${n}-${w} 폭`).toBe(w);
        expect((size?.w ?? 1) / (size?.h ?? 1), `${n}-${w} 비율`).toBeCloseTo(1672 / 941, 1);
      }
    }
  });

  it("크기 상한 — 640w ≤ 90KB · 1024w ≤ 200KB · 1672w ≤ 360KB", () => {
    for (const n of COUNTRY_PHOTO_NAMES) for (const w of WIDTHS) {
      const f = join(PHOTOS, `${n}-${w}.webp`);
      if (existsSync(f)) expect(statSync(f).size, `${n}-${w}`).toBeLessThanOrEqual(CAP[w]);
    }
  });

  it("원본 PNG · 한글 이름 파일이 사이트 폴더에 없음", () => {
    const all = readdirSync(PHOTOS);
    expect(all.filter((f) => /\.png$/i.test(f) || /[가-힣]/.test(f))).toEqual([]);
  });
});
