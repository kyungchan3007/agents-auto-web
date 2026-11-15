// 사진 머리 — 화면 맨 위 구간(라벨 · 큰 제목 · 설명)을 사진 위에 얹음 (작업 0175 · 초안 draft.html)
//   사진은 <img> (alt · srcset · 우선이면 fetchpriority high · 그 밖은 lazy) — 배경 이미지로 쓰지 않음
//   막(veil): light = 하늘 종이색 그라데이션 (데스크톱 왼쪽 → 오른쪽 · 모바일 아래 → 위)로 글자가 읽히게 · ultramarine = 울트라마린 막 + 흰 글자
//   이 부품만 그라데이션을 씀 (장식이 아니라 글자를 읽히게 하는 막)
import type { ReactNode } from "react";
import { PHOTO_SIZES, type PhotoName, photoSrc, photoSrcSet } from "../../lib/photo";

type Props = {
  name: PhotoName;
  alt: string;
  veil: "light" | "ultramarine";
  priority?: boolean;
  /** 사진 가운데 위치 — 초안: 직구 "center 40%" · 소개 "70% center" */
  position?: string;
  children: ReactNode;
};

// 막 — surface = 하늘 종이(#EAF4F2) · cheap = 울트라마린(#2438A8) · 가장 진한 쪽이 글자 자리
const VEIL = {
  light: "bg-gradient-to-t from-surface/95 from-0% via-surface/85 via-55% to-surface/20 sm:bg-gradient-to-r sm:from-surface/95 sm:from-0% sm:via-surface/85 sm:via-[38%] sm:to-surface/0 sm:to-70%",
  ultramarine: "bg-gradient-to-t from-pin-ink/90 from-0% via-cheap/55 via-60% to-cheap/10 sm:bg-gradient-to-r sm:from-pin-ink/85 sm:from-0% sm:via-cheap/55 sm:via-45% sm:to-cheap/0 sm:to-75%",
} as const;
const TEXT = { light: "", ultramarine: "text-foam" } as const;

export function PhotoHeader({ name, alt, veil, priority = false, position = "center", children }: Props) {
  return (
    <section data-testid="photo-header" data-veil={veil} className={`relative isolate flex min-h-[22rem] items-end overflow-hidden bg-surface sm:min-h-[26rem] ${TEXT[veil]}`}>
      <img
        data-testid="photo-header-img"
        src={photoSrc(name, 1024)}
        srcSet={photoSrcSet(name)}
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
      <div aria-hidden className={`absolute inset-0 -z-10 ${VEIL[veil]}`} />
      <div className="mx-auto w-full max-w-page px-4 py-10 sm:px-8 sm:py-14">{children}</div>
    </section>
  );
}
