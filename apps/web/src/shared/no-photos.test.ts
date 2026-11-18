// 작업 0222 — 사진 없음 (사용자 결정: 새 디자인은 사진을 쓰지 않으므로 사이트 사진 · 사진 부품 · 사진 스크립트를 모두 지움) (테스트 먼저 · 구현 전에는 FAIL 이 정상)
// 지울 것: apps/web/public/images/photos 전부 · app/_assets/plane-sunset-og.jpg · PhotoHeader(photo-header.tsx) · lib/photo.ts · scripts/make-photos.mjs · 인트로의 안 쓰는 창문 카메라(zoomIn)
// 바꿀 것: /about 머리 = 사진 없는 머리(메뉴 아래 흰 면 · 라벨 · 큰 제목) · 공유 미리보기(OG)는 0216 에서 이미 사진 없는 1안
// 남기는 것(사진이 아님): 국기(SVG) · 인트로 3D 모델 · 텍스처
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const WEB_SRC = resolve(__dirname, ".."); // apps/web/src
const WEB = resolve(WEB_SRC, "..");
const ROOT = resolve(WEB, "../..");
const UI_SRC = resolve(ROOT, "packages/ui/src");

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next" || name === "out") continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}
const SELF = join(WEB_SRC, "shared/no-photos.test.ts");
const sourceFiles = (dirs: string[]) => dirs.flatMap((d) => walk(d)).filter((f) => /\.(tsx?|mjs|css)$/.test(f) && f !== SELF);

describe("사진 파일 · 부품 · 스크립트가 없음", () => {
  it("사진 폴더와 공유 미리보기 사진 파일이 없음", () => {
    expect(existsSync(join(WEB, "public/images/photos"))).toBe(false);
    expect(existsSync(join(WEB_SRC, "app/_assets/plane-sunset-og.jpg"))).toBe(false);
  });

  it("사진 부품(photo-header.tsx) · 사진 경로 함수(photo.ts) · 변환 스크립트(make-photos.mjs)와 그 테스트가 없음", () => {
    for (const f of [
      join(UI_SRC, "components/layout/photo-header.tsx"),
      join(UI_SRC, "lib/photo.ts"),
      join(UI_SRC, "lib/photo.test.ts"),
      join(WEB, "scripts/make-photos.mjs"),
      join(WEB_SRC, "shared/photos.test.ts"),
      join(WEB_SRC, "shared/country-photos.test.ts"),
    ]) expect(existsSync(f), relative(ROOT, f)).toBe(false);
  });

  it("코드 어디에도 /images/photos · PhotoHeader · photoSrc · countryPhoto · photo-header 표시가 없음 (이 검사 파일 제외)", () => {
    const bad = sourceFiles([WEB_SRC, UI_SRC, join(WEB, "scripts")]).filter((f) => /images\/photos|\bPhotoHeader\b|\bphotoSrc|\bcountryPhoto\b|COUNTRY_PHOTO|photo-header|plane-sunset/.test(readFileSync(f, "utf8")));
    expect(bad.map((f) => relative(ROOT, f))).toEqual([]);
  });

  it("package.json 에 사진 만드는 스크립트 줄이 없음", () => {
    for (const p of [join(WEB, "package.json"), join(ROOT, "package.json")]) expect(readFileSync(p, "utf8"), relative(ROOT, p)).not.toMatch(/make-photos/);
  });

  it("글자 강조(emph.tsx)가 사진 막(group/photo · veil)을 알지 못함", () => {
    expect(readFileSync(join(UI_SRC, "components/text/emph.tsx"), "utf8")).not.toMatch(/veil|\/photo/);
  });
});

describe("인트로 — 안 쓰는 창문 카메라 코드 정리 (작업 0223 이 남긴 것)", () => {
  it("3D 장면 상태에 zoomIn 이 없고 장면 · 훅도 쓰지 않음", () => {
    for (const f of ["features/intro/lib/scene-types.ts", "features/intro/lib/scene.ts", "features/intro/hooks/use-intro.ts"]) {
      expect(readFileSync(join(WEB_SRC, f), "utf8"), f).not.toMatch(/zoomIn|zoomT0|zoomFrom/);
    }
  });
});

describe("/about — 사진 없는 머리", () => {
  const about = readFileSync(join(WEB_SRC, "features/about/components/about-page.tsx"), "utf8");

  it("사진 부품 없이 라벨(소개) · 큰 제목(h1)이 그대로 있음", () => {
    expect(about).not.toMatch(/PhotoHeader|photo-header/);
    expect(about).toMatch(/<Eyebrow>소개<\/Eyebrow>/);
    expect(about).toMatch(/<Title as="h1"/);
    expect(about).toContain("어떤 자료를,");
    expect(about).toContain("어떤 기준으로 보여 주나요");
  });

  it("머리 데이터 표시 — data-testid=about-head (e2e 가 찾음)", () => {
    expect(about).toMatch(/data-testid="about-head"/);
  });

  it("기준 카드 6개 · 출처 줄은 그대로", () => {
    expect(about).toMatch(/data-testid="criteria-card"/);
    expect(about).toContain("모든 숫자의 출처는 각 화면 아래에 적습니다");
  });
});
