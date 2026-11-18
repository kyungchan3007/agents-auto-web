// 작업 0175 — 화면별 사진: 폭별 파일 이름 · srcset 순수 함수 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
// 사진 5장은 사용자가 직접 만든 것(출처 표시 불필요) · 원본(1672×941 WebP)은 .tmp/user-photos/*.webp · 정적 내보내기라 next/image 변환이 없어 미리 만든 폭별 파일 + srcset
//
// builder 가 만들 것 — packages/ui/src/lib/photo.ts
//   export const PHOTO_NAMES = ["window-fjord", "window-sunrise", "swiss-traveler", "plane-below", "plane-sunset"] as const
//   export type PhotoName = (typeof PHOTO_NAMES)[number]
//   export const PHOTO_WIDTHS = [640, 1024, 1672] as const                  // 폭별 파일 (가장 큰 것이 원본 폭)
//   export function photoSrc(name: PhotoName, width: number): string        // `/images/photos/${name}-${width}.webp`
//   export function photoSrcSet(name: PhotoName): string                    // `/images/photos/NAME-640.webp 640w, /images/photos/NAME-1024.webp 1024w, /images/photos/NAME-1672.webp 1672w`
//   export const PHOTO_SIZES = "100vw"                                      // 맨 위 구간은 화면 폭 가득
//   파일: apps/web/public/images/photos/NAME-{640,1024,1672}.webp (5장 × 3폭 = 15개 · .tmp/user-photos 원본에서 sharp 로 한 번 만들어 커밋 · 새 의존성 없음)
import { describe, expect, it } from "vitest";
import { PHOTO_NAMES, PHOTO_SIZES, PHOTO_WIDTHS, photoSrc, photoSrcSet } from "./photo";

describe("사진 이름 · 폭", () => {
  it("다섯 장 — 초안의 이름 그대로", () => {
    expect([...PHOTO_NAMES]).toEqual(["window-fjord", "window-sunrise", "swiss-traveler", "plane-below", "plane-sunset"]);
  });

  it("폭은 작은 것부터 640 · 1024 · 1672", () => {
    expect([...PHOTO_WIDTHS]).toEqual([640, 1024, 1672]);
  });
});

describe("photoSrc · photoSrcSet", () => {
  it("파일 경로 — /images/photos/이름-폭.webp", () => {
    expect(photoSrc("window-fjord", 1024)).toBe("/images/photos/window-fjord-1024.webp");
    expect(photoSrc("plane-sunset", 1672)).toBe("/images/photos/plane-sunset-1672.webp");
  });

  it("srcset — 폭 세 개를 'w' 단위로 · 작은 것부터 쉼표로", () => {
    expect(photoSrcSet("swiss-traveler")).toBe("/images/photos/swiss-traveler-640.webp 640w, /images/photos/swiss-traveler-1024.webp 1024w, /images/photos/swiss-traveler-1672.webp 1672w");
  });

  it("모든 사진의 srcset 이 같은 모양", () => {
    for (const n of PHOTO_NAMES) expect(photoSrcSet(n)).toMatch(new RegExp(`^(/images/photos/${n}-\\d+\\.webp \\d+w(, )?){3}$`));
  });

  it("sizes — 화면 폭 가득", () => {
    expect(PHOTO_SIZES).toBe("100vw");
  });
});

// 작업 0201 — 나라 사진 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   export const COUNTRY_PHOTO_NAMES = ["country-jpn", … , "country-eur"] as const   // 19개 나라 + 유로 기본 1장 = 20장
//   export function countryPhoto(iso: string): PhotoName | null                      // 나라(ISO alpha-3) → 사진 이름 · 유로 나라는 country-eur · 사진 없는 나라 · 모르는 값은 null (지금 사진을 씀)
//   PhotoName 은 화면 사진 5장 + 나라 사진 20장 (photoSrc · photoSrcSet 이 그대로 동작)
import { COUNTRY_PHOTO_NAMES, countryPhoto } from "./photo";

describe("countryPhoto", () => {
  it("사진이 있는 나라 → country-소문자코드", () => {
    expect(countryPhoto("JPN")).toBe("country-jpn");
    expect(countryPhoto("IND")).toBe("country-ind");
    expect(countryPhoto("TUR")).toBe("country-tur");
    expect(countryPhoto("USA")).toBe("country-usa");
  });
  it("유로 나라는 유럽 사진 한 장을 같이 씀", () => {
    for (const c of ["FRA", "DEU", "ITA", "ESP", "PRT", "NLD", "AUT", "GRC", "FIN"]) expect(countryPhoto(c)).toBe("country-eur");
  });
  it("사진 없는 나라 · 모르는 값 · 빈 값 → null (지금 사진)", () => {
    for (const c of ["ARE", "MYS", "IDN", "", "XXX", "toString", "__proto__"]) expect(countryPhoto(c)).toBeNull();
  });
  it("사진 이름 20장 · 나라 19 + 유럽 · 모두 srcset 규칙을 따름", () => {
    expect(COUNTRY_PHOTO_NAMES).toHaveLength(20);
    expect(COUNTRY_PHOTO_NAMES).toContain("country-eur");
    for (const n of COUNTRY_PHOTO_NAMES) expect(photoSrcSet(n)).toBe(`/images/photos/${n}-640.webp 640w, /images/photos/${n}-1024.webp 1024w, /images/photos/${n}-1672.webp 1672w`);
  });
});
