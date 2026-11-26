"use client";

// 블프 hero 기간 맞춤 (작업 0381) — 평소엔 head 의 인라인 스크립트가 첫 그림 전에 html 의 data-hero 를 정함 · 스크립트가 꺼졌거나 실패했을 때를 위해 붙은 뒤 같은 판정으로 한 번 더 맞춤
import { useEffect } from "react";
import { HERO_ATTR, heroOf } from "./bf-period";

export function useBfPeriod(): void {
  useEffect(() => {
    document.documentElement.setAttribute(HERO_ATTR, heroOf(Date.now()));
  }, []);
}
