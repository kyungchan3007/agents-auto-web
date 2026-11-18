"use client";

// 홈 맨 위 사진 — 인트로나 시트로 고른 나라 사진이 있으면 그 사진으로 · 없으면 기본 도착지 나라 사진 · 사진 없는 나라면 지금 사진 (작업 0201 · 0209)
// 안 골랐을 때(서버 HTML · 첫 그림)는 안내판 기본 도착지 나라 사진(작업 0209) · 마운트 뒤에 고른 값을 읽어 바뀜
import { PhotoHeader } from "@hav/ui/layout/photo-header";
import type { ComponentProps } from "react";
import { usePickedDestination } from "../hooks/use-picked-destination";

export function PickedPhotoHeader({ defaultCountry = null, ...props }: ComponentProps<typeof PhotoHeader> & { /** 안 골랐을 때 사진 나라 — 안내판 기본 도착지 (서버 HTML 에서 바로 · 작업 0209) */ defaultCountry?: string | null }) {
  const { picked } = usePickedDestination();
  return <PhotoHeader {...props} country={picked?.country ?? defaultCountry} />;
}
