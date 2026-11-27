// 작업 0177 — 홈 첫 화면 출발 안내판 배치 (소스 검사) (테스트 먼저 · 구현 전에는 FAIL 이 정상)
// 사용자 "출발 안내판 C안 사진에 걸치기로 가자" — 울트라마린 전체 띠(today-band) 삭제 → 판에만 울트라마린 · 사진에 반쯤 걸침 · 지구는 하늘 종이 위(배경 없이)
//
// 작업 0384: 예전 hero(TodayBoard · today/ 폴더 · 탑승권 카드 ticket*)를 지움 — 판 · 카드만 검사하던 것은 빼고 지구 제거 · 밝은 화면 · 예전 카드 없음만 남김
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const WEB_SRC = resolve(__dirname, ".."); // apps/web/src
const UI_SRC = resolve(WEB_SRC, "../../../packages/ui/src");
const codeOf = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const read = (p: string) => codeOf(readFileSync(p, "utf8"));
function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = join(dir, d.name);
    if (d.isDirectory()) return sources(p);
    return /\.tsx?$/.test(d.name) && !/\.test\.tsx?$/.test(d.name) ? [p] : [];
  });
}
const HOME_COMPONENTS = sources(join(WEB_SRC, "features/home"));

describe("예전 hero · 울트라마린 전체 띠 없음 (B1 · 작업 0384)", () => {
  it("today-band.tsx · today/ 폴더가 없고 홈 코드에 TodayBoard · TodayBand · Ticket 이름이 없음", () => {
    expect(existsSync(join(WEB_SRC, "features/home/components/today-band.tsx"))).toBe(false);
    expect(existsSync(join(WEB_SRC, "features/home/today"))).toBe(false);
    for (const f of HOME_COMPONENTS) expect(read(f), f).not.toMatch(/\bTodayBoard\b|\bTodayBand\b|today-band|today-board|from\s*"[^"]*\/today\//);
  });

  it("홈 코드에 예전 탑승권 카드 표시(data-testid ticket* · picked-pass · picked-country-link · id=\"board\")가 없음", () => {
    const ui = HOME_COMPONENTS.map(read).join("\n");
    expect(ui).not.toMatch(/data-testid="(ticket[\w-]*|picked-pass|picked-country-link|trip-switcher)"/);
    expect(ui).not.toMatch(/id="board"/);
  });

  it("홈 화면 코드에 data-surface=\"dark\" · \"elevated\"(전체 띠)가 없음 — 새 hero 첫 면(hero-section) · 그 위의 캐러셀(hero-carousel · 작업 0385)만 예외", () => {
    for (const f of HOME_COMPONENTS.filter((x) => !x.endsWith("hero-section.tsx") && !x.endsWith("carousel/hero-carousel.tsx"))) expect(read(f), f).not.toMatch(/data-surface="(dark|elevated)"/);
  });
});

describe("사진 머리 없음 (작업 0217 · 0222)", () => {
  it("홈에 사진 머리 · 사진 부품이 없음 (작업 0217 · 0222 — 부품 파일을 지움)", () => {
    for (const f of HOME_COMPONENTS) expect(read(f), f).not.toMatch(/\bPhotoHeader\b|\bPickedPhotoHeader\b/);
  });
});

describe("3D 지구 제거 · 비행기는 그대로 (작업 0177 수정)", () => {
  // 비행기 · 비행기 길 · 장면 코드는 그대로 — /flights 와 홈 그래프가 씀 (지구만 지움)
  const HASH: Record<string, string> = {
    "three/objects/plane.tsx": "3078d67e7503b99c822ef40b46d9c663938be6529cdcf13719574b7ad464ea8a",
    "three/objects/plane-route.tsx": "5ba9463304d795d2", // 앞 16자만 비교
    "three/scene/stage.tsx": "1cee7f2529c4a122",
  };
  for (const [file, expected] of Object.entries(HASH)) {
    it(`${file} 가 그대로`, () => {
      const sha = createHash("sha256").update(readFileSync(join(UI_SRC, file))).digest("hex");
      expect(sha.startsWith(expected)).toBe(true);
    });
  }

  it("홈에 3D 지구 · 둘레 원 · 지구 그림 파일이 없음 — GlobeLazy · SEOUL · EARTH_TEXTURE 를 쓰지 않음", () => {
    for (const f of HOME_COMPONENTS) expect(read(f), f).not.toMatch(/\bGlobeLazy\b|\bSEOUL\b|EARTH_TEXTURE/); // 작업 0217: 상태 점 · 막대 끝은 rounded-full 을 씀 (지구 둘레 원이 아님)
    expect(read(join(WEB_SRC, "features/home/common/places.ts"))).not.toMatch(/SEOUL|EARTH_TEXTURE|earth-2048/);
  });

  it("쓰지 않는 지구 부품 · 계산 · 그림 파일을 남기지 않음 (globe.tsx · lib/geo.ts · textures/earth-2048.jpg · lazy 의 GlobeLazy)", () => {
    expect(existsSync(join(UI_SRC, "three/objects/globe.tsx"))).toBe(false);
    expect(existsSync(join(UI_SRC, "three/lib/geo.ts"))).toBe(false);
    expect(existsSync(join(WEB_SRC, "../public/textures/earth-2048.jpg"))).toBe(false);
    expect(read(join(UI_SRC, "three/scene/lazy.tsx"))).not.toMatch(/Globe/);
  });
});

describe("글꼴 · 색 규칙 유지 (B9)", () => {
  it("밝은 화면만 — prefers-color-scheme · dark: 변형이 판 · 홈 구간에 없음", () => {
    for (const f of [...HOME_COMPONENTS, join(UI_SRC, "components/data/flap-board.tsx")]) {
      expect(read(f), f).not.toMatch(/prefers-color-scheme|\bdark:/);
    }
  });
});
