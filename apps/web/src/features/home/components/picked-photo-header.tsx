"use client";

// 홈 맨 위 사진 — 인트로나 시트로 고른 나라 사진이 있으면 그 사진으로 · 없으면 지금 사진 (작업 0201)
// 서버 HTML 과 첫 그림은 지금과 같고(window-fjord) 마운트 뒤에 고른 값을 읽어 바뀜
import { PhotoHeader } from "@hav/ui/layout/photo-header";
import type { ComponentProps } from "react";
import { usePickedDestination } from "../hooks/use-picked-destination";

export function PickedPhotoHeader(props: ComponentProps<typeof PhotoHeader>) {
  const { picked } = usePickedDestination();
  return <PhotoHeader {...props} country={picked?.country ?? null} />;
}
