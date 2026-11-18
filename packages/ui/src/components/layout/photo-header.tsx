// 사진 머리 — 화면 맨 위 구간(라벨 · 큰 제목 · 설명)을 사진 위에 얹음 (작업 0175 · 초안 draft.html)
//   사진은 <img> (alt · srcset · 우선이면 fetchpriority high · 그 밖은 lazy) — 배경 이미지로 쓰지 않음
//   막(veil): light = 하늘 종이색 그라데이션 (데스크톱 왼쪽 → 오른쪽 · 모바일 아래 → 위)로 글자가 읽히게 · ultramarine = 울트라마린 막 + 흰 글자
//   이 부품만 그라데이션을 씀 (장식이 아니라 글자를 읽히게 하는 막)
import type { ReactNode } from "react";
import { PHOTO_SIZES, type PhotoName, countryPhoto, headerPhoto, photoSrc, photoSrcSet } from "../../lib/photo";

// 나라 사진 이름 · 주소를 화면(기능 폴더)이 쓰도록 다시 내보냄 — @hav/ui 의 공개 경로는 components 아래뿐 (작업 0201)
export { countryPhoto, photoSrc };

type Props = {
  name: PhotoName;
  /** 고른 나라(ISO alpha-3) — 그 나라 사진이 있으면 name 대신 씀 · 없으면 name (작업 0201) */
  country?: string | null;
  alt: string;
  veil: "light" | "ultramarine";
  priority?: boolean;
  /** 사진 가운데 위치 — 초안: 직구 "center 40%" · 소개 "70% center" */
  position?: string;
  /** 사진 아래 끝을 하늘 종이색으로 부드럽게 사라지게 — 아래 구간이 사진에 걸쳐 올라올 때 (작업 0177 · 홈) */
  fadeBottom?: boolean;
  /** 휴대폰에서 덮개를 글자 뒤 아래쪽에만 — 위쪽은 사진이 그대로 보임 (작업 0209 · 홈) */
  clearTop?: boolean;
  children: ReactNode;
};

// 막 — surface = 하늘 종이(#EAF4F2) · cheap = 울트라마린(#2438A8) · 가장 진한 쪽이 글자 자리
const VEIL = {
  light: "bg-gradient-to-t from-surface/95 from-0% via-surface/85 via-55% to-surface/20 sm:bg-gradient-to-r sm:from-surface/95 sm:from-0% sm:via-surface/85 sm:via-[38%] sm:to-surface/0 sm:to-70%",
  ultramarine: "bg-gradient-to-t from-pin-ink/90 from-0% via-cheap/55 via-60% to-cheap/10 sm:bg-gradient-to-r sm:from-pin-ink/85 sm:from-0% sm:via-cheap/55 sm:via-45% sm:to-cheap/0 sm:to-75%",
} as const;
// 휴대폰 덮개: 글자 자리(아래 ~ 60%)는 진하게 · 그 위는 90% 지점까지 서서히 걷어 맨 위 10% 는 투명 — 사진이 위에서 보임 (홈 글자는 위에서 22% 아래부터) · 넓은 화면(sm:)은 그대로 (작업 0209)
const CLEAR_TOP = "bg-gradient-to-t from-surface/95 from-0% via-surface/90 via-60% to-surface/0 to-90% sm:bg-gradient-to-r sm:from-surface/95 sm:from-0% sm:via-surface/85 sm:via-[38%] sm:to-surface/0 sm:to-70%";
const TEXT = { light: "", ultramarine: "text-foam" } as const;

export function PhotoHeader({ name, country, alt, veil, priority = false, position = "center", fadeBottom = false, clearTop = false, children }: Props) {
  const shown: PhotoName = headerPhoto(name, country);
  return (
    <section data-testid="photo-header" data-veil={veil} className={`group/photo relative isolate flex min-h-[22rem] items-end overflow-hidden bg-surface sm:min-h-[26rem] ${TEXT[veil]}`}>
      <img
        data-testid="photo-header-img"
        src={photoSrc(shown, 1024)}
        srcSet={photoSrcSet(shown)}
        sizes={PHOTO_SIZES}
        alt={alt}
        width={1672}
        height={941}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        className="absolute inset-0 -z-20 size-full object-cover"
        style={{ objectPosition: position }}
      />
      <div data-testid="photo-veil" aria-hidden className={`absolute inset-0 -z-10 ${clearTop && veil === "light" ? CLEAR_TOP : VEIL[veil]}`} />
      {fadeBottom && <div data-testid="photo-fade-bottom" aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-24 bg-gradient-to-b from-transparent to-surface sm:h-32" />}
      <div className="w-full px-4 py-10 sm:px-8 sm:py-14">
        <div className="mx-auto max-w-page">{children}</div>
      </div>
    </section>
  );
}
