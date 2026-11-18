// 작업 0175 — 화면별 사진 (파일 · 부품 · 화면 · OG) (테스트 먼저 · 구현 전에는 FAIL 이 정상)
// 사용자가 만든 사진 5장 · 초안(.tmp/user-photos/draft.html)대로 다섯 화면 맨 위 구간 배경 (작업실 · 통화 · GEO 에는 없음 · 다크 모드 없음)
//
// builder 가 할 것 (prd P1~P9 · sdd)
//   파일: apps/web/public/images/photos/{window-fjord,window-sunrise,swiss-traveler,plane-below,plane-sunset}-{640,1024,1672}.webp — 15개 · 진짜 WebP · 폭 = 파일 이름의 폭 · 비율 1672:941 · 크기 상한 640w ≤ 90KB · 1024w ≤ 200KB · 1672w ≤ 360KB(원본 최대 339KB) · 작은 폭일수록 가벼움
//   부품: packages/ui/src/components/layout/photo-header.tsx 의 PhotoHeader — props { name: PhotoName; alt: string; veil: "light" | "ultramarine"; priority?: boolean; children }
//     <img> 에 srcSet · sizes · alt · 우선이면 fetchPriority="high"(그 밖은 loading="lazy") · 표시 data-testid="photo-header"(구간) · "photo-header-img"(사진)
//     막(veil): light = 하늘 종이색(--hav-surface) 그라데이션(데스크톱 왼쪽 → 오른쪽 · 모바일 아래 → 위) · ultramarine = 울트라마린 + 흰 글자 — 이 부품만 그라데이션 허용(0168 "장식 그라데이션 없음" 검사에서 제외)
//   화면(맨 위 구간만 감쌈 · priority — 각 화면은 사진이 하나라 맨 위가 첫 화면): 홈 travel-timing-section="window-fjord"(light) · /flights flights-page="window-sunrise"(light) · /prices price-page="swiss-traveler"(light) ·
//     /calc calc-page="plane-below"(ultramarine) · /about about-page="plane-sunset"(light) · 그 밖(작업실 · 통화 · GEO)에는 PhotoHeader 도 사진 경로도 없음
//   OG: apps/web/src/app/opengraph-image.tsx — 작업 0216 부터 사진 없이 새 디자인 1안 (size 1200×630 · alt · 정적은 그대로)
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const WEB_SRC = resolve(__dirname, ".."); // apps/web/src
const WEB = resolve(WEB_SRC, "..");
const UI_SRC = resolve(WEB, "../../packages/ui/src");
const ROOT = resolve(WEB, "../..");
const PHOTOS = join(WEB, "public/images/photos");
const codeOf = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const read = (p: string) => codeOf(readFileSync(p, "utf8"));
function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = join(dir, d.name);
    if (d.isDirectory()) return d.name === "node_modules" || d.name === ".next" ? [] : sources(p);
    return /\.tsx?$/.test(d.name) && !/\.test\.tsx?$/.test(d.name) ? [p] : [];
  });
}

const NAMES = ["window-fjord", "window-sunrise", "swiss-traveler", "plane-below", "plane-sunset"];
const WIDTHS = [640, 1024, 1672];
const CAP: Record<number, number> = { 640: 90_000, 1024: 200_000, 1672: 360_000 };

/** WebP 머리에서 가로 · 세로 (VP8X · VP8 · VP8L) */
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

