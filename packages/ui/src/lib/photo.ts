// 화면별 사진 — 파일 이름 · 폭별 srcset (작업 0175) · 사진 5장은 사용자가 직접 만든 것 (출처 표시 불필요)
// 정적 내보내기라 next/image 가 크기를 바꿔 주지 않아, 미리 만든 폭별 WebP(apps/web/scripts/make-photos.mjs)를 srcset 으로 고름
export const PHOTO_NAMES = ["window-fjord", "window-sunrise", "swiss-traveler", "plane-below", "plane-sunset"] as const;

// 나라 사진 20장 (작업 0201) — 사용자가 GPT 로 만든 것(출처 표시 불필요) · 나라(ISO alpha-3) → 사진 · 유로 나라는 유럽 한 장을 같이 씀 · 없는 나라는 null → 화면 기본 사진
const COUNTRY_CODES = ["jpn", "twn", "hkg", "chn", "tha", "vnm", "khm", "phl", "sgp", "ind", "gbr", "che", "swe", "tur", "usa", "can", "mex", "aus", "nzl"] as const;
export const COUNTRY_PHOTO_NAMES = [...COUNTRY_CODES.map((c) => `country-${c}` as const), "country-eur"] as const;

export type PhotoName = (typeof PHOTO_NAMES)[number] | (typeof COUNTRY_PHOTO_NAMES)[number];

const EURO_COUNTRIES = ["FRA", "DEU", "ITA", "ESP", "PRT", "NLD", "AUT", "GRC", "FIN"];

/** 나라(ISO alpha-3) → 그 나라 사진 이름 · 유로 나라는 country-eur · 사진 없는 나라 · 모르는 값은 null (쓰는 쪽이 지금 사진을 씀) */
export function countryPhoto(iso: string | null | undefined): PhotoName | null {
  if (!iso) return null;
  if (EURO_COUNTRIES.includes(iso)) return "country-eur";
  const code = iso.toLowerCase();
  return (COUNTRY_CODES as readonly string[]).includes(code) && iso === iso.toUpperCase() ? (`country-${code}` as PhotoName) : null;
}

/** 폭별 파일 — 가장 큰 것이 원본 폭 */
export const PHOTO_WIDTHS = [640, 1024, 1672] as const;

export const photoSrc = (name: PhotoName, width: number): string => `/images/photos/${name}-${width}.webp`;

export const photoSrcSet = (name: PhotoName): string => PHOTO_WIDTHS.map((w) => `${photoSrc(name, w)} ${w}w`).join(", ");

/** 맨 위 구간은 화면 폭 가득 */
export const PHOTO_SIZES = "100vw";
