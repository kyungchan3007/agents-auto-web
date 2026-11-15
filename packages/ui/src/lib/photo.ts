// 화면별 사진 — 파일 이름 · 폭별 srcset (작업 0175) · 사진 5장은 사용자가 직접 만든 것 (출처 표시 불필요)
// 정적 내보내기라 next/image 가 크기를 바꿔 주지 않아, 미리 만든 폭별 WebP(apps/web/scripts/make-photos.mjs)를 srcset 으로 고름
export const PHOTO_NAMES = ["window-fjord", "window-sunrise", "swiss-traveler", "plane-below", "plane-sunset"] as const;
export type PhotoName = (typeof PHOTO_NAMES)[number];

/** 폭별 파일 — 가장 큰 것이 원본 폭 */
export const PHOTO_WIDTHS = [640, 1024, 1672] as const;

export const photoSrc = (name: PhotoName, width: number): string => `/images/photos/${name}-${width}.webp`;

export const photoSrcSet = (name: PhotoName): string => PHOTO_WIDTHS.map((w) => `${photoSrc(name, w)} ${w}w`).join(", ");

/** 맨 위 구간은 화면 폭 가득 */
export const PHOTO_SIZES = "100vw";
