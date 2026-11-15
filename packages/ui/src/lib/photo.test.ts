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