describe("사진 파일 — 5장 × 3폭", () => {
  it("열다섯 개가 모두 있음", () => {
    for (const n of NAMES) for (const w of WIDTHS) expect(existsSync(join(PHOTOS, `${n}-${w}.webp`)), `${n}-${w}.webp`).toBe(true);
  });

  it("진짜 WebP · 폭은 파일 이름의 폭 · 비율은 원본(1672:941)", () => {
    for (const n of NAMES) {
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

  it("크기 상한 — 640w ≤ 90KB · 1024w ≤ 200KB · 1672w ≤ 360KB · 작은 폭일수록 가벼움 (첫 화면이 사진 무게로 느려지지 않게)", () => {
    for (const n of NAMES) {
      const sizes = WIDTHS.map((w) => {
        const f = join(PHOTOS, `${n}-${w}.webp`);
        return existsSync(f) ? statSync(f).size : Number.NaN;
      });
      WIDTHS.forEach((w, i) => expect(sizes[i], `${n}-${w}`).toBeLessThanOrEqual(CAP[w]));
      expect(sizes[0], `${n} 640 < 1024`).toBeLessThan(sizes[1]);
      expect(sizes[1], `${n} 1024 < 1672`).toBeLessThan(sizes[2]);
    }
  });

  it("폭별 파일만 있음 — 원본 이름(폭 없는 파일)을 그대로 두지 않음 (사이트에 안 쓰는 무거운 파일을 싣지 않게 · 나라 사진은 작업 0201 · country-코드 · 20장은 country-photos.test.ts 가 따로 검사)", () => {
    const extra = existsSync(PHOTOS) ? readdirSync(PHOTOS).filter((f) => !/^(window-fjord|window-sunrise|swiss-traveler|plane-below|plane-sunset|country-[a-z]{3})-(640|1024|1672)\.webp$/.test(f)) : ["(폴더 없음)"];
    expect(extra).toEqual([]);
  });
});

describe("PhotoHeader 부품", () => {
  const f = join(UI_SRC, "components/layout/photo-header.tsx");
  const src = () => read(f);

  it("부품 파일 · PhotoHeader export · props(name · alt · veil · priority)", () => {
    expect(existsSync(f)).toBe(true);
    expect(src()).toMatch(/export function PhotoHeader\(/);
    for (const p of ["name", "alt", "veil", "priority"]) expect(src(), p).toMatch(new RegExp(`\\b${p}\\??:`));
    expect(src()).toMatch(/"light"\s*\|\s*"ultramarine"/);
  });

  it("<img> — srcSet · sizes(photoSrcSet · PHOTO_SIZES) · alt · 우선이면 fetchPriority high · 그 밖은 loading lazy", () => {
    const s = src();
    expect(s).toMatch(/<img\b/);
    expect(s).toMatch(/srcSet=\{photoSrcSet\(/);
    expect(s).toMatch(/sizes=\{PHOTO_SIZES\}/);
    expect(s).toMatch(/alt=\{alt\}/);
    expect(s).toMatch(/fetchPriority=\{priority \? "high"/);
    expect(s).toMatch(/loading=\{priority \? "eager" : "lazy"\}|loading=\{priority \? undefined : "lazy"\}/);
  });

  it("CSS background-image 로 쓰지 않음 (alt 를 못 달고 우선순위 지정이 어려움)", () => {
    expect(src()).not.toMatch(/background-image|bg-\[url|backgroundImage/);
  });

  it("e2e 가 찾는 표시 — photo-header(구간) · photo-header-img(사진)", () => {
    expect(src()).toMatch(/data-testid="photo-header"/);
    expect(src()).toMatch(/data-testid="photo-header-img"/);
  });

  it("막 — light 는 하늘 종이(surface) 그라데이션 · ultramarine 은 울트라마린 + 흰 글자 · 방향은 데스크톱 왼쪽 → 오른쪽 · 모바일 아래 → 위", () => {
    const s = src();
    expect(s).toMatch(/gradient/);
    expect(s).toMatch(/surface/); // light 막의 가장 진한 쪽 = 하늘 종이색
    expect(s).toMatch(/cheap|2438a8/i); // 울트라마린 막
    expect(s).toMatch(/text-foam|text-white/); // 울트라마린 막 위 흰 글자
    expect(s).toMatch(/to-t|to-r|to right|to top|to-tr|to-br/); // 모바일 아래 → 위 · 데스크톱 왼쪽 → 오른쪽
  });

  it("사진 경로는 photo.ts 의 함수로 (경로를 부품에 박지 않음)", () => {
    expect(src()).not.toMatch(/\/images\/photos\//);
    expect(src()).toMatch(/from\s*"\.\.\/\.\.\/lib\/photo"/);
  });
});

describe("다섯 화면에만 — 맨 위 구간", () => {
  const SCREENS: [string, string, string, "light" | "ultramarine"][] = [
    ["apps/web/src/features/home/components/travel-timing-section.tsx", "홈 여행 타이밍", "window-fjord", "light"],
    ["apps/web/src/features/travel-price/components/flights-page.tsx", "/flights", "window-sunrise", "light"],
    ["apps/web/src/features/travel-price/components/prices-header.tsx", "/prices", "swiss-traveler", "light"], // 작업 0201: 머리가 prices-header.tsx 로 (고른 나라 사진)
    ["apps/web/src/features/import-calc/components/calc-page.tsx", "/calc", "plane-below", "ultramarine"],
    ["apps/web/src/features/about/components/about-page.tsx", "/about", "plane-sunset", "light"],
  ];

  for (const [file, label, photo, veil] of SCREENS) {
    it(`${label} — PhotoHeader name="${photo}" veil="${veil}" priority`, () => {
      const s = read(join(ROOT, file));
      const tag = /<(?:Picked)?PhotoHeader\b[^>]*>/.exec(s)?.[0] ?? ""; // 홈은 고른 나라 사진을 읽는 PickedPhotoHeader (작업 0201)
      expect(tag, "PhotoHeader 사용").not.toBe("");
      expect(tag).toContain(`name="${photo}"`);
      expect(tag).toContain(`veil="${veil}"`);
      expect(tag).toMatch(/\bpriority\b/); // 각 화면은 사진이 하나 — 맨 위가 첫 화면
      expect(tag).toMatch(/alt=/);
    });
  }

  it("작업실 · 통화 · GEO 에는 사진이 없음 (PhotoHeader · 사진 경로)", () => {
    const dirs = ["apps/web/src/features/log", "apps/web/src/features/currencies", "apps/web/src/features/geo", "apps/web/src/app/log", "apps/web/src/app/currencies", "apps/web/src/app/geo"];
    const bad = dirs.flatMap((d) => (existsSync(join(ROOT, d)) ? sources(join(ROOT, d)) : [])).filter((f) => /PhotoHeader|images\/photos|photoSrc/.test(read(f))).map((f) => f.replace(`${ROOT}/`, ""));
    expect(bad).toEqual([]);
  });

  it("PhotoHeader 를 쓰는 곳은 다섯 화면뿐 (디자인 진열장 /design 은 허용)", () => {
    const allowed = new Set(SCREENS.map((s) => s[0]));
    const users = sources(WEB_SRC)
      .map((f) => f.replace(`${ROOT}/`, ""))
      .filter((f) => /<PhotoHeader\b/.test(read(join(ROOT, f))))
      .filter((f) => !allowed.has(f) && f !== "apps/web/src/features/home/components/picked-photo-header.tsx" && !f.startsWith("apps/web/src/app/design/"));
    expect(users).toEqual([]);
  });
});

describe("공유 미리보기(OG) 이미지", () => {
  const og = read(join(WEB_SRC, "app/opengraph-image.tsx"));

  // 작업 0216 사용자 결정 "새 디자인으로" → 1안 (.tmp/redesign-1118/og/og-1.png): 사진 없이 파랑 한 면 · B 로고 · 큰 제목 · 안내판 한 줄
  it("사진 없이 파랑 한 면 (plane-sunset 안 씀) · B 로고 flap 흰 + fx 노랑 · 안내판 한 줄 ICN → 도쿄 뉴욕 파리", () => {
    expect(og).not.toContain("plane-sunset");
    expect(og).not.toMatch(/<img\b/);
    expect(og).toMatch(/background:\s*"#2438A8"/i);
    expect(og).toMatch(/>\s*flap\s*</);
    expect(og).toMatch(/#F7C548[^\n]*>\s*fx\s*</i);
    expect(og).toContain("싼 편");
    expect(og).toContain("ICN → 도쿄 뉴욕 파리");
    expect(og).toContain("Pretendard-Black");
  });

  it("크기 1200×630 · alt · 정적 그림은 그대로 (지금의 글자 · 로고를 위에)", () => {
    expect(og).toMatch(/size\s*=\s*\{\s*width:\s*1200\s*,\s*height:\s*630\s*\}/);
    expect(og).toMatch(/export const alt\b/);
    expect(og).toMatch(/dynamic\s*=\s*"force-static"/);
    expect(og).toContain("Flapfx"); // alt 문장
  });
});
